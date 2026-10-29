import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import type { Logger } from '../../../shared/logger.js';
import type { FileWriter } from '../../../shared/storage.js';
import type { TemplateSource } from '../../catalog/application/ports.js';
import {
  CopyVerificationError,
  DocumentNotFoundError,
  editorKeyFor,
  versionKey,
  type Document,
} from '../domain/document.js';
import type { DocumentRepository, EditedFileDownload } from './ports.js';

export type SaveOutcome = 'saved' | 'stale-key';

/**
 * The only code that changes documents (AD-6). Templates are reached through the catalog's
 * TemplateSource port and copied, never opened for writing (AD-2, AD-13).
 */
export class WorkspaceService {
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(
    private readonly repo: DocumentRepository,
    private readonly files: FileWriter,
    private readonly templates: TemplateSource,
    private readonly log: Logger,
  ) {}

  /** Use template: copy-on-create from one fixed revision descriptor (AD-13). */
  async createDocumentFromTemplate(templateId: string, now = new Date().toISOString()): Promise<Document> {
    const source = this.templates.getPublishedRevision(templateId);
    const id = randomUUID();
    const storageKey = versionKey(id, 1, source.kind);

    const copiedSha = await this.files.copy(source.storageKey, storageKey);
    if (copiedSha !== source.sha256) throw new CopyVerificationError();

    const document: Document = {
      id,
      kind: source.kind,
      title: source.name,
      origin: { templateId: source.templateId, revision: source.revision, templateName: source.name },
      version: 1,
      storageKey,
      editorKey: editorKeyFor(id, 1),
      createdAt: now,
      updatedAt: now,
    };
    this.repo.insert(document);
    this.log.info({ documentId: id, templateId, revision: source.revision }, 'workspace.document.created');
    return document;
  }

  document(id: string): Document {
    const document = this.repo.findById(id);
    if (!document) throw new DocumentNotFoundError(id);
    return document;
  }

  documents(): Document[] {
    return this.repo.listNewestFirst();
  }

  /** Streams a specific version. Used by downloads (current version) and Document Server. */
  openVersion(document: Document, version = document.version): Readable {
    return this.files.open(versionKey(document.id, version, document.kind));
  }

  /**
   * Stores an edited version reported by the editor (AD-6). Serialised per document; the
   * callback's key must equal the current editor key, so a duplicate or late callback for an
   * already-saved version changes nothing.
   */
  saveEditedVersion(documentId: string, callbackKey: string, download: EditedFileDownload): Promise<SaveOutcome> {
    return this.withLock(documentId, async () => {
      const document = this.document(documentId);
      if (document.editorKey !== callbackKey) {
        this.log.warn({ documentId, callbackKey, editorKey: document.editorKey }, 'callback key is not current; ignored');
        return 'stale-key';
      }

      const nextVersion = document.version + 1;
      const storageKey = versionKey(document.id, nextVersion, document.kind);
      const temp = this.files.tempPath();
      try {
        await download(temp);
        await this.files.commitTemp(temp, storageKey);
      } finally {
        await this.files.removeTemp(temp);
      }

      const saved = this.repo.saveVersion(document.id, document.version, {
        version: nextVersion,
        storageKey,
        editorKey: editorKeyFor(document.id, nextVersion),
        updatedAt: new Date().toISOString(),
      });
      if (!saved) throw new Error(`Document ${documentId} changed during save.`);
      this.log.info({ documentId, version: nextVersion }, 'workspace.document.saved');
      return 'saved';
    });
  }

  private async withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(task);
    this.locks.set(key, run);
    try {
      return await run;
    } finally {
      if (this.locks.get(key) === run) this.locks.delete(key);
    }
  }
}

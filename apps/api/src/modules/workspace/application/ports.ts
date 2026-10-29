import type { Document } from '../domain/document.js';

export interface DocumentRepository {
  insert(document: Document): void;
  findById(id: string): Document | undefined;
  listNewestFirst(): Document[];
  /** Moves the document to a new version only if it is still at `expectedVersion`. */
  saveVersion(id: string, expectedVersion: number, next: Pick<Document, 'version' | 'storageKey' | 'editorKey' | 'updatedAt'>): boolean;
}

/** Writes the edited file to `targetPath`. Supplied by the editor module per callback. */
export type EditedFileDownload = (targetPath: string) => Promise<void>;

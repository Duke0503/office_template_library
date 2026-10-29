import type { Readable } from 'node:stream';
import type { TemplateKind } from '@otl/shared';
import type { FileReader } from '../../../shared/storage.js';
import {
  PreviewNotFoundError,
  revisionKeys,
  TemplateArchivedError,
  TemplateNotFoundError,
  type Template,
} from '../domain/template.js';
import type {
  CategoryWithCount,
  GalleryFilter,
  PublishedRevision,
  TemplateRepository,
  TemplateSource,
} from './ports.js';

/** Catalog queries, plus the TemplateSource port the workspace depends on. */
export class CatalogService implements TemplateSource {
  constructor(
    private readonly repo: TemplateRepository,
    private readonly files: FileReader,
  ) {}

  gallery(filter: GalleryFilter): Template[] {
    return this.repo.listPublished(filter);
  }

  categories(kind: TemplateKind): CategoryWithCount[] {
    return this.repo.categoriesWithPublished(kind);
  }

  /** Archived templates stay readable by id so old links show a clear state, not a 404. */
  template(id: string): Template {
    const template = this.repo.findById(id);
    if (!template) throw new TemplateNotFoundError(id);
    return template;
  }

  openPreview(templateId: string, revision: number, n: number): Readable {
    const rev = this.repo.findRevision(templateId, revision);
    if (!rev || n < 1 || n > rev.previewCount) throw new PreviewNotFoundError();
    return this.files.open(revisionKeys.preview(templateId, revision, n));
  }

  getPublishedRevision(templateId: string): PublishedRevision {
    const template = this.template(templateId);
    if (template.status !== 'published') throw new TemplateArchivedError(templateId);
    return {
      templateId: template.id,
      revision: template.current.revision,
      kind: template.kind,
      name: template.name,
      storageKey: template.current.storageKey,
      sha256: template.current.sha256,
    };
  }
}

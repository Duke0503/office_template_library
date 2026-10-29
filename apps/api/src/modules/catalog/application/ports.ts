import type { TemplateKind } from '@otl/shared';
import type { Category, Template, TemplateRevision, TemplateStatus } from '../domain/template.js';

export interface GalleryFilter {
  kind: TemplateKind;
  q?: string;
  categorySlug?: string;
}

export interface CategoryWithCount extends Category {
  templateCount: number;
}

export interface TemplateRepository {
  listPublished(filter: GalleryFilter): Template[];
  findById(id: string): Template | undefined;
  findByKindAndSlug(kind: TemplateKind, slug: string): Template | undefined;
  findRevision(templateId: string, revision: number): TemplateRevision | undefined;
  categoriesWithPublished(kind: TemplateKind): CategoryWithCount[];
  upsertCategory(slug: string, name: string, sortOrder: number): Category;
  /** Inserts a new template with its first revision, in one transaction. */
  createTemplate(input: NewTemplate): void;
  /** Adds the next revision and points the template at it, in one transaction. */
  addRevision(revision: TemplateRevision, now: string): void;
  updateMetadata(id: string, patch: TemplateMetadata, now: string): void;
  listAll(): { id: string; kind: TemplateKind; slug: string; status: TemplateStatus }[];
}

export interface TemplateMetadata {
  name: string;
  description: string;
  categoryId: string;
  status: TemplateStatus;
  sortOrder: number;
}

export interface NewTemplate extends TemplateMetadata {
  id: string;
  kind: TemplateKind;
  slug: string;
  revision: TemplateRevision;
  now: string;
}

/**
 * The catalog's port for the workspace (AD-5, AD-13): one fixed descriptor of the revision
 * a document is copied from.
 */
export interface PublishedRevision {
  templateId: string;
  revision: number;
  kind: TemplateKind;
  name: string;
  storageKey: string;
  sha256: string;
}

export interface TemplateSource {
  getPublishedRevision(templateId: string): PublishedRevision;
}

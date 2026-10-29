import type { TemplateKind } from '@otl/shared';
import { ConflictError, NotFoundError } from '../../../shared/errors.js';

export type TemplateStatus = 'published' | 'archived';

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface TemplateRevision {
  templateId: string;
  revision: number;
  storageKey: string;
  sha256: string;
  sizeBytes: number;
  previewCount: number;
}

export interface Template {
  id: string;
  kind: TemplateKind;
  slug: string;
  name: string;
  description: string;
  category: Category;
  status: TemplateStatus;
  current: TemplateRevision;
  updatedAt: string;
}

/** Storage layout for one template revision (AD-4, AD-14). Previews are numbered from 1. */
export const revisionKeys = {
  source: (templateId: string, revision: number, extension: string) =>
    `templates/${templateId}/r${revision}/source.${extension}`,
  preview: (templateId: string, revision: number, n: number) =>
    `templates/${templateId}/r${revision}/previews/${n}.png`,
};

export class TemplateNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('TEMPLATE_NOT_FOUND', `No template with id ${id}.`);
  }
}

export class TemplateArchivedError extends ConflictError {
  constructor(id: string) {
    super('TEMPLATE_ARCHIVED', `Template ${id} is archived and cannot be used for new documents.`);
  }
}

export class PreviewNotFoundError extends NotFoundError {
  constructor() {
    super('PREVIEW_NOT_FOUND', 'No such preview for this template revision.');
  }
}

/** A published template must have at least one preview (domain invariant). */
export function assertPublishable(previewCount: number, slug: string) {
  if (previewCount < 1) {
    throw new Error(`Template ${slug} has no preview images; render them with npm run templates:render.`);
  }
}

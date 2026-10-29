// The API contract shared by apps/api (request validation) and apps/web (types) (AD-8).

import { z } from 'zod';
import { TEMPLATE_KINDS } from './kinds.js';

export const templateKindSchema = z.enum(TEMPLATE_KINDS);

// ------------------------------------------------------------------ errors ---

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'TEMPLATE_NOT_FOUND',
  'TEMPLATE_ARCHIVED',
  'PREVIEW_NOT_FOUND',
  'DOCUMENT_NOT_FOUND',
  'DOCUMENT_FILE_MISSING',
  'COPY_VERIFICATION_FAILED',
  'INVALID_FILE_TOKEN',
  'INVALID_EDITOR_TOKEN',
  'ROUTE_NOT_FOUND',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}

// --------------------------------------------------------------- catalog ---

export const galleryQuerySchema = z.object({
  kind: templateKindSchema,
  q: z.string().trim().max(100).optional(),
  category: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});
export type GalleryQuery = z.infer<typeof galleryQuerySchema>;

export const categoriesQuerySchema = z.object({ kind: templateKindSchema });

export interface CategoryDto {
  slug: string;
  name: string;
  templateCount: number;
}

export interface PreviewDto {
  /** 1-based; preview 1 is the thumbnail (AD-14). */
  n: number;
  url: string;
}

export interface TemplateSummaryDto {
  id: string;
  kind: z.infer<typeof templateKindSchema>;
  slug: string;
  name: string;
  description: string;
  category: { slug: string; name: string };
  revision: number;
  thumbnailUrl: string;
  previewCount: number;
}

export interface TemplateDetailDto extends TemplateSummaryDto {
  /** Archived templates stay viewable but cannot be used (D4). */
  status: 'published' | 'archived';
  previews: PreviewDto[];
  updatedAt: string;
}

export interface ListResponse<T> {
  items: T[];
}

// ------------------------------------------------------------- workspace ---

export interface DocumentDto {
  id: string;
  kind: z.infer<typeof templateKindSchema>;
  title: string;
  origin: { templateId: string; revision: number; templateName: string };
  version: number;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
}

// ---------------------------------------------------------------- editor ---

export interface EditorConfigResponse {
  /** Public Document Server origin the browser loads the editor script from. */
  documentServerUrl: string;
  /** Signed ONLYOFFICE config, passed unchanged to the editor. */
  config: Record<string, unknown>;
}

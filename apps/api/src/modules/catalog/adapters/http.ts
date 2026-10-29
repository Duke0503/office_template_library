import {
  categoriesQuerySchema,
  galleryQuerySchema,
  type CategoryDto,
  type ListResponse,
  type TemplateDetailDto,
  type TemplateSummaryDto,
} from '@otl/shared';
import { Router } from 'express';
import { z } from 'zod';
import type { CatalogService } from '../application/catalog-service.js';
import type { Template } from '../domain/template.js';

// Preview URLs carry the revision, so they never change content and can be cached forever (AD-14).
const previewUrl = (t: Template, n: number) => `/api/templates/${t.id}/revisions/${t.current.revision}/previews/${n}`;

export function toSummary(t: Template): TemplateSummaryDto {
  return {
    id: t.id,
    kind: t.kind,
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: { slug: t.category.slug, name: t.category.name },
    revision: t.current.revision,
    thumbnailUrl: previewUrl(t, 1),
    previewCount: t.current.previewCount,
  };
}

function toDetail(t: Template): TemplateDetailDto {
  return {
    ...toSummary(t),
    status: t.status,
    previews: Array.from({ length: t.current.previewCount }, (_, i) => ({ n: i + 1, url: previewUrl(t, i + 1) })),
    updatedAt: t.updatedAt,
  };
}

const previewParams = z.object({
  id: z.string(),
  rev: z.coerce.number().int().positive(),
  n: z.coerce.number().int().nonnegative(),
});

export function catalogRouter(catalog: CatalogService): Router {
  const router = Router();

  router.get('/categories', (req, res) => {
    const { kind } = categoriesQuerySchema.parse(req.query);
    const body: ListResponse<CategoryDto> = {
      items: catalog.categories(kind).map(({ slug, name, templateCount }) => ({ slug, name, templateCount })),
    };
    res.json(body);
  });

  router.get('/templates', (req, res) => {
    const query = galleryQuerySchema.parse(req.query);
    const items = catalog.gallery({ kind: query.kind, q: query.q || undefined, categorySlug: query.category });
    const body: ListResponse<TemplateSummaryDto> = { items: items.map(toSummary) };
    res.json(body);
  });

  router.get('/templates/:id', (req, res) => {
    res.json(toDetail(catalog.template(req.params.id)));
  });

  router.get('/templates/:id/revisions/:rev/previews/:n', (req, res, next) => {
    const { id, rev, n } = previewParams.parse(req.params);
    const stream = catalog.openPreview(id, rev, n);
    res.type('png').set('Cache-Control', 'public, max-age=31536000, immutable');
    stream.on('error', next).pipe(res);
  });

  return router;
}

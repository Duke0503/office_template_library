import { kindOf, type DocumentDto, type ListResponse } from '@otl/shared';
import { Router } from 'express';
import type { WorkspaceService } from '../application/workspace-service.js';
import type { Document } from '../domain/document.js';

export function toDocumentDto(d: Document): DocumentDto {
  return {
    id: d.id,
    kind: d.kind,
    title: d.title,
    origin: d.origin,
    version: d.version,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    downloadUrl: `/api/documents/${d.id}/download`,
  };
}

/** A file name safe for Content-Disposition. */
function downloadName(d: Document) {
  const base = d.title.replace(/[^\p{L}\p{N} ._-]+/gu, '').trim() || 'document';
  return `${base}.${kindOf(d.kind).extension}`;
}

export function workspaceRouter(workspace: WorkspaceService): Router {
  const router = Router();

  router.post('/templates/:id/documents', async (req, res) => {
    const document = await workspace.createDocumentFromTemplate(req.params.id);
    res.status(201).location(`/api/documents/${document.id}`).json(toDocumentDto(document));
  });

  router.get('/documents', (_req, res) => {
    const body: ListResponse<DocumentDto> = { items: workspace.documents().map(toDocumentDto) };
    res.json(body);
  });

  router.get('/documents/:id', (req, res) => {
    res.json(toDocumentDto(workspace.document(req.params.id)));
  });

  router.get('/documents/:id/download', (req, res, next) => {
    const document = workspace.document(req.params.id);
    res.attachment(downloadName(document)).type(kindOf(document.kind).mimeType).set('Cache-Control', 'no-store');
    workspace.openVersion(document).on('error', next).pipe(res);
  });

  return router;
}

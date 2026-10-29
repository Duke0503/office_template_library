import { kindOf } from '@otl/shared';
import { Router } from 'express';
import { z } from 'zod';
import type { Logger } from '../../shared/logger.js';
import type { WorkspaceService } from '../workspace/application/workspace-service.js';
import { CallbackStatus, InvalidEditorTokenError, type OnlyofficeGateway } from './onlyoffice.js';

const fileParams = z.object({ id: z.string(), version: z.coerce.number().int().positive() });

export function editorRouter(gateway: OnlyofficeGateway, workspace: WorkspaceService, log: Logger): Router {
  const router = Router();

  router.get('/documents/:id/editor-config', (req, res) => {
    res.set('Cache-Control', 'no-store').json(gateway.editorConfig(workspace.document(req.params.id)));
  });

  // Document Server fetches the file here, with the signed, version-bound token (AD-7).
  router.get('/files/documents/:id/versions/:version', (req, res, next) => {
    const { id, version } = fileParams.parse(req.params);
    gateway.verifyFileToken(req.query.token, id, version);
    const document = workspace.document(id);
    res.type(kindOf(document.kind).mimeType).set('Cache-Control', 'no-store');
    workspace.openVersion(document, version).on('error', next).pipe(res);
  });

  // Document Server callback. {"error":0} only once the outcome is final (AD-7).
  router.post('/editor/callback/:id', async (req, res) => {
    const documentId = req.params.id;
    let claims;
    try {
      claims = gateway.verifyCallback(req.get('authorization'), req.body);
    } catch (error) {
      if (error instanceof InvalidEditorTokenError) {
        log.warn({ documentId }, 'rejected unsigned editor callback');
        res.status(403).json({ error: 1 });
        return;
      }
      throw error;
    }

    log.info({ documentId, status: claims.status, key: claims.key }, 'editor callback');
    try {
      if (claims.status === CallbackStatus.ReadyForSaving) {
        if (!claims.url) throw new Error('Callback status 2 without a file URL.');
        const url = claims.url;
        await workspace.saveEditedVersion(documentId, claims.key, (target) => gateway.downloadEditedFile(url, target));
      } else if (claims.status === CallbackStatus.SavingError || claims.status === CallbackStatus.ForceSaveError) {
        log.error({ documentId, status: claims.status }, 'Document Server reported a saving error');
      }
      res.json({ error: 0 });
    } catch (error) {
      log.error({ documentId, err: error }, 'saving the edited version failed');
      res.json({ error: 1 });
    }
  });

  return router;
}

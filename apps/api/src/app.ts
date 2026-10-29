import { existsSync } from 'node:fs';
import path from 'node:path';
import type { ApiErrorBody } from '@otl/shared';
import express, { type ErrorRequestHandler } from 'express';
import { pinoHttp } from 'pino-http';
import { ZodError } from 'zod';
import type { Config } from './config.js';
import { CatalogService } from './modules/catalog/application/catalog-service.js';
import { TemplateImporter } from './modules/catalog/application/template-importer.js';
import { DrizzleTemplateRepository } from './modules/catalog/adapters/drizzle-template-repository.js';
import { catalogRouter } from './modules/catalog/adapters/http.js';
import { editorRouter } from './modules/editor/http.js';
import { OnlyofficeGateway } from './modules/editor/onlyoffice.js';
import { WorkspaceService } from './modules/workspace/application/workspace-service.js';
import { DrizzleDocumentRepository } from './modules/workspace/adapters/drizzle-document-repository.js';
import { workspaceRouter } from './modules/workspace/adapters/http.js';
import type { Db } from './shared/db.js';
import { AppError } from './shared/errors.js';
import type { Logger } from './shared/logger.js';
import { LocalFileStorage, StorageKeyError } from './shared/storage.js';

export interface AppDeps {
  config: Config;
  db: Db;
  log: Logger;
  storage: LocalFileStorage;
  /** Replaces the Document Server gateway in tests. */
  gateway?: OnlyofficeGateway;
}

/** Composition root (AD-1): the only place adapters are wired into ports. */
export function createApp({ config, db, log, storage, gateway: gatewayOverride }: AppDeps) {
  const templateRepo = new DrizzleTemplateRepository(db);
  // Runtime code sees storage only as a reader for templates; the importer is the one writer (AD-2).
  const catalog = new CatalogService(templateRepo, storage);
  const importer = new TemplateImporter(templateRepo, storage, log);
  const workspace = new WorkspaceService(new DrizzleDocumentRepository(db), storage, catalog, log);
  const gateway =
    gatewayOverride ??
    new OnlyofficeGateway({
      jwtSecret: config.ONLYOFFICE_JWT_SECRET,
      appSecret: config.APP_SECRET,
      publicDocServerUrl: config.PUBLIC_DOCSERVER_URL,
      internalDocServerUrl: config.DOCSERVER_INTERNAL_URL,
      appInternalUrl: config.APP_INTERNAL_URL,
    });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(pinoHttp({ logger: log, autoLogging: { ignore: (req) => req.url?.includes('/previews/') ?? false } }));
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.get('/health', async (_req, res) => {
    res.json({ status: 'ok', documentServer: (await gateway.isReachable()) ? 'up' : 'down' });
  });
  api.use(catalogRouter(catalog));
  api.use(workspaceRouter(workspace));
  api.use(editorRouter(gateway, workspace, log));
  api.use((_req, res) => {
    res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'No such API route.' } } satisfies ApiErrorBody);
  });
  app.use('/api', api);

  if (config.WEB_DIST_DIR && existsSync(config.WEB_DIST_DIR)) {
    app.use(express.static(config.WEB_DIST_DIR, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(config.WEB_DIST_DIR, 'index.html')));
  }

  app.use(errorHandler(log));
  return { app, importer, catalog, workspace };
}

/** Maps errors to the API error envelope (AD-8). Never leaks a stack trace. */
function errorHandler(log: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    let status = 500;
    let body: ApiErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'The server could not complete the request.' } };
    if (error instanceof AppError) {
      status = error.status;
      body = { error: { code: error.code, message: error.message } };
    } else if (error instanceof ZodError) {
      status = 400;
      body = { error: { code: 'VALIDATION_FAILED', message: error.issues.map((i) => `${i.path.join('.') || 'request'}: ${i.message}`).join('; ') } };
    } else if (error instanceof StorageKeyError) {
      status = 400;
      body = { error: { code: 'VALIDATION_FAILED', message: 'Invalid file reference.' } };
    } else if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      status = 404;
      body = { error: { code: 'DOCUMENT_FILE_MISSING', message: 'The stored file is missing.' } };
    }
    if (status >= 500) log.error({ err: error, url: req.url }, 'request failed');
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(status).json(body);
  };
}

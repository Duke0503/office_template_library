import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDb } from './shared/db.js';
import { createLogger } from './shared/logger.js';
import { LocalFileStorage } from './shared/storage.js';

const config = loadConfig();
const log = createLogger(config.LOG_LEVEL);
const { db, close } = openDb(config.dbFile);
const storage = new LocalFileStorage(config.STORAGE_ROOT);
await storage.init();

const { app, importer } = createApp({ config, db, log, storage });

// The startup import finishes before the server listens (AD-11).
try {
  await importer.run(config.MANIFEST_DIR);
} catch (error) {
  log.error({ err: error }, 'template manifest could not be read; serving the existing catalog');
}

const server = app.listen(config.PORT, () => log.info({ port: config.PORT }, 'server listening'));

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      close();
      process.exit(0);
    });
  });
}

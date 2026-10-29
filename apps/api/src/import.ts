// CLI: npm run templates:import. Imports templates/manifest.json without restarting (AD-4).
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

const { importer } = createApp({ config, db, log, storage });
const report = await importer.run(config.MANIFEST_DIR);
close();
console.log(JSON.stringify(report, null, 2));
process.exit(report.failed.length ? 1 : 0);

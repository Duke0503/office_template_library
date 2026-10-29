import { chmod, copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { OnlyofficeGateway } from '../src/modules/editor/onlyoffice.js';
import { openDb } from '../src/shared/db.js';
import { createLogger } from '../src/shared/logger.js';
import { LocalFileStorage } from '../src/shared/storage.js';

const SEED_FILES = path.resolve(import.meta.dirname, '../../../templates/files');

// Smallest valid PNG (1x1, transparent).
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export interface ManifestEntry {
  kind: 'docx' | 'pptx';
  slug: string;
  name: string;
  category: string;
  description: string;
  file: string;
  previews: string;
  archived?: boolean;
}

export const JWT_SECRET = 'test-onlyoffice-secret-123456';

/** Document Server stand-in: edited files come from memory instead of HTTP. */
export class FakeGateway extends OnlyofficeGateway {
  editedFile: Buffer = Buffer.from('edited');
  downloads: string[] = [];

  override async downloadEditedFile(url: string, targetPath: string) {
    this.downloads.push(url);
    await writeFile(targetPath, this.editedFile);
  }

  override async isReachable() {
    return false;
  }
}

export async function createHarness() {
  const root = await mkdtemp(path.join(tmpdir(), 'otl-test-'));
  const manifestDir = path.join(root, 'manifest');
  await mkdir(path.join(manifestDir, 'files'), { recursive: true });

  const entries: ManifestEntry[] = [];
  for (const file of await readdir(SEED_FILES)) {
    const [slug, ext] = file.split('.') as [string, 'docx' | 'pptx'];
    await copyFile(path.join(SEED_FILES, file), path.join(manifestDir, 'files', file));
    const previews = `previews/${slug}`;
    await mkdir(path.join(manifestDir, previews), { recursive: true });
    await writeFile(path.join(manifestDir, previews, '1.png'), PNG);
    await writeFile(path.join(manifestDir, previews, '2.png'), PNG);
    entries.push({
      kind: ext,
      slug,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      category: slug.includes('lesson') ? 'education' : 'business',
      description: `Sample ${slug} template.`,
      file: `files/${file}`,
      previews,
    });
  }

  const writeManifest = (templates: ManifestEntry[]) =>
    writeFile(
      path.join(manifestDir, 'manifest.json'),
      JSON.stringify({
        categories: [
          { slug: 'business', name: 'Business' },
          { slug: 'education', name: 'Education' },
        ],
        templates,
      }),
    );
  await writeManifest(entries);

  const config = loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MANIFEST_DIR: manifestDir,
    STORAGE_ROOT: path.join(root, 'storage'),
    ONLYOFFICE_JWT_SECRET: JWT_SECRET,
    APP_SECRET: 'test-app-secret-1234567890',
    APP_INTERNAL_URL: 'http://app:3000',
    DOCSERVER_INTERNAL_URL: 'http://documentserver',
    PUBLIC_DOCSERVER_URL: 'http://localhost:8080',
  });
  const log = createLogger('silent');
  const { db, close } = openDb(config.dbFile);
  const storage = new LocalFileStorage(config.STORAGE_ROOT);
  await storage.init();
  const gateway = new FakeGateway({
    jwtSecret: JWT_SECRET,
    appSecret: config.APP_SECRET,
    publicDocServerUrl: config.PUBLIC_DOCSERVER_URL,
    internalDocServerUrl: config.DOCSERVER_INTERNAL_URL,
    appInternalUrl: config.APP_INTERNAL_URL,
  });
  const built = createApp({ config, db, log, storage, gateway });
  await built.importer.run(manifestDir);

  return {
    ...built,
    config,
    storage,
    gateway,
    manifestDir,
    entries,
    writeManifest,
    async cleanup() {
      close();
      // Stored template files are read-only; make them writable so the temp dir can be removed.
      await chmodTree(root);
      await rm(root, { recursive: true, force: true });
    },
  };
}

async function chmodTree(dir: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await chmodTree(full);
    else await chmod(full, 0o644);
  }
}

export type Harness = Awaited<ReturnType<typeof createHarness>>;

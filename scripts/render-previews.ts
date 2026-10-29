// Renders preview images for every template in templates/manifest.json through the
// ONLYOFFICE conversion API, writing templates/previews/<slug>/1.png, 2.png, ... (AD-14).
// Previews are committed, so the app never needs Document Server to show the gallery.
//
// Needs Document Server running: docker compose up -d documentserver
// Run: npm run templates:render [-- slug ...]

import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import AdmZip from 'adm-zip';
import jwt from 'jsonwebtoken';

const ROOT = path.resolve(import.meta.dirname, '../templates');
const DOCSERVER_URL = process.env.DOCSERVER_URL ?? 'http://localhost:8080';
const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET ?? 'dev-onlyoffice-secret-change-me';
const PORT = Number(process.env.RENDER_PORT ?? 3999);
/** How Document Server (in a container) reaches this script's file server on the host. */
const FILE_BASE_URL = process.env.RENDER_FILE_BASE_URL ?? `http://host.docker.internal:${PORT}`;

interface Entry {
  kind: string;
  slug: string;
  file: string;
  previews: string;
}

const manifest = JSON.parse(await readFile(path.join(ROOT, 'manifest.json'), 'utf8')) as { templates: Entry[] };
const only = process.argv.slice(2);
const entries = manifest.templates.filter((t) => only.length === 0 || only.includes(t.slug));

// Serves only the files named in the manifest.
const allowed = new Map(entries.map((e) => [`/${e.file}`, path.join(ROOT, e.file)]));
const server = createServer((req, res) => {
  const file = allowed.get(new URL(req.url ?? '/', 'http://x').pathname);
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  createReadStream(file).pipe(res);
});
await new Promise<void>((resolve) => server.listen(PORT, '0.0.0.0', resolve));

async function convert(entry: Entry): Promise<string> {
  const body: Record<string, unknown> = {
    async: false,
    filetype: entry.kind,
    outputtype: 'png',
    key: `render-${entry.slug}-${Date.now()}`,
    title: `${entry.slug}.${entry.kind}`,
    url: `${FILE_BASE_URL}/${entry.file}`,
    thumbnail: { aspect: 1, first: false, width: 1200, height: 1200 },
  };
  body.token = jwt.sign(body, JWT_SECRET);
  const response = await fetch(`${DOCSERVER_URL}/converter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as { endConvert?: boolean; fileUrl?: string; error?: number };
  if (!result.endConvert || !result.fileUrl) throw new Error(`conversion failed: ${JSON.stringify(result)}`);
  return result.fileUrl;
}

let failed = 0;
for (const entry of entries) {
  try {
    const fileUrl = new URL(await convert(entry));
    // The result URL may name the public host; fetch it through DOCSERVER_URL.
    const download = await fetch(new URL(fileUrl.pathname + fileUrl.search, DOCSERVER_URL));
    const buffer = Buffer.from(await download.arrayBuffer());
    const dir = path.join(ROOT, entry.previews);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const images = buffer.subarray(0, 4).toString('hex') === '504b0304'
      ? new AdmZip(buffer)
          .getEntries()
          .filter((e) => e.entryName.endsWith('.png'))
          .sort((a, b) => trailingNumber(a.entryName) - trailingNumber(b.entryName))
          .map((e) => e.getData())
      : [buffer];
    for (const [i, image] of images.entries()) await writeFile(path.join(dir, `${i + 1}.png`), image);
    console.log(`${entry.kind}  ${entry.slug}: ${images.length} preview(s)`);
  } catch (error) {
    failed++;
    console.error(`${entry.kind}  ${entry.slug}: ${(error as Error).message}`);
  }
}

server.close();
process.exit(failed ? 1 : 0);

function trailingNumber(name: string) {
  return Number(/(\d+)\.png$/.exec(name)?.[1] ?? 0);
}

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalFileStorage, StorageKeyError } from '../src/shared/storage.js';
import { createHarness, JWT_SECRET, type Harness } from './harness.js';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});
afterEach(async () => {
  await h.cleanup();
});

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

async function firstTemplate(kind: 'docx' | 'pptx' = 'docx') {
  const res = await request(h.app).get(`/api/templates?kind=${kind}`).expect(200);
  return res.body.items[0];
}

/** SHA-256 of every stored template source file, to prove originals never change (AD-2). */
async function templateChecksums() {
  const all = (await request(h.app).get('/api/templates?kind=docx')).body.items.concat(
    (await request(h.app).get('/api/templates?kind=pptx')).body.items,
  );
  const result: Record<string, string> = {};
  for (const t of all) {
    const template = h.catalog.template(t.id);
    result[t.id] = await h.storage.sha256(template.current.storageKey);
    expect(result[t.id]).toBe(template.current.sha256);
  }
  return result;
}

function signedCallback(body: Record<string, unknown>) {
  return { Authorization: `Bearer ${jwt.sign({ payload: body }, JWT_SECRET)}` };
}

describe('gallery (CAP-1, CAP-2, CAP-3)', () => {
  it('lists templates of one kind with thumbnail, category and description', async () => {
    const docx = (await request(h.app).get('/api/templates?kind=docx').expect(200)).body.items;
    const pptx = (await request(h.app).get('/api/templates?kind=pptx').expect(200)).body.items;
    expect(docx).toHaveLength(6);
    expect(pptx).toHaveLength(4);
    expect(docx[0]).toMatchObject({ kind: 'docx', revision: 1, previewCount: 2, category: { slug: expect.any(String) } });
    expect(docx[0].thumbnailUrl).toMatch(/\/revisions\/1\/previews\/1$/);
  });

  it('filters by search text and category, and returns an empty list when nothing matches', async () => {
    const byText = (await request(h.app).get('/api/templates?kind=docx&q=INVOICE').expect(200)).body.items;
    expect(byText.map((t: { slug: string }) => t.slug)).toEqual(['invoice']);

    const byCategory = (await request(h.app).get('/api/templates?kind=docx&category=education').expect(200)).body.items;
    expect(byCategory.map((t: { slug: string }) => t.slug)).toEqual(['lesson-plan']);

    const none = (await request(h.app).get('/api/templates?kind=docx&q=zzz').expect(200)).body.items;
    expect(none).toEqual([]);
  });

  it('lists only categories that have templates of the kind', async () => {
    const res = await request(h.app).get('/api/categories?kind=pptx').expect(200);
    expect(res.body.items.map((c: { slug: string }) => c.slug).sort()).toEqual(['business', 'education']);
  });

  it('rejects an unknown kind with a validation error', async () => {
    const res = await request(h.app).get('/api/templates?kind=xlsx').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns template detail with numbered previews and serves them as immutable PNGs', async () => {
    const t = await firstTemplate();
    const detail = (await request(h.app).get(`/api/templates/${t.id}`).expect(200)).body;
    expect(detail.previews).toEqual([
      { n: 1, url: `/api/templates/${t.id}/revisions/1/previews/1` },
      { n: 2, url: `/api/templates/${t.id}/revisions/1/previews/2` },
    ]);
    const img = await request(h.app).get(detail.previews[0].url).expect(200);
    expect(img.headers['content-type']).toBe('image/png');
    expect(img.headers['cache-control']).toContain('immutable');
    await request(h.app).get(`/api/templates/${t.id}/revisions/1/previews/3`).expect(404);
    await request(h.app).get(`/api/templates/${t.id}/revisions/1/previews/0`).expect(404);
  });

  it('answers not-found with the error envelope', async () => {
    const res = await request(h.app).get('/api/templates/does-not-exist').expect(404);
    expect(res.body).toEqual({ error: { code: 'TEMPLATE_NOT_FOUND', message: expect.any(String) } });
    expect((await request(h.app).get('/api/nope').expect(404)).body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});

describe('use template (CAP-4, CAP-6, CAP-7)', () => {
  it('creates an independent copy and leaves every template byte-identical', async () => {
    const before = await templateChecksums();
    const t = await firstTemplate();

    const created = await request(h.app).post(`/api/templates/${t.id}/documents`).expect(201);
    expect(created.body).toMatchObject({ kind: 'docx', title: t.name, version: 1, origin: { templateId: t.id, revision: 1 } });

    const download = await request(h.app).get(created.body.downloadUrl).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(download.status).toBe(200);
    expect(download.headers['content-disposition']).toMatch(/attachment; filename=".*\.docx"/);
    expect(sha(download.body)).toBe(h.catalog.template(t.id).current.sha256);

    const list = (await request(h.app).get('/api/documents').expect(200)).body.items;
    expect(list).toHaveLength(1);
    expect(await templateChecksums()).toEqual(before);
  });

  it('returns 404 for an unknown document and template', async () => {
    expect((await request(h.app).get('/api/documents/missing').expect(404)).body.error.code).toBe('DOCUMENT_NOT_FOUND');
    expect((await request(h.app).post('/api/templates/missing/documents').expect(404)).body.error.code).toBe('TEMPLATE_NOT_FOUND');
  });

  it('refuses to use an archived template but keeps its documents working (D4)', async () => {
    const t = await firstTemplate();
    const doc = (await request(h.app).post(`/api/templates/${t.id}/documents`).expect(201)).body;

    await h.writeManifest(h.entries.map((e) => (e.slug === t.slug ? { ...e, archived: true } : e)));
    await h.importer.run(h.manifestDir);

    const gallery = (await request(h.app).get('/api/templates?kind=docx')).body.items;
    expect(gallery.find((x: { id: string }) => x.id === t.id)).toBeUndefined();
    expect((await request(h.app).get(`/api/templates/${t.id}`).expect(200)).body.status).toBe('archived');
    expect((await request(h.app).post(`/api/templates/${t.id}/documents`).expect(409)).body.error.code).toBe('TEMPLATE_ARCHIVED');
    await request(h.app).get(`/api/documents/${doc.id}/download`).expect(200);
  });
});

describe('template management (CAP-8, D2)', () => {
  it('creates a new revision when a source file changes; existing documents keep their origin', async () => {
    const t = await firstTemplate();
    const doc = (await request(h.app).post(`/api/templates/${t.id}/documents`).expect(201)).body;
    const oldKey = h.catalog.template(t.id).current.storageKey;
    const oldSha = await h.storage.sha256(oldKey);

    // Change the source: a different seed file of the same kind.
    const other = h.entries.find((e) => e.kind === 'docx' && e.slug !== t.slug)!;
    await writeFile(path.join(h.manifestDir, `files/${t.slug}.docx`), await readFile(path.join(h.manifestDir, other.file)));
    const report = await h.importer.run(h.manifestDir);
    expect(report.revised).toEqual([`docx/${t.slug}`]);

    const revised = h.catalog.template(t.id);
    expect(revised.current.revision).toBe(2);
    expect(revised.current.storageKey).not.toBe(oldKey);
    expect(await h.storage.sha256(oldKey)).toBe(oldSha);
    expect((await request(h.app).get(`/api/documents/${doc.id}`)).body.origin.revision).toBe(1);

    const again = await h.importer.run(h.manifestDir);
    expect(again.unchanged).toContain(`docx/${t.slug}`);
  });

  it('archives a template that disappears from the manifest', async () => {
    const [removed, ...rest] = h.entries;
    await h.writeManifest(rest);
    const report = await h.importer.run(h.manifestDir);
    expect(report.archived).toContain(`${removed!.kind}/${removed!.slug}`);
  });

  it('skips an entry whose file is not the declared kind, and imports the rest', async () => {
    await writeFile(path.join(h.manifestDir, 'files/not-office.docx'), 'plain text');
    await h.writeManifest([
      ...h.entries,
      { kind: 'docx', slug: 'not-office', name: 'Bad', category: 'business', description: 'x', file: 'files/not-office.docx', previews: 'previews/invoice' },
      { kind: 'pptx', slug: 'wrong-kind', name: 'Wrong', category: 'business', description: 'x', file: 'files/invoice.docx', previews: 'previews/invoice' },
    ]);
    const report = await h.importer.run(h.manifestDir);
    expect(report.failed.map((f) => f.template).sort()).toEqual(['docx/not-office', 'pptx/wrong-kind']);
    expect(report.unchanged).toHaveLength(h.entries.length);
  });
});

describe('editor integration (CAP-5, AD-6, AD-7)', () => {
  async function createDoc() {
    const t = await firstTemplate();
    return (await request(h.app).post(`/api/templates/${t.id}/documents`).expect(201)).body;
  }

  it('returns a signed editor config with a version-bound file URL that Document Server can fetch', async () => {
    const doc = await createDoc();
    const res = await request(h.app).get(`/api/documents/${doc.id}/editor-config`).expect(200);
    expect(res.body.documentServerUrl).toBe('http://localhost:8080');
    const config = res.body.config;
    expect(config.documentType).toBe('word');
    expect(config.document.key).toBe(`${doc.id}-v1`);
    expect(config.editorConfig.callbackUrl).toBe(`http://app:3000/api/editor/callback/${doc.id}`);
    expect(() => jwt.verify(config.token, JWT_SECRET)).not.toThrow();

    const fileUrl = new URL(config.document.url);
    expect(fileUrl.origin).toBe('http://app:3000');
    await request(h.app).get(fileUrl.pathname + fileUrl.search).expect(200);
    await request(h.app).get(fileUrl.pathname).expect(403);
    await request(h.app).get(fileUrl.pathname.replace('/versions/1', '/versions/2') + fileUrl.search).expect(403);
  });

  it('saves an edited version on status 2: new file, new key, template untouched', async () => {
    const before = await templateChecksums();
    const doc = await createDoc();
    h.gateway.editedFile = Buffer.from('edited document bytes');
    const body = { key: `${doc.id}-v1`, status: 2, url: 'http://localhost:8080/cache/files/output.docx?md5=x' };

    const res = await request(h.app).post(`/api/editor/callback/${doc.id}`).set(signedCallback(body)).send(body).expect(200);
    expect(res.body).toEqual({ error: 0 });

    const after = (await request(h.app).get(`/api/documents/${doc.id}`)).body;
    expect(after.version).toBe(2);
    const download = await request(h.app).get(after.downloadUrl).buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(download.body.toString()).toBe('edited document bytes');
    const config = (await request(h.app).get(`/api/documents/${doc.id}/editor-config`)).body.config;
    expect(config.document.key).toBe(`${doc.id}-v2`);
    expect(await templateChecksums()).toEqual(before);
  });

  it('ignores a callback with a stale key and accepts the token in the body', async () => {
    const doc = await createDoc();
    const body = { key: `${doc.id}-v0`, status: 2, url: 'http://localhost:8080/out.docx' };
    const res = await request(h.app)
      .post(`/api/editor/callback/${doc.id}`)
      .send({ ...body, token: jwt.sign(body, JWT_SECRET) })
      .expect(200);
    expect(res.body).toEqual({ error: 0 });
    expect((await request(h.app).get(`/api/documents/${doc.id}`)).body.version).toBe(1);
    expect(h.gateway.downloads).toEqual([]);
  });

  it('serialises two concurrent saves of the same version: exactly one wins', async () => {
    const doc = await createDoc();
    const body = { key: `${doc.id}-v1`, status: 2, url: 'http://localhost:8080/out.docx' };
    const send = () => request(h.app).post(`/api/editor/callback/${doc.id}`).set(signedCallback(body)).send(body);
    const results = await Promise.all([send(), send()]);
    expect(results.map((r) => r.body.error)).toEqual([0, 0]);
    expect(h.gateway.downloads).toHaveLength(1);
    expect((await request(h.app).get(`/api/documents/${doc.id}`)).body.version).toBe(2);
  });

  it('rejects unsigned or wrongly signed callbacks without changing anything', async () => {
    const doc = await createDoc();
    const body = { key: `${doc.id}-v1`, status: 2, url: 'http://localhost:8080/out.docx' };
    expect((await request(h.app).post(`/api/editor/callback/${doc.id}`).send(body).expect(403)).body).toEqual({ error: 1 });
    await request(h.app)
      .post(`/api/editor/callback/${doc.id}`)
      .set({ Authorization: `Bearer ${jwt.sign({ payload: body }, 'some-other-secret-value')}` })
      .send(body)
      .expect(403);
    expect((await request(h.app).get(`/api/documents/${doc.id}`)).body.version).toBe(1);
  });

  it('reports {"error":1} when the edited file cannot be stored', async () => {
    const doc = await createDoc();
    h.gateway.downloadEditedFile = async () => {
      throw new Error('network down');
    };
    const body = { key: `${doc.id}-v1`, status: 2, url: 'http://localhost:8080/out.docx' };
    const res = await request(h.app).post(`/api/editor/callback/${doc.id}`).set(signedCallback(body)).send(body).expect(200);
    expect(res.body).toEqual({ error: 1 });
    expect((await request(h.app).get(`/api/documents/${doc.id}`)).body.version).toBe(1);
  });

  it('acknowledges status 4 (closed without changes) without a new version', async () => {
    const doc = await createDoc();
    const body = { key: `${doc.id}-v1`, status: 4 };
    expect((await request(h.app).post(`/api/editor/callback/${doc.id}`).set(signedCallback(body)).send(body)).body).toEqual({ error: 0 });
    expect((await request(h.app).get(`/api/documents/${doc.id}`)).body.version).toBe(1);
  });
});

describe('storage (AD-9)', () => {
  it('rejects keys that escape the storage root', () => {
    const storage = new LocalFileStorage(h.config.STORAGE_ROOT);
    expect(() => storage.resolve('../outside.docx')).toThrow(StorageKeyError);
    expect(() => storage.resolve('documents/../../etc/passwd')).toThrow(StorageKeyError);
    expect(() => storage.resolve('/absolute')).toThrow(StorageKeyError);
    expect(storage.resolve('documents/a/v1.docx')).toContain('documents');
  });
});

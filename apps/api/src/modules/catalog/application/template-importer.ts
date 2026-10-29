import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { kindOf } from '@otl/shared';
import type { Logger } from '../../../shared/logger.js';
import { sha256OfFile, type FileWriter } from '../../../shared/storage.js';
import { assertPublishable, revisionKeys, type TemplateRevision } from '../domain/template.js';
import { readManifest, type ManifestTemplate } from './manifest.js';
import { assertOoxmlKind } from './ooxml.js';
import type { TemplateRepository } from './ports.js';

export interface ImportReport {
  created: string[];
  revised: string[];
  unchanged: string[];
  archived: string[];
  failed: { template: string; reason: string }[];
}

/**
 * Imports templates/manifest.json into the catalog (AD-4). The only code that writes template
 * files (AD-2): every revision is stored under a new key, set read-only and verified before
 * its row is committed (AD-13). One bad entry is reported and skipped; it never blocks the rest.
 */
export class TemplateImporter {
  constructor(
    private readonly repo: TemplateRepository,
    private readonly files: FileWriter,
    private readonly log: Logger,
  ) {}

  async run(manifestDir: string, now = new Date().toISOString()): Promise<ImportReport> {
    const manifest = await readManifest(manifestDir);
    const report: ImportReport = { created: [], revised: [], unchanged: [], archived: [], failed: [] };

    const categoryIds = new Map<string, string>();
    manifest.categories.forEach((c, i) => categoryIds.set(c.slug, this.repo.upsertCategory(c.slug, c.name, i).id));

    const inManifest = new Set<string>();
    for (const [sortOrder, entry] of manifest.templates.entries()) {
      const label = `${entry.kind}/${entry.slug}`;
      inManifest.add(label);
      try {
        const outcome = await this.importOne(manifestDir, entry, categoryIds.get(entry.category)!, sortOrder, now);
        report[outcome].push(label);
        if (entry.archived) report.archived.push(label);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        report.failed.push({ template: label, reason });
        this.log.error({ template: label, reason }, 'template import failed');
      }
    }

    // A template missing from the manifest is archived, never deleted (AD-4, D4).
    for (const t of this.repo.listAll()) {
      const label = `${t.kind}/${t.slug}`;
      if (!inManifest.has(label) && t.status === 'published') {
        const existing = this.repo.findById(t.id)!;
        this.repo.updateMetadata(
          t.id,
          { name: existing.name, description: existing.description, categoryId: existing.category.id, status: 'archived', sortOrder: 9999 },
          now,
        );
        report.archived.push(label);
      }
    }

    this.log.info(
      {
        created: report.created.length,
        revised: report.revised.length,
        unchanged: report.unchanged.length,
        archived: report.archived.length,
        failed: report.failed.length,
      },
      'template import finished',
    );
    return report;
  }

  private async importOne(
    manifestDir: string,
    entry: ManifestTemplate,
    categoryId: string,
    sortOrder: number,
    now: string,
  ): Promise<'created' | 'revised' | 'unchanged'> {
    const sourcePath = path.join(manifestDir, entry.file);
    await assertOoxmlKind(sourcePath, entry.kind);
    const previewPaths = await listPreviews(path.join(manifestDir, entry.previews));
    assertPublishable(previewPaths.length, entry.slug);

    const metadata = {
      name: entry.name,
      description: entry.description,
      categoryId,
      status: entry.archived ? ('archived' as const) : ('published' as const),
      sortOrder,
    };
    const sha256 = await sha256OfFile(sourcePath);
    const existing = this.repo.findByKindAndSlug(entry.kind, entry.slug);

    if (existing && existing.current.sha256 === sha256) {
      this.repo.updateMetadata(existing.id, metadata, now);
      return 'unchanged';
    }

    const templateId = existing?.id ?? randomUUID();
    const revision = await this.storeRevision(templateId, (existing?.current.revision ?? 0) + 1, entry, sourcePath, sha256, previewPaths);

    if (existing) {
      this.repo.addRevision(revision, now);
      this.repo.updateMetadata(existing.id, metadata, now);
      return 'revised';
    }
    this.repo.createTemplate({ id: templateId, kind: entry.kind, slug: entry.slug, revision, now, ...metadata });
    return 'created';
  }

  private async storeRevision(
    templateId: string,
    revision: number,
    entry: ManifestTemplate,
    sourcePath: string,
    expectedSha: string,
    previewPaths: string[],
  ): Promise<TemplateRevision> {
    const storageKey = revisionKeys.source(templateId, revision, kindOf(entry.kind).extension);
    const storedSha = await this.putOnce(sourcePath, storageKey);
    if (storedSha !== expectedSha) throw new Error(`Stored file for ${entry.slug} failed checksum verification.`);
    for (const [index, previewPath] of previewPaths.entries()) {
      await this.putOnce(previewPath, revisionKeys.preview(templateId, revision, index + 1));
    }
    return {
      templateId,
      revision,
      storageKey,
      sha256: storedSha,
      sizeBytes: await this.files.sizeOf(storageKey),
      previewCount: previewPaths.length,
    };
  }

  /**
   * Stores a file under a new key. A key left by an interrupted earlier run is reused only if
   * its bytes are identical; a stored file is never overwritten (AD-2).
   */
  private async putOnce(sourcePath: string, key: string): Promise<string> {
    if (await this.files.exists(key)) {
      const [stored, source] = await Promise.all([this.files.sha256(key), sha256OfFile(sourcePath)]);
      if (stored !== source) throw new Error(`Storage key ${key} already holds different content.`);
      return stored;
    }
    return this.files.putFromFile(sourcePath, key, { readOnly: true });
  }
}

/** Returns 1.png, 2.png, ... in numeric order. */
async function listPreviews(dir: string): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => /^\d+\.png$/.test(n))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((n) => path.join(dir, n));
}

import { randomUUID } from 'node:crypto';
import type { TemplateKind } from '@otl/shared';
import { and, asc, count, eq, or, sql } from 'drizzle-orm';
import type { Db } from '../../../shared/db.js';
import type {
  CategoryWithCount,
  GalleryFilter,
  NewTemplate,
  TemplateMetadata,
  TemplateRepository,
} from '../application/ports.js';
import type { Category, Template, TemplateRevision } from '../domain/template.js';
import { categories, templateRevisions, templates } from './schema.js';

type Row = {
  t: typeof templates.$inferSelect;
  c: typeof categories.$inferSelect;
  r: typeof templateRevisions.$inferSelect;
};

function toTemplate({ t, c, r }: Row): Template {
  return {
    id: t.id,
    kind: t.kind,
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: { id: c.id, slug: c.slug, name: c.name },
    status: t.status,
    current: toRevision(r),
    updatedAt: t.updatedAt,
  };
}

function toRevision(r: typeof templateRevisions.$inferSelect): TemplateRevision {
  return {
    templateId: r.templateId,
    revision: r.revision,
    storageKey: r.storageKey,
    sha256: r.sha256,
    sizeBytes: r.sizeBytes,
    previewCount: r.previewCount,
  };
}

export class DrizzleTemplateRepository implements TemplateRepository {
  constructor(private readonly db: Db) {}

  private selectTemplates() {
    return this.db
      .select({ t: templates, c: categories, r: templateRevisions })
      .from(templates)
      .innerJoin(categories, eq(categories.id, templates.categoryId))
      .innerJoin(
        templateRevisions,
        and(
          eq(templateRevisions.templateId, templates.id),
          eq(templateRevisions.revision, templates.currentRevision),
        ),
      );
  }

  listPublished(filter: GalleryFilter): Template[] {
    const conditions = [eq(templates.kind, filter.kind), eq(templates.status, 'published')];
    if (filter.categorySlug) conditions.push(eq(categories.slug, filter.categorySlug));
    if (filter.q) {
      const pattern = `%${filter.q.toLowerCase().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      conditions.push(
        or(
          sql`lower(${templates.name}) like ${pattern} escape '\\'`,
          sql`lower(${templates.description}) like ${pattern} escape '\\'`,
          sql`lower(${categories.name}) like ${pattern} escape '\\'`,
        )!,
      );
    }
    return this.selectTemplates()
      .where(and(...conditions))
      .orderBy(asc(templates.sortOrder), asc(templates.name))
      .all()
      .map(toTemplate);
  }

  findById(id: string): Template | undefined {
    const row = this.selectTemplates().where(eq(templates.id, id)).get();
    return row ? toTemplate(row) : undefined;
  }

  findByKindAndSlug(kind: TemplateKind, slug: string): Template | undefined {
    const row = this.selectTemplates()
      .where(and(eq(templates.kind, kind), eq(templates.slug, slug)))
      .get();
    return row ? toTemplate(row) : undefined;
  }

  findRevision(templateId: string, revision: number): TemplateRevision | undefined {
    const row = this.db
      .select()
      .from(templateRevisions)
      .where(and(eq(templateRevisions.templateId, templateId), eq(templateRevisions.revision, revision)))
      .get();
    return row ? toRevision(row) : undefined;
  }

  categoriesWithPublished(kind: TemplateKind): CategoryWithCount[] {
    return this.db
      .select({ id: categories.id, slug: categories.slug, name: categories.name, templateCount: count(templates.id) })
      .from(categories)
      .innerJoin(templates, eq(templates.categoryId, categories.id))
      .where(and(eq(templates.kind, kind), eq(templates.status, 'published')))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder))
      .all();
  }

  upsertCategory(slug: string, name: string, sortOrder: number): Category {
    const existing = this.db.select().from(categories).where(eq(categories.slug, slug)).get();
    if (existing) {
      this.db.update(categories).set({ name, sortOrder }).where(eq(categories.id, existing.id)).run();
      return { id: existing.id, slug, name };
    }
    const id = randomUUID();
    this.db.insert(categories).values({ id, slug, name, sortOrder }).run();
    return { id, slug, name };
  }

  createTemplate(input: NewTemplate): void {
    this.db.transaction((tx) => {
      tx.insert(templates)
        .values({
          id: input.id,
          kind: input.kind,
          slug: input.slug,
          name: input.name,
          description: input.description,
          categoryId: input.categoryId,
          status: input.status,
          sortOrder: input.sortOrder,
          currentRevision: input.revision.revision,
          createdAt: input.now,
          updatedAt: input.now,
        })
        .run();
      tx.insert(templateRevisions).values({ ...input.revision, createdAt: input.now }).run();
    });
  }

  addRevision(revision: TemplateRevision, now: string): void {
    this.db.transaction((tx) => {
      tx.insert(templateRevisions).values({ ...revision, createdAt: now }).run();
      tx.update(templates)
        .set({ currentRevision: revision.revision, updatedAt: now })
        .where(eq(templates.id, revision.templateId))
        .run();
    });
  }

  updateMetadata(id: string, patch: TemplateMetadata, now: string): void {
    const current = this.db.select().from(templates).where(eq(templates.id, id)).get();
    if (!current) return;
    const changed =
      current.name !== patch.name ||
      current.description !== patch.description ||
      current.categoryId !== patch.categoryId ||
      current.status !== patch.status ||
      current.sortOrder !== patch.sortOrder;
    if (changed) this.db.update(templates).set({ ...patch, updatedAt: now }).where(eq(templates.id, id)).run();
  }

  listAll() {
    return this.db
      .select({ id: templates.id, kind: templates.kind, slug: templates.slug, status: templates.status })
      .from(templates)
      .all();
  }
}

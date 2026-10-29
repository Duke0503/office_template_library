import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '../../../shared/db.js';
import type { DocumentRepository } from '../application/ports.js';
import type { Document } from '../domain/document.js';
import { documents } from './schema.js';

function toDocument(r: typeof documents.$inferSelect): Document {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    origin: { templateId: r.originTemplateId, revision: r.originRevision, templateName: r.originTemplateName },
    version: r.version,
    storageKey: r.storageKey,
    editorKey: r.editorKey,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleDocumentRepository implements DocumentRepository {
  constructor(private readonly db: Db) {}

  insert(d: Document): void {
    this.db
      .insert(documents)
      .values({
        id: d.id,
        kind: d.kind,
        title: d.title,
        originTemplateId: d.origin.templateId,
        originRevision: d.origin.revision,
        originTemplateName: d.origin.templateName,
        version: d.version,
        storageKey: d.storageKey,
        editorKey: d.editorKey,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })
      .run();
  }

  findById(id: string): Document | undefined {
    const row = this.db.select().from(documents).where(eq(documents.id, id)).get();
    return row ? toDocument(row) : undefined;
  }

  listNewestFirst(): Document[] {
    return this.db.select().from(documents).orderBy(desc(documents.updatedAt)).all().map(toDocument);
  }

  saveVersion(id: string, expectedVersion: number, next: Pick<Document, 'version' | 'storageKey' | 'editorKey' | 'updatedAt'>): boolean {
    const result = this.db
      .update(documents)
      .set(next)
      .where(and(eq(documents.id, id), eq(documents.version, expectedVersion)))
      .run();
    return result.changes === 1;
  }
}

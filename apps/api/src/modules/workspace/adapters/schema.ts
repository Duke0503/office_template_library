import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Workspace-owned table (AD-5). The origin columns are a snapshot, not a foreign key into
// the catalog, so a document never depends on its template after creation (D4).
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['docx', 'pptx'] }).notNull(),
  title: text('title').notNull(),
  originTemplateId: text('origin_template_id').notNull(),
  originRevision: integer('origin_revision').notNull(),
  originTemplateName: text('origin_template_name').notNull(),
  version: integer('version').notNull(),
  storageKey: text('storage_key').notNull(),
  editorKey: text('editor_key').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

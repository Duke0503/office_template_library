import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Catalog-owned tables (AD-5). Workspace never reads these directly.

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const templates = sqliteTable(
  'templates',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['docx', 'pptx'] }).notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    status: text('status', { enum: ['published', 'archived'] }).notNull(),
    currentRevision: integer('current_revision').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('templates_kind_slug').on(t.kind, t.slug)],
);

export const templateRevisions = sqliteTable(
  'template_revisions',
  {
    templateId: text('template_id')
      .notNull()
      .references(() => templates.id),
    revision: integer('revision').notNull(),
    storageKey: text('storage_key').notNull(),
    sha256: text('sha256').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    previewCount: integer('preview_count').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.templateId, t.revision] })],
);

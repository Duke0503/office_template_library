import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { templateKindSchema } from '@otl/shared';
import { z } from 'zod';

// templates/manifest.json: the only source of templates (AD-4).

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase words joined by dashes');
const relativePath = z
  .string()
  .min(1)
  .refine((p) => !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..'), 'must stay inside the manifest folder');

export const manifestSchema = z.object({
  categories: z.array(z.object({ slug, name: z.string().min(1) })).min(1),
  templates: z.array(
    z.object({
      kind: templateKindSchema,
      slug,
      name: z.string().min(1).max(80),
      category: slug,
      description: z.string().min(1).max(240),
      /** Source file, relative to the manifest folder. */
      file: relativePath,
      /** Folder of 1.png, 2.png, ... relative to the manifest folder (AD-14). */
      previews: relativePath,
      archived: z.boolean().optional(),
    }),
  ),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestTemplate = Manifest['templates'][number];

export async function readManifest(manifestDir: string): Promise<Manifest> {
  const raw = await readFile(path.join(manifestDir, 'manifest.json'), 'utf8');
  const manifest = manifestSchema.parse(JSON.parse(raw));
  const known = new Set(manifest.categories.map((c) => c.slug));
  const seen = new Set<string>();
  for (const t of manifest.templates) {
    if (!known.has(t.category)) throw new Error(`Template ${t.slug} uses unknown category ${t.category}.`);
    const key = `${t.kind}/${t.slug}`;
    if (seen.has(key)) throw new Error(`Duplicate template ${key} in manifest.`);
    seen.add(key);
  }
  return manifest;
}

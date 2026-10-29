import { open } from 'node:fs/promises';
import { kindOf, type TemplateKind } from '@otl/shared';
import AdmZip from 'adm-zip';

// Proves a file is an Office Open XML package of the expected kind (AD-9): the ZIP signature
// first, then the main part's content type in [Content_Types].xml.

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export async function assertOoxmlKind(filePath: string, kind: TemplateKind): Promise<void> {
  const handle = await open(filePath, 'r');
  try {
    const head = Buffer.alloc(4);
    await handle.read(head, 0, 4, 0);
    if (!head.equals(ZIP_SIGNATURE)) throw new Error(`${filePath} is not a ZIP package.`);
  } finally {
    await handle.close();
  }
  const entry = new AdmZip(filePath).getEntry('[Content_Types].xml');
  const types = entry?.getData().toString('utf8') ?? '';
  if (!types.includes(kindOf(kind).mainContentType)) {
    throw new Error(`${filePath} is not a ${kind.toUpperCase()} file.`);
  }
}

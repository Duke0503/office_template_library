import { createHash } from 'node:crypto';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';

export const MAIN_CONTENT_TYPE = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
} as const;

export const sha256 = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

/** Downloads a document and checks it is a valid OOXML package of its kind. */
export async function downloadPackage(request: APIRequestContext, url: string, kind: 'docx' | 'pptx') {
  const response = await request.get(url);
  expect(response.status()).toBe(200);
  const buffer = Buffer.from(await response.body());
  expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304');
  const zip = new AdmZip(buffer);
  expect(zip.readAsText('[Content_Types].xml')).toContain(MAIN_CONTENT_TYPE[kind]);
  return { buffer, zip };
}

/** Opens the preview of a template by its visible name and clicks "Use template". */
export async function useTemplate(page: Page, kind: 'docx' | 'pptx', name: string) {
  await page.goto(`/templates/${kind}`);
  await page.getByTestId('template-card').filter({ hasText: name }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name })).toBeVisible();
  await dialog.getByRole('button', { name: 'Use template' }).click();
  await page.waitForURL(/\/documents\/[0-9a-f-]+\/edit$/);
  return page.url().match(/documents\/([0-9a-f-]+)\/edit/)![1]!;
}

/** Waits until ONLYOFFICE reports the document ready inside the editor iframe. */
export async function waitForEditor(page: Page) {
  await expect(page.getByTestId('editor-frame')).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
  return page.frameLocator('iframe[name="frameEditor"]');
}

export interface DocumentJson {
  id: string;
  version: number;
  downloadUrl: string;
  origin: { templateId: string; revision: number };
}

/** Polls a document until Document Server's save callback has produced `version`. */
export async function waitForVersion(request: APIRequestContext, id: string, version: number, timeoutMs = 60_000) {
  let document: DocumentJson | undefined;
  await expect
    .poll(
      async () => {
        document = (await (await request.get(`/api/documents/${id}`)).json()) as DocumentJson;
        return document.version;
      },
      { timeout: timeoutMs, intervals: [1000, 2000, 3000] },
    )
    .toBeGreaterThanOrEqual(version);
  return document!;
}

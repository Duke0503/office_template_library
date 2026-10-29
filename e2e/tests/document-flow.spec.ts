import { expect, test } from '@playwright/test';
import { downloadPackage, sha256, useTemplate, waitForEditor, waitForVersion } from './helpers';

// CAP-4, CAP-5, CAP-6, CAP-7: use a template, edit it in ONLYOFFICE, save, reopen and download,
// and prove the template itself never changes.

test.describe.configure({ mode: 'serial' });

test('DOCX: edit in the editor, save on close, download with formatting intact', async ({ page, request }) => {
  const marker = `E2E edit ${Date.now()}`;
  const id = await useTemplate(page, 'docx', 'Invoice');

  // Version 1 is a byte-identical copy of the template.
  const v1 = await downloadPackage(request, `/api/documents/${id}/download`, 'docx');

  const editor = await waitForEditor(page);
  await editor.locator('#editor_sdk').click({ position: { x: 300, y: 200 } });
  await page.keyboard.press('Control+Home');
  await page.keyboard.type(marker);
  await page.waitForTimeout(1500);

  // Closing the editor makes Document Server send the save callback (AD-6).
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/documents$/);
  const saved = await waitForVersion(request, id, 2, 90_000);
  await expect(page.getByTestId('document-row').filter({ hasText: 'Invoice' }).first().getByTestId('document-version')).toHaveText(String(saved.version));

  const v2 = await downloadPackage(request, saved.downloadUrl, 'docx');
  const body = v2.zip.readAsText('word/document.xml');
  expect(body).toContain(marker);
  // Basic formatting from the template survives the round trip: tables, bold runs, headings.
  expect(body).toContain('<w:tbl>');
  expect(body).toMatch(/<w:b\/>|<w:b /);
  expect(body).toContain('Total due');

  // The template is unchanged: a fresh copy is byte-identical to the first copy.
  const fresh = (await (await request.post(`/api/templates/${saved.origin.templateId}/documents`)).json()) as { downloadUrl: string };
  const copy = await downloadPackage(request, fresh.downloadUrl, 'docx');
  expect(sha256(copy.buffer)).toBe(sha256(v1.buffer));
  expect(copy.zip.readAsText('word/document.xml')).not.toContain(marker);

  // Reopening loads the saved version under a new editor key.
  await page.goto(`/documents/${id}/edit`);
  await expect(page.getByTestId('version-badge')).toContainText(`v${saved.version}`);
  await waitForEditor(page);
});

test('PPTX: create a presentation, open it in the editor and download a valid PPTX', async ({ page, request }) => {
  const id = await useTemplate(page, 'pptx', 'Quarterly Business Review');
  await waitForEditor(page);

  const { zip, buffer } = await downloadPackage(request, `/api/documents/${id}/download`, 'pptx');
  expect(zip.getEntries().some((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))).toBe(true);

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByTestId('document-row').filter({ hasText: 'Quarterly Business Review' }).first()).toBeVisible();

  // The template stays byte-identical to the copy made from it.
  const document = (await (await request.get(`/api/documents/${id}`)).json()) as { origin: { templateId: string } };
  const fresh = (await (await request.post(`/api/templates/${document.origin.templateId}/documents`)).json()) as { downloadUrl: string };
  expect(sha256((await downloadPackage(request, fresh.downloadUrl, 'pptx')).buffer)).toBe(sha256(buffer));
});

test('My documents lists created documents with open and download actions @responsive', async ({ page }) => {
  await page.goto('/documents');
  // Desktop renders a table and phone renders cards; only one of them is visible.
  const row = page.getByTestId('document-row').filter({ visible: true }).first();
  await expect(row).toBeVisible();
  await expect(row.getByRole('link', { name: 'Open' })).toBeVisible();
  await expect(row.getByRole('link', { name: 'Download' })).toHaveAttribute('href', /\/api\/documents\/.+\/download$/);
});

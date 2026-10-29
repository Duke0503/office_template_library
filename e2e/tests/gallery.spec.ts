import { expect, test } from '@playwright/test';

// CAP-1, CAP-2, CAP-3, CAP-9, CAP-10: galleries, search, filter, preview and not-found states.

test.describe('galleries', () => {
  test('ship at least 5 document and 3 presentation templates with thumbnails @responsive', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/templates\/docx$/);
    await expect(page.getByRole('heading', { name: 'Document templates' })).toBeVisible();
    const docx = page.getByTestId('template-card');
    await expect(docx.first()).toBeVisible();
    expect(await docx.count()).toBeGreaterThanOrEqual(5);
    // Every thumbnail actually loads.
    await expect
      .poll(() => page.locator('[data-testid="template-card"] img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0)))
      .toBe(true);

    await page.goto('/templates/pptx');
    await expect(page.getByRole('heading', { name: 'Presentation templates' })).toBeVisible();
    expect(await page.getByTestId('template-card').count()).toBeGreaterThanOrEqual(3);
  });

  test('search narrows the grid, keeps the query in the URL and shows an empty state', async ({ page }) => {
    await page.goto('/templates/docx');
    await page.getByRole('searchbox', { name: /search document templates/i }).fill('invoice');
    await expect(page).toHaveURL(/q=invoice/);
    await expect(page.getByTestId('template-card')).toHaveCount(1);
    await expect(page.getByTestId('template-card')).toContainText('Invoice');

    await page.reload();
    await expect(page.getByTestId('template-card')).toHaveCount(1);

    await page.getByRole('searchbox').fill('zzzz-no-match');
    await expect(page.getByText('No templates match "zzzz-no-match"')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    expect(await page.getByTestId('template-card').count()).toBeGreaterThanOrEqual(5);
  });

  test('category chips filter by category', async ({ page }) => {
    await page.goto('/templates/docx');
    await page.getByRole('radio', { name: /^Education/ }).click();
    await expect(page).toHaveURL(/category=education/);
    await expect(page.getByTestId('template-card')).toHaveCount(1);
    await expect(page.getByTestId('template-card')).toContainText('Lesson Plan');
    await page.getByRole('radio', { name: 'All' }).click();
    expect(await page.getByTestId('template-card').count()).toBeGreaterThanOrEqual(5);
  });

  test('preview shows every slide, pages with the keyboard, and closes with Escape @responsive', async ({ page }) => {
    await page.goto('/templates/pptx');
    await page.getByTestId('template-card').filter({ hasText: 'Startup Pitch Deck' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Startup Pitch Deck' })).toBeVisible();
    await expect(page).toHaveURL(/preview=/);

    const slides = dialog.getByRole('listitem');
    const count = await slides.count();
    expect(count).toBeGreaterThan(1);
    await expect(dialog.getByRole('img', { name: /slide 1 of/i })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('img', { name: /slide 2 of/i })).toBeVisible();
    await slides.nth(count - 1).click();
    await expect(dialog.getByRole('img', { name: new RegExp(`slide ${count} of ${count}`, 'i') })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/preview=/);
  });
});

test.describe('not-found states', () => {
  test('unknown routes, templates and documents explain what happened', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByText('Page not found')).toBeVisible();

    await page.goto('/templates/xlsx');
    await expect(page.getByText('Page not found')).toBeVisible();

    await page.goto('/templates/docx?preview=00000000-0000-0000-0000-000000000000');
    await expect(page.getByText('This template no longer exists')).toBeVisible();

    await page.goto('/documents/00000000-0000-0000-0000-000000000000/edit');
    await expect(page.getByText('Document not found')).toBeVisible();
  });

  test('the API answers unknown ids with the error envelope', async ({ request }) => {
    const response = await request.get('/api/templates/missing');
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'TEMPLATE_NOT_FOUND', message: expect.any(String) } });
  });
});

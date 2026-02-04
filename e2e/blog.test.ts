import { expect, test } from '@playwright/test';

test.describe('Blog', () => {
  test('blog index loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('displays blog posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('text=Articles')).toBeVisible();
  });

  test('can navigate to blog post', async ({ page }) => {
    await page.goto('/blog');
    const firstPost = page.locator('a[href*="/blog/"][href*="-"]').first();
    await firstPost.click();
    await expect(page).toHaveURL(/\/blog\/.+/);
  });
});

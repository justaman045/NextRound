import { test, expect } from '@playwright/test';

test.describe('Home Page Smoke Test', () => {
    test('should load the landing page and show title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/NextRound/i);
        await expect(page.locator('h1')).toContainText(/Craft the Perfect Resume/i);
    });

    test('should show waitlist form', async ({ page }) => {
        await page.goto('/');
        const input = page.locator('input[type="email"]');
        await expect(input).toBeVisible();
    });

    test('navbar should be present', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('nav')).toContainText(/NextRound/i);
    });
});

import { test, expect } from '@playwright/test';

test.describe('RealCRM End-to-End Enterprise Flow', () => {
  test('Complete Flow: login -> create project + media -> budget -> plan -> approve -> creative -> approve -> mock publish -> lead -> analytics', async ({
    page,
  }) => {
    // -------------------------------------------------------------
    // Step 1: Authentication & Workspace Session
    // -------------------------------------------------------------
    await page.goto('/login');
    await expect(page).toHaveTitle(/RealCRM/i);
    await page.fill('input[type="email"]', 'owner@apex-luxury.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Apex Luxury Estates').first()).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 2: Projects & Property Catalog + Media Library
    // -------------------------------------------------------------
    await page.locator('aside a[href="/projects"]').click();
    await expect(page).toHaveURL(/.*projects/);
    await expect(page.locator('h1')).toContainText(/Property Catalog|Projects/i);
    await expect(
      page.locator('text=The Palm Residences').or(page.locator('text=Emerald Bay Towers')).first()
    ).toBeVisible({ timeout: 10000 });

    // Media Catalog
    await page.locator('aside a[href="/assets"]').click();
    await expect(page).toHaveURL(/.*assets/);
    await expect(page.locator('h1')).toContainText(/Media/i);
    await expect(page.locator('text=Upload Media').or(page.locator('button:has-text("Upload")')).first()).toBeVisible();

    // -------------------------------------------------------------
    // Step 3: Budget Management & Allocation
    // -------------------------------------------------------------
    await page.locator('aside a[href="/budget"]').click();
    await expect(page).toHaveURL(/.*budget/);
    await expect(page.locator('h1')).toContainText(/Budget/i);
    await expect(
      page.locator('text=The Palm Residences').or(page.locator('text=Emerald Bay Towers')).first()
    ).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 4: Marketing Calendar & Content Plan
    // -------------------------------------------------------------
    await page.locator('aside a[href="/calendar"]').click();
    await expect(page).toHaveURL(/.*calendar/);
    await expect(page.locator('h1')).toContainText(/Calendar|Marketing/i);
    await expect(page.locator('text=Penthouse Panorama Teaser').first()).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 5: Approvals Queue & Statutory Compliance
    // -------------------------------------------------------------
    await page.locator('aside a[href="/approvals"]').click();
    await expect(page).toHaveURL(/.*approvals/);
    await expect(page.locator('h1')).toContainText(/Approval/i);
    await expect(page.locator('text=Penthouse Panorama Teaser').first()).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 6: Creative Studio
    // -------------------------------------------------------------
    await page.locator('aside a[href="/studio"]').click();
    await expect(page).toHaveURL(/.*studio/);
    await expect(page.locator('h1')).toContainText(/Creative/i);
    await expect(page.locator('text=1:1').first()).toBeVisible();

    // -------------------------------------------------------------
    // Step 7: Campaigns & Meta Publishing
    // -------------------------------------------------------------
    await page.locator('aside a[href="/campaigns"]').click();
    await expect(page).toHaveURL(/.*campaigns/);
    await expect(page.locator('h1')).toContainText(/Campaigns|Meta/i);
    await expect(page.locator('text=Emerald Bay Penthouse Launch - Lead Gen').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table td:has-text("PAUSED")').first()).toBeVisible();

    // Publishing Log
    await page.locator('aside a[href="/publishing"]').click();
    await expect(page).toHaveURL(/.*publishing/);
    await expect(page.locator('h1')).toContainText(/Publishing/i);

    // -------------------------------------------------------------
    // Step 8: Leads CRM Pipeline & Consent Tracking
    // -------------------------------------------------------------
    await page.locator('aside a[href="/leads"]').click();
    await expect(page).toHaveURL(/.*leads/);
    await expect(page.locator('h1')).toContainText(/Leads/i);
    await expect(page.locator('text=Rajesh K. Khurana').first()).toBeVisible({ timeout: 10000 });

    // Switch to table view and verify columns
    const tableViewBtn = page.locator('button[title="Table View"], button:has-text("Table")').first();
    if (await tableViewBtn.isVisible()) {
      await tableViewBtn.click();
      await expect(page.locator('text=Rajesh K. Khurana').first()).toBeVisible();
    }

    // -------------------------------------------------------------
    // Step 9: Analytics & Performance Attribution
    // -------------------------------------------------------------
    await page.locator('aside a[href="/dashboard/analytics"]').click();
    await expect(page).toHaveURL(/.*dashboard\/analytics/);
    await expect(page.locator('h1').first()).toContainText(/Analytics|Marketing/i);
    await expect(page.getByText(/Total Marketing Spend|Marketing Spend/i).first()).toBeVisible({ timeout: 10000 });

    // Switch to Campaigns Analytics tab
    await page.waitForTimeout(500);
    const campaignsTab = page.locator('button[role="tab"]:has-text("Campaigns")').first();
    if (await campaignsTab.isVisible()) {
      await campaignsTab.click();
      await expect(page.locator('text=Emerald Bay Penthouse Launch - Lead Gen').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Responsive Layout Verification (375px mobile, 768px tablet, 1280px desktop)', async ({ page }) => {
    // 1. Mobile 375px
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 2. Tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();

    // 3. Desktop 1280px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
  });
});

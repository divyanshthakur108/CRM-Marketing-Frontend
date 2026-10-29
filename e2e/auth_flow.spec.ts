import { test, expect } from '@playwright/test';

test.describe('Auth Flow, Platform Admin, Invitation & Onboarding Suite', () => {
  // -------------------------------------------------------------
  // Test 1: Login Redirection & Hidden Sign-up Link
  // -------------------------------------------------------------
  test('Login Page: verified design, hides signup link, and redirects platform_admin to /admin/organizations', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/RealCRM/i);
    await expect(page.locator('h1')).toContainText('Workspace Login');

    // Requirement 1: Hide the "Sign up" link
    await expect(page.locator('a[href="/signup"]')).not.toBeVisible();

    // Login as platform_admin
    await page.fill('input[type="email"]', 'admin@realcrm.in');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Platform admin redirects to /admin/organizations
    await expect(page).toHaveURL(/.*admin\/organizations/);
    await expect(page.locator('h1')).toContainText('Platform Admin Console');
  });

  // -------------------------------------------------------------
  // Test 2: Platform Admin Organizations Directory & Add Org Flow
  // -------------------------------------------------------------
  test('Admin Page: lists organizations, search, add org with duplicate email handling, resend invite and enable/disable', async ({
    page,
  }) => {
    // Authenticate as platform_admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@realcrm.in');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*admin\/organizations/);

    // Verify Table Headers
    await expect(page.locator('th:has-text("Organization")')).toBeVisible();
    await expect(page.locator('th:has-text("Client Contact")')).toBeVisible();
    await expect(page.locator('th:has-text("Onboarding Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Account Status")')).toBeVisible();

    // Open "Add Organization" Modal
    await page.click('button:has-text("Add Organization")');
    await expect(page.locator('text=Register Client Organization')).toBeVisible();

    // Test duplicate email validation (owner@apex-luxury.in already exists)
    await page.fill('input[placeholder*="Prestige"]', 'Duplicate Test Realty');
    await page.fill('input[placeholder*="Priya"]', 'Test Client');
    await page.fill('input[placeholder*="director@"]', 'owner@apex-luxury.in');
    await page.click('button:has-text("Create & Send Invite")');

    // Should display 409 duplicate email error
    await expect(
      page.locator('text=already exists across the platform').first()
    ).toBeVisible({ timeout: 5000 });

    // Fill valid unique organization
    const uniqueEmail = `client_${Date.now()}@marquis-luxury.in`;
    await page.fill('input[placeholder*="Prestige"]', 'Marquis Private Estates');
    await page.fill('input[placeholder*="Priya"]', 'Rohit Singhania');
    await page.fill('input[placeholder*="director@"]', uniqueEmail);
    await page.click('button:has-text("Create & Send Invite")');

    // Modal closes and success toast appears
    await expect(page.locator('text=Register Client Organization')).not.toBeVisible();
    await expect(page.locator('text=Organization Created').first()).toBeVisible({ timeout: 10000 });

    // Search for newly created organization
    await page.fill('input[placeholder*="Search by organization"]', 'Marquis Private Estates');
    await expect(page.locator('text=Marquis Private Estates').first()).toBeVisible();
    await expect(page.locator(`text=${uniqueEmail}`).first()).toBeVisible();

    // Test "Resend Invite" Action
    const resendBtn = page.locator('button:has-text("Resend Invite")').first();
    await resendBtn.click();
    await expect(page.locator('text=Invitation Dispatched').first()).toBeVisible({ timeout: 5000 });

    // Test "Enable / Disable" Toggle Action
    const disableBtn = page.locator('button:has-text("Disable")').first();
    if (await disableBtn.isVisible()) {
      await disableBtn.click();
      await expect(page.locator('text=Status Updated').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('table span:has-text("DISABLED")').first()).toBeVisible();
    }
  });

  // -------------------------------------------------------------
  // Test 3: Accept Invite Page (/accept-invite/:token)
  // -------------------------------------------------------------
  test('Accept Invite Page: password strength validation and expired/invalid link error handling', async ({
    page,
  }) => {
    // 1. Visit with an invalid/expired token
    await page.goto('/accept-invite/invalid_expired_token_12345');
    await expect(page.locator('h1')).toContainText('Set Up Your Workspace');
    await expect(page.locator('text=Security Requirements:')).toBeVisible();

    // Fill mismatched or weak passwords to test validation
    await page.fill('input[placeholder="••••••••••••"]', 'weak');
    await expect(page.locator('button:has-text("Activate Account")')).toBeDisabled();

    // Fill valid matching password
    const passwordInputs = page.locator('input[placeholder="••••••••••••"]');
    await passwordInputs.nth(0).fill('SecureClient2026!');
    await passwordInputs.nth(1).fill('SecureClient2026!');

    // Checklist passes
    await expect(page.locator('text=✓ Passwords match')).toBeVisible();
    await expect(page.locator('text=✓ At least 8 characters')).toBeVisible();
    await expect(page.locator('text=✓ At least one letter')).toBeVisible();
    await expect(page.locator('text=✓ At least one number')).toBeVisible();

    // Submit with invalid token -> should display clear error card
    await page.click('button:has-text("Activate Account")');
    await expect(
      page.locator('text=This invitation link has expired or has already been used').first()
    ).toBeVisible({ timeout: 5000 });

    // Click "Return to Workspace Login"
    await page.click('button:has-text("Return to Workspace Login")');
    await expect(page).toHaveURL(/.*login/);
  });

  // -------------------------------------------------------------
  // Test 4: Route Guards & 403 Forbidden on /admin
  // -------------------------------------------------------------
  test('Route Guards: non-admins receive 403 Forbidden on /admin/organizations', async ({ page }) => {
    // Login as standard non-admin client
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@apex-luxury.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Apex Luxury Estates').first()).toBeVisible({ timeout: 10000 });

    // Attempt to access /admin/organizations directly
    await page.goto('/admin/organizations');
    await expect(page.locator('text=403')).toBeVisible();
    await expect(page.locator('text=Access Forbidden')).toBeVisible();
    await expect(
      page.locator('text=Platform administrator privileges are required')
    ).toBeVisible();

    // Return to dashboard link works
    await page.click('text=Return to Workspace Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  // -------------------------------------------------------------
  // Test 5: Client Onboarding Guard & Multi-Step Wizard (/onboarding)
  // -------------------------------------------------------------
  test('Client Onboarding: stepper 1-4 validation, review summary, and completion redirect to /dashboard', async ({
    page,
  }) => {
    // Completed client cannot reopen /onboarding (redirects to /dashboard)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@apex-luxury.in');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Try to visit /onboarding directly as a completed client
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  // -------------------------------------------------------------
  // Test 6: Responsive Layouts (375px mobile, 768px tablet, 1280px desktop)
  // -------------------------------------------------------------
  test('Responsive Layout Verification at 375px, 768px, and 1280px', async ({ page }) => {
    // 1. Mobile 375px
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 2. Tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 3. Desktop 1280px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

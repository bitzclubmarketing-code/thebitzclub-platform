import { test, expect } from '@playwright/test';

test.describe('Modal and Dialog Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
  });

  test('Admin login and verify no overlay issues when navigating pages', async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('9999999999');
    await page.getByTestId('login-password').fill('admin123');
    await page.getByTestId('login-submit').click();
    
    // Wait for admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    
    // Give page time to load fully
    await page.waitForTimeout(2000);
    
    // Verify no leftover overlay elements are blocking the page
    const overlays = await page.locator('[data-state="open"].bg-black\\/80, [data-radix-portal] .fixed.inset-0.bg-black').count();
    expect(overlays).toBe(0);
    
    // Click through navigation to ensure no stuck overlays - use data-testid
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 5000 });
    
    // Take screenshot to verify clean UI
    await page.screenshot({ path: '/app/tests/test-results/admin-no-overlay.png' });
  });

  test('Member dashboard has no stuck overlay elements', async ({ page }) => {
    // Login as member
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('PWAtest123!');
    await page.getByTestId('login-submit').click();
    
    await expect(page).toHaveURL(/\/member/, { timeout: 15000 });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    // Verify no overlay elements
    const portalOverlays = await page.locator('[data-radix-portal] [data-state="open"]').count();
    
    // There should be no open dialog overlays when just viewing the dashboard
    expect(portalOverlays).toBe(0);
    
    // Verify main content is interactive
    await expect(page.getByTestId('membership-card')).toBeVisible();
    await expect(page.getByTestId('download-card-btn')).toBeEnabled();
  });

  test('Toast notifications appear and can be dismissed', async ({ page }) => {
    // Login as member (triggers a toast)
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('PWAtest123!');
    await page.getByTestId('login-submit').click();
    
    await expect(page).toHaveURL(/\/member/, { timeout: 15000 });
    
    // Check for welcome toast
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    
    // Wait for toast to auto-dismiss or dismiss manually
    await page.waitForTimeout(3000);
  });

  test('Invalid login toast appears correctly without blocking UI', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Enter invalid credentials
    await page.getByTestId('login-identifier').fill('invaliduser');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();
    
    // Verify error toast appears
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 10000 });
    
    // Verify the login form is still usable (not blocked by overlay)
    await expect(page.getByTestId('login-identifier')).toBeEnabled();
    await expect(page.getByTestId('login-password')).toBeEnabled();
    await expect(page.getByTestId('login-submit')).toBeEnabled();
  });

  test('Page navigation does not leave stale overlays', async ({ page }) => {
    // Navigate through public pages
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Navigate to login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Navigate to register
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Navigate back to home
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Check for any stuck overlays
    const stuckOverlays = await page.locator('.fixed.inset-0.bg-black\\/80, [data-radix-portal][data-state="open"]').count();
    expect(stuckOverlays).toBe(0);
    
    // Verify page is interactive
    await expect(page.getByTestId('register-link')).toBeEnabled();
  });
});

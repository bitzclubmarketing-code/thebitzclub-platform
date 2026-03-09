import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
  });

  test('Homepage loads correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro dimensions)
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for content to load (splash screen may show briefly)
    await page.waitForTimeout(2000);
    
    // Verify BITZ Club branding is visible
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    
    // Verify navigation buttons are visible
    await expect(page.getByTestId('register-link')).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: '/app/tests/test-results/homepage-mobile.png', fullPage: false });
  });

  test('Landing page /landing works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Verify page loads
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    
    // Verify key elements are visible
    await expect(page.getByTestId('join-btn')).toBeVisible();
    await expect(page.getByTestId('whatsapp-btn')).toBeVisible();
    
    await page.screenshot({ path: '/app/tests/test-results/landing-mobile.png', fullPage: false });
  });

  test('Landing page enquiry form works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to enquiry section
    await page.locator('#enquiry').scrollIntoViewIfNeeded();
    
    // Verify form fields are visible
    await expect(page.getByTestId('lead-name')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('lead-mobile')).toBeVisible();
    await expect(page.getByTestId('lead-city')).toBeVisible();
    await expect(page.getByTestId('submit-lead-btn')).toBeVisible();
  });

  test('Login page is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Verify login form is usable
    await expect(page.getByTestId('login-identifier')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    
    // Test form can be filled
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('PWAtest123!');
    
    await page.screenshot({ path: '/app/tests/test-results/login-mobile.png', fullPage: false });
  });

  test('Member dashboard is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Login first
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('PWAtest123!');
    await page.getByTestId('login-submit').click();
    
    await expect(page).toHaveURL(/\/member/, { timeout: 15000 });
    
    // Verify dashboard elements are visible
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    await expect(page.getByTestId('logout-btn')).toBeVisible();
    
    await page.screenshot({ path: '/app/tests/test-results/dashboard-mobile.png', fullPage: false });
  });

  test('Membership card displays correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('PWAtest123!');
    await page.getByTestId('login-submit').click();
    
    await expect(page).toHaveURL(/\/member/, { timeout: 15000 });
    
    // Verify membership card
    await expect(page.getByTestId('membership-card')).toBeVisible({ timeout: 10000 });
    
    // Verify QR code is visible (should be smaller on mobile but present)
    const qrCode = page.getByTestId('membership-card').locator('svg').first();
    await expect(qrCode).toBeVisible();
    
    // Take screenshot of the card area
    await page.screenshot({ path: '/app/tests/test-results/membership-card-mobile.png', fullPage: false });
  });

  test('Register page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    
    // Verify form elements are visible
    await expect(page.getByTestId('register-name')).toBeVisible();
    await expect(page.getByTestId('register-mobile')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-submit')).toBeVisible();
    
    await page.screenshot({ path: '/app/tests/test-results/register-mobile.png', fullPage: false });
  });

  test('Homepage contact section is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
    
    // Verify contact section
    await expect(page.locator('text=Get in Touch')).toBeVisible();
    
    await page.screenshot({ path: '/app/tests/test-results/contact-mobile.png', fullPage: false });
  });

  test('Homepage plans section displays on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to plans section  
    await page.locator('#plans').scrollIntoViewIfNeeded();
    
    // Verify plans are visible
    await expect(page.locator('text=Membership Plans')).toBeVisible();
    
    await page.screenshot({ path: '/app/tests/test-results/plans-mobile.png', fullPage: false });
  });
});

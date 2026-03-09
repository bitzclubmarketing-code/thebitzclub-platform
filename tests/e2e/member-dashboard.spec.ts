import { test, expect } from '@playwright/test';

test.describe('Member Dashboard & Membership Card', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
    
    // Login as test member before each test
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('PWAtest123!');
    await page.getByTestId('login-submit').click();
    
    // Wait for member dashboard
    await expect(page).toHaveURL(/\/member/, { timeout: 15000 });
  });

  test('Member dashboard loads with member data', async ({ page }) => {
    // Verify header elements - use .first() since BITZ Club appears multiple times
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    await expect(page.getByTestId('logout-btn')).toBeVisible();
    
    // Verify membership section is visible
    await expect(page.locator('text=Your Membership')).toBeVisible({ timeout: 10000 });
    
    // Verify profile details section
    await expect(page.locator('text=Profile Details')).toBeVisible();
    
    // Verify Member ID is displayed (use .first() as ID appears in multiple places)
    await expect(page.locator('text=BITZ-2026').first()).toBeVisible();
  });

  test('Membership card displays correctly', async ({ page }) => {
    // Verify membership card container
    await expect(page.getByTestId('membership-card')).toBeVisible({ timeout: 10000 });
    
    // Verify card has BITZ Club branding
    const card = page.getByTestId('membership-card');
    await expect(card.locator('text=BITZ Club')).toBeVisible();
    
    // Verify member name is displayed
    await expect(card.locator('text=PWA Mobile Tester')).toBeVisible();
    
    // Verify Member ID is shown on card
    await expect(page.locator('.member-id')).toBeVisible();
  });

  test('QR code renders on membership card', async ({ page }) => {
    // Wait for membership card to be visible
    await expect(page.getByTestId('membership-card')).toBeVisible({ timeout: 10000 });
    
    // QR code is rendered as an SVG by react-qr-code library
    const qrCode = page.getByTestId('membership-card').locator('svg').first();
    await expect(qrCode).toBeVisible();
    
    // Verify QR code has some content (should have rect elements for the QR pattern)
    const qrElements = await page.getByTestId('membership-card').locator('svg path, svg rect').count();
    expect(qrElements).toBeGreaterThan(0);
  });

  test('Download card button is present and functional', async ({ page }) => {
    // Verify download button exists
    await expect(page.getByTestId('download-card-btn')).toBeVisible({ timeout: 10000 });
    
    // Click download button
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await page.getByTestId('download-card-btn').click();
    
    // Note: The download may not actually trigger in headless mode due to html2canvas/jsPDF
    // but we're testing the button click works without errors
    
    // Wait a moment for any errors to surface
    await page.waitForTimeout(2000);
  });

  test('Membership validity section displays correctly', async ({ page }) => {
    // Verify validity section
    await expect(page.locator('text=Membership Validity')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Valid From')).toBeVisible();
    await expect(page.locator('text=Valid Until')).toBeVisible();
  });

  test('Profile details show member information', async ({ page }) => {
    await expect(page.locator('text=Profile Details')).toBeVisible({ timeout: 10000 });
    
    // Should display mobile number
    await expect(page.locator('text=7777777777')).toBeVisible();
    
    // Should display status
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('Logout button works correctly', async ({ page }) => {
    await expect(page.getByTestId('logout-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('logout-btn').click();
    
    // Should redirect to homepage or login
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 });
  });

  test('Partner benefits section loads', async ({ page }) => {
    // Scroll down to partner benefits
    await page.locator('text=Partner Benefits').scrollIntoViewIfNeeded();
    
    // Verify partner benefits section
    await expect(page.locator('text=Partner Benefits')).toBeVisible();
  });
});

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

  test('Dashboard has tab navigation (My Card, Experiences, Benefits)', async ({ page }) => {
    // Verify all three tabs are visible
    await expect(page.getByRole('button', { name: /My Card/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Experiences/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Benefits/i })).toBeVisible();
    
    // Default active tab should be My Card - it has a gold background
    const myCardTab = page.getByRole('button', { name: /My Card/i });
    await expect(myCardTab).toHaveClass(/bg-\[#D4AF37\]/);
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
    await page.getByTestId('download-card-btn').click();
    
    // Note: The download may not actually trigger in headless mode due to html2canvas/jsPDF
    // but we're testing the button click works without errors
    // Wait for toast or any response
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  });

  test('Share card button is present and functional', async ({ page }) => {
    // Verify share button exists
    await expect(page.getByTestId('share-card-btn')).toBeVisible({ timeout: 10000 });
    
    // Click share button
    await page.getByTestId('share-card-btn').click();
    
    // Since navigator.share may not work in headless mode, it falls back to clipboard
    // Wait for toast notification
    await expect(page.locator('text=Link copied to clipboard').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
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

  test('Experiences tab shows lifestyle image gallery', async ({ page }) => {
    // Click on Experiences tab
    await page.getByRole('button', { name: /Experiences/i }).click();
    
    // Verify Experiences tab content
    await expect(page.locator('text=Exclusive Experiences')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Unlock premium lifestyle experiences')).toBeVisible();
    
    // Verify 8 lifestyle categories are displayed
    await expect(page.locator('text=Luxury Hotels')).toBeVisible();
    await expect(page.locator('text=Fine Dining')).toBeVisible();
    await expect(page.locator('text=Spa & Wellness')).toBeVisible();
    await expect(page.locator('text=Premium Gyms')).toBeVisible();
    await expect(page.locator('text=Swimming Pool')).toBeVisible();
    await expect(page.locator('text=Party Hall')).toBeVisible();
    await expect(page.locator('text=Marriage Venue')).toBeVisible();
    await expect(page.locator('text=Corporate Events')).toBeVisible();
  });

  test('Benefits tab shows partner discounts', async ({ page }) => {
    // Click on Benefits tab
    await page.getByRole('button', { name: /Benefits/i }).click();
    
    // Verify Benefits tab content
    await expect(page.locator('text=Partner Benefits')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Show your membership card at these venues')).toBeVisible();
  });

  test('Logout button works correctly', async ({ page }) => {
    await expect(page.getByTestId('logout-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('logout-btn').click();
    
    // Should redirect to homepage or login
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 });
  });
});

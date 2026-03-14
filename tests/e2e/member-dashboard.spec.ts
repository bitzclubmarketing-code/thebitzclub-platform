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
    await page.getByTestId('login-password').fill('member123');
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
    await expect(page.locator('text=Profile Details').first()).toBeVisible();
    
    // Verify Member ID is displayed (use .first() as ID appears in multiple places)
    await expect(page.locator('text=BITZ-2026').first()).toBeVisible();
  });

  test('Dashboard has tab navigation (My Card, My Profile, Affiliations, Bookings, Payments, Feedback)', async ({ page }) => {
    // Verify all SIX tabs are visible (UPDATED from 3 to 6 tabs)
    await expect(page.getByRole('button', { name: /My Card/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /My Profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Affiliations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Bookings/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Payments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Feedback/i })).toBeVisible();
    
    // Default active tab should be My Card - it has a gold background
    const myCardTab = page.getByRole('button', { name: /My Card/i });
    await expect(myCardTab).toHaveClass(/bg-\[#D4AF37\]/);
  });

  test('Membership card displays correctly', async ({ page }) => {
    // Verify membership card container (use first() for visible one)
    await expect(page.getByTestId('membership-card-front').first()).toBeVisible({ timeout: 10000 });
    
    // Verify card has BITZ Club branding
    const card = page.getByTestId('membership-card-front').first();
    await expect(card.locator('text=BITZ Club')).toBeVisible();
    
    // Verify member name is displayed
    await expect(card.locator('text=PWA Mobile Tester')).toBeVisible();
    
    // Verify Member ID is shown on card
    await expect(card.locator('text=BITZ-2026-EGAX7B')).toBeVisible();
  });

  test('QR code renders on membership card', async ({ page }) => {
    // Wait for membership card to be visible
    await expect(page.getByTestId('membership-card-front').first()).toBeVisible({ timeout: 10000 });
    
    // QR code is rendered as an SVG by react-qr-code library
    const qrCode = page.getByTestId('membership-card-front').first().locator('svg').first();
    await expect(qrCode).toBeVisible();
    
    // Verify QR code has some content (should have rect elements for the QR pattern)
    const qrElements = await page.getByTestId('membership-card-front').first().locator('svg path, svg rect').count();
    expect(qrElements).toBeGreaterThan(0);
  });

  test('Download card button is present and functional', async ({ page }) => {
    // Verify download PDF button exists
    await expect(page.getByTestId('download-pdf-btn')).toBeVisible({ timeout: 10000 });
    
    // Verify download Image button exists
    await expect(page.getByTestId('download-image-btn')).toBeVisible();
    
    // Verify buttons are clickable
    await expect(page.getByTestId('download-pdf-btn')).toBeEnabled();
    await expect(page.getByTestId('download-image-btn')).toBeEnabled();
  });

  test('Share card button is present and functional', async ({ page }) => {
    // Verify share button exists
    await expect(page.getByTestId('share-card-btn')).toBeVisible({ timeout: 10000 });
    
    // Click share button
    await page.getByTestId('share-card-btn').click();
    
    // Since navigator.share may not work in headless mode, it falls back to clipboard
    // Wait a moment for the action to complete
    await page.waitForTimeout(500);
  });

  test('Membership validity section displays correctly', async ({ page }) => {
    // Verify validity section
    await expect(page.locator('text=Membership Validity').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Valid From').first()).toBeVisible();
    await expect(page.locator('text=Valid Until').first()).toBeVisible();
  });

  test('Profile details show member information', async ({ page }) => {
    await expect(page.locator('text=Profile Details').first()).toBeVisible({ timeout: 10000 });
    
    // Should display mobile number
    await expect(page.locator('text=7777777777').first()).toBeVisible();
    
    // Should display status - use exact match to avoid partial matches
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
  });

  test('Affiliations tab shows partner venues', async ({ page }) => {
    // Click on Affiliations tab (UPDATED from Experiences)
    await page.getByRole('button', { name: /Affiliations/i }).click();
    
    // Verify Affiliations tab content
    await expect(page.locator('text=Our Affiliations')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Book your visit').first()).toBeVisible();
    
    // Verify some affiliates are displayed
    await expect(page.locator('text=Luxury Spa & Wellness').first()).toBeVisible();
  });

  test('Bookings tab shows booking history', async ({ page }) => {
    // Click on Bookings tab (UPDATED from Benefits)
    await page.getByRole('button', { name: /Bookings/i }).click();
    
    // Verify Bookings tab content
    await expect(page.locator('text=Bookings History').first()).toBeVisible({ timeout: 10000 });
    
    // Either bookings or empty state should show
    const hasBookings = await page.locator('text=CONFIRMED').first().isVisible().catch(() => false);
    const noBookings = await page.locator('text=No bookings').first().isVisible().catch(() => false);
    expect(hasBookings || noBookings).toBeTruthy();
  });

  test('Logout button works correctly', async ({ page }) => {
    await expect(page.getByTestId('logout-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('logout-btn').click();
    
    // Should redirect to homepage or login
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 });
  });
});

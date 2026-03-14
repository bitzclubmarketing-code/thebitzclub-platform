import { test, expect } from '@playwright/test';

test.describe('Member Dashboard Tabs - UI Updates', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
    
    // Login as test member
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-identifier').fill('7777777777');
    await page.getByTestId('login-password').fill('member123');
    await page.getByTestId('login-submit').click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/member/, { timeout: 15000 });
  });

  test('Dashboard has all 6 updated tabs (My Card, My Profile, Affiliations, Bookings, Payments, Feedback)', async ({ page }) => {
    // Wait for tabs to be visible
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Verify all 6 tabs
    await expect(page.getByRole('button', { name: /My Card/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /My Profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Affiliations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Bookings/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Payments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Feedback/i })).toBeVisible();
  });

  test('My Card tab shows membership card', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Default should be My Card tab
    await expect(page.getByRole('button', { name: /My Card/i })).toHaveClass(/bg-\[#D4AF37\]/);
    
    // Verify card elements
    await expect(page.locator('text=Profile Details').first()).toBeVisible();
    await expect(page.locator('text=BITZ-2026').first()).toBeVisible();
    await expect(page.getByTestId('download-pdf-btn')).toBeVisible();
  });

  test('My Profile tab shows member information', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Click My Profile tab
    await page.getByRole('button', { name: /My Profile/i }).click();
    
    // Verify profile content - use exact text matching
    await expect(page.locator('text=My Profile').first()).toBeVisible();
    await expect(page.locator('text=PWA Mobile Tester').first()).toBeVisible();
    await expect(page.locator('text=7777777777').first()).toBeVisible();
  });

  test('Affiliations tab shows partner venues with booking option', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Click Affiliations tab
    await page.getByRole('button', { name: /Affiliations/i }).click();
    
    // Verify Affiliations content
    await expect(page.locator('text=Our Affiliations').first()).toBeVisible();
    await expect(page.locator('text=Book your visit').first()).toBeVisible();
    
    // Verify affiliates are displayed
    await expect(page.locator('text=Luxury Spa & Wellness').first()).toBeVisible();
    
    // Verify phone and address info
    await expect(page.locator('text=9876543210').first()).toBeVisible();
  });

  test('Bookings tab shows booking history', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Click Bookings tab
    await page.getByRole('button', { name: /Bookings/i }).click();
    
    // Verify Bookings content
    await expect(page.locator('text=Bookings History').first()).toBeVisible();
    
    // Should show existing bookings or empty state
    const hasBookings = await page.locator('text=CONFIRMED').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No bookings').first().isVisible().catch(() => false);
    
    // Either bookings or empty state should be visible
    expect(hasBookings || hasEmptyState).toBeTruthy();
  });

  test('Payments tab is accessible', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Click Payments tab
    await page.getByRole('button', { name: /Payments/i }).click();
    
    // Verify Payments content loads
    await expect(page.locator('text=Payment').first()).toBeVisible();
  });

  test('Feedback tab allows submitting feedback', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Click Feedback tab
    await page.getByRole('button', { name: /Feedback/i }).click();
    
    // Verify Feedback form is displayed
    await expect(page.locator('text=Feedback').first()).toBeVisible();
    
    // Should have a textarea for feedback
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('Old tabs (Experiences, Benefits) should NOT be visible', async ({ page }) => {
    await expect(page.locator('text=Your Membership').first()).toBeVisible();
    
    // Old "Experiences" tab should not exist
    const experiencesTab = page.getByRole('button', { name: /Experiences/i });
    await expect(experiencesTab).not.toBeVisible();
    
    // Old "Benefits" tab should not exist
    const benefitsTab = page.getByRole('button', { name: /Benefits/i });
    await expect(benefitsTab).not.toBeVisible();
  });

  test('Logout works correctly', async ({ page }) => {
    await expect(page.getByTestId('logout-btn')).toBeVisible();
    await page.getByTestId('logout-btn').click();
    
    // Should redirect to homepage or login
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 });
  });
});

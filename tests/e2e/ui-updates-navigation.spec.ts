import { test, expect } from '@playwright/test';

test.describe('Homepage Navigation - UI Updates', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
  });

  test('Navigation has correct updated links (About Us, Offers, Affiliations, Gallery, Contact)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for content to load
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    
    // Verify updated navigation links
    await expect(page.locator('a[href="#about"]').first()).toBeVisible();
    await expect(page.locator('a[href="#offers"]').first()).toBeVisible();
    await expect(page.locator('a[href="#affiliations"]').first()).toBeVisible();
    await expect(page.locator('a[href="#gallery"]').first()).toBeVisible();
    await expect(page.locator('a[href="#contact"]').first()).toBeVisible();
    
    // Verify old "Experiences" link is NOT in primary nav
    const experiencesNavLink = page.locator('nav a[href="#experiences"]');
    await expect(experiencesNavLink).not.toBeVisible();
    
    // Verify old "Partners" link is NOT in primary nav (now Affiliations)
    const partnersNavLink = page.locator('nav a[href="#partners"]');
    await expect(partnersNavLink).not.toBeVisible();
  });

  test('Login is renamed to Member Login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    
    // Verify "Member Login" text is visible in the nav
    await expect(page.getByTestId('login-link')).toBeVisible();
    await expect(page.getByTestId('login-link')).toHaveText('Member Login');
  });

  test('Offers section displays exclusive offers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to offers section
    const offersSection = page.locator('#offers');
    await offersSection.scrollIntoViewIfNeeded();
    
    // Verify section header
    await expect(page.locator('text=Exclusive Offers').first()).toBeVisible();
    
    // Verify offers are displayed (sample offers from API)
    await expect(page.locator('text=Weekend Getaway Special').first()).toBeVisible();
    await expect(page.locator('text=Fine Dining Experience').first()).toBeVisible();
    
    // Verify discount badges are shown
    await expect(page.locator('text=30% OFF').first()).toBeVisible();
    await expect(page.locator('text=25% OFF').first()).toBeVisible();
  });

  test('Affiliations section displays partners with enhanced details', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to affiliations section
    const affiliationsSection = page.locator('#affiliations');
    await affiliationsSection.scrollIntoViewIfNeeded();
    
    // Verify section header says "Affiliations" not "Partners"
    await expect(page.locator('text=Our Affiliations').first()).toBeVisible();
    
    // Verify affiliations are displayed
    await expect(page.locator('text=Luxury Spa & Wellness').first()).toBeVisible();
    await expect(page.locator('text=Fine Dining Restaurant').first()).toBeVisible();
    
    // Verify enhanced details like phone numbers
    await expect(page.locator('text=9876543210').first()).toBeVisible();
    
    // Verify discount percentages are shown
    await expect(page.locator('text=% OFF').first()).toBeVisible();
  });

  test('Gallery section displays images', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to gallery section
    const gallerySection = page.locator('#gallery');
    await gallerySection.scrollIntoViewIfNeeded();
    
    // Verify section header
    await expect(page.locator('text=Photo Gallery').first()).toBeVisible();
    await expect(page.locator('text=Glimpses').first()).toBeVisible();
    
    // Gallery should render (either with custom images or fallback images)
    const galleryImages = page.locator('#gallery img');
    const imageCount = await galleryImages.count();
    expect(imageCount).toBeGreaterThanOrEqual(1);
  });

  test('Mobile navigation shows updated menu items', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    
    // Open mobile menu
    const menuButton = page.locator('nav button').filter({ has: page.locator('svg') }).last();
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    
    // Verify mobile menu has updated links
    await expect(page.getByRole('link', { name: 'About Us', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Offers', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Affiliations', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gallery', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact', exact: true }).first()).toBeVisible();
  });
});

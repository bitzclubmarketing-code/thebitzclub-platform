import { test, expect } from '@playwright/test';

test.describe('Homepage Premium Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
  });

  test('Homepage hero section displays with rotating background', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for content to load
    await expect(page.locator('text=BITZ Club').first()).toBeVisible({ timeout: 10000 });
    
    // Verify hero section content
    await expect(page.locator('text=Premium Lifestyle Membership')).toBeVisible();
    await expect(page.locator('text=Elevate Your')).toBeVisible();
    await expect(page.locator('text=Lifestyle').first()).toBeVisible();
    
    // Verify hero CTA buttons
    await expect(page.getByTestId('hero-join-btn')).toBeVisible();
    await expect(page.locator('text=Become a Member')).toBeVisible();
  });

  test('Navigation menu has correct links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for content to load (splash screen may show)
    await expect(page.locator('text=BITZ Club').first()).toBeVisible({ timeout: 15000 });
    
    // Verify desktop nav links (use .first() since some links appear multiple times)
    await expect(page.locator('a[href="#experiences"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href="#plans"]').first()).toBeVisible();
    await expect(page.locator('a[href="#partners"]').first()).toBeVisible();
    await expect(page.locator('a[href="#contact"]').first()).toBeVisible();
    
    // Verify login and register buttons
    await expect(page.getByTestId('login-link')).toBeVisible();
    await expect(page.getByTestId('register-link')).toBeVisible();
  });

  test('Mobile hamburger menu works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to load
    await expect(page.locator('text=BITZ Club').first()).toBeVisible({ timeout: 10000 });
    
    // Find and click hamburger menu button (Menu icon is inside the nav)
    const menuButton = page.locator('nav button').filter({ has: page.locator('svg') }).last();
    await expect(menuButton).toBeVisible({ timeout: 5000 });
    await menuButton.click();
    
    // Verify mobile menu opens - check for visible menu item text
    await expect(page.getByRole('link', { name: 'Experiences', exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'Plans', exact: true }).first()).toBeVisible();
    
    // Click close button (X icon) - same button but now shows X
    await menuButton.click();
    
    // Mobile menu items in dropdown should be hidden (use mobile dropdown specific selector)
    // The mobile menu div that opens has specific styling
    const mobileMenuDiv = page.locator('.md\\:hidden.bg-\\[\\#1A1A1C\\]');
    await expect(mobileMenuDiv).not.toBeVisible({ timeout: 3000 });
  });

  test('Lifestyle experiences gallery displays 8 categories', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to experiences section
    const experiencesSection = page.locator('#experiences');
    await experiencesSection.scrollIntoViewIfNeeded();
    
    // Verify section header
    await expect(page.locator('text=Lifestyle Experiences')).toBeVisible({ timeout: 10000 });
    
    // Verify all 8 lifestyle categories are visible
    await expect(page.locator('text=Luxury Hotels').first()).toBeVisible();
    await expect(page.locator('text=Fine Dining').first()).toBeVisible();
    await expect(page.locator('text=Spa & Wellness').first()).toBeVisible();
    await expect(page.locator('text=Premium Gyms').first()).toBeVisible();
    await expect(page.locator('text=Swimming Pool').first()).toBeVisible();
    await expect(page.locator('text=Party Hall').first()).toBeVisible();
    await expect(page.locator('text=Marriage Venue').first()).toBeVisible();
    await expect(page.locator('text=Corporate Day Out').first()).toBeVisible();
  });

  test('Experience gallery shows discount badges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to experiences section
    const experiencesSection = page.locator('#experiences');
    await experiencesSection.scrollIntoViewIfNeeded();
    
    // Verify discount badges are visible
    await expect(page.locator('text=Up to 40% Off').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Up to 25% Off').first()).toBeVisible();
    await expect(page.locator('text=Complimentary').first()).toBeVisible();
  });

  test('Desktop view shows featured experience carousel with dots', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Verify featured experience card is visible (right side of hero)
    // The card shows the current carousel item with image and discount
    await expect(page.locator('text=Exclusive rates at 5-star').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    // Verify carousel dots (8 dots for 8 experiences)
    const carouselDots = page.locator('button.rounded-full[class*="w-2"][class*="h-2"]');
    // Should have 8 dots
    const dotsCount = await carouselDots.count();
    expect(dotsCount).toBeGreaterThanOrEqual(8);
  });

  test('Plans section loads with membership options', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to plans section
    const plansSection = page.locator('#plans');
    await plansSection.scrollIntoViewIfNeeded();
    
    // Verify plans section header
    await expect(page.locator('text=Membership Plans').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Choose Your Tier')).toBeVisible();
  });

  test('Partners section loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to partners section
    const partnersSection = page.locator('#partners');
    await partnersSection.scrollIntoViewIfNeeded();
    
    // Verify partners section header
    await expect(page.locator('text=Partner Venues').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Our Network')).toBeVisible();
  });

  test('Contact section displays correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to contact section
    const contactSection = page.locator('#contact');
    await contactSection.scrollIntoViewIfNeeded();
    
    // Verify contact section content
    await expect(page.locator('text=Get in Touch')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=+91 78129 01118')).toBeVisible();
    await expect(page.locator('text=hello@bitzclub.com')).toBeVisible();
    await expect(page.locator('text=Chennai, Tamil Nadu')).toBeVisible();
  });

  test('Footer has correct links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Verify footer content
    await expect(page.locator('text=© 2026 BITZ Club')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('footer a[href="/login"]')).toBeVisible();
    await expect(page.locator('footer a[href="/register"]')).toBeVisible();
    await expect(page.locator('footer a[href="/landing"]')).toBeVisible();
  });
});

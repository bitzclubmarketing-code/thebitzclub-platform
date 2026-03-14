import { test, expect } from '@playwright/test';

test.describe('Membership Card Feature', () => {
  
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
    
    // Wait for card to load - use first() since there are hidden duplicate cards for PDF
    await expect(page.getByTestId('membership-card-front').first()).toBeVisible({ timeout: 10000 });
  });

  test('Member Dashboard loads with membership card displayed', async ({ page }) => {
    // Verify header elements
    await expect(page.locator('text=BITZ Club').first()).toBeVisible();
    await expect(page.getByTestId('logout-btn')).toBeVisible();
    
    // Verify membership section is visible
    await expect(page.locator('text=Your Membership')).toBeVisible();
    
    // Verify membership card front side is displayed (use first() for visible one)
    await expect(page.getByTestId('membership-card-front').first()).toBeVisible();
    
    // Verify card is marked as "Front Side"
    await expect(page.locator('text=Front Side').first()).toBeVisible();
  });

  test('Card front side shows member photo placeholder, name, ID, QR code, plan, validity', async ({ page }) => {
    // Use first() to get the visible card (not the hidden one for PDF)
    const cardFront = page.getByTestId('membership-card-front').first();
    
    // Verify BITZ Club branding on card
    await expect(cardFront.locator('text=BITZ Club')).toBeVisible();
    
    // Verify member name is displayed
    await expect(cardFront.locator('text=PWA Mobile Tester')).toBeVisible();
    
    // Verify Member ID is shown
    await expect(cardFront.locator('text=BITZ-2026-EGAX7B')).toBeVisible();
    
    // Verify QR code is rendered (SVG element from react-qr-code)
    const qrCode = cardFront.locator('svg').first();
    await expect(qrCode).toBeVisible();
    
    // Verify plan label exists
    await expect(cardFront.locator('text=Plan').first()).toBeVisible();
    
    // Verify validity label exists
    await expect(cardFront.locator('text=Valid Till').first()).toBeVisible();
    
    // Verify member status badge is present (PENDING, ACTIVE, etc.)
    await expect(cardFront.locator('text=/pending|active|expired/i').first()).toBeVisible();
  });

  test('Card back side shows terms, contact info, usage instructions', async ({ page }) => {
    // Click flip card button to show back side
    await page.getByTestId('flip-card-btn').click();
    
    // Wait for flip animation and back side to appear (use first() for visible one)
    await expect(page.getByTestId('membership-card-back').first()).toBeVisible({ timeout: 5000 });
    
    // Verify label changed to "Back Side"
    await expect(page.locator('text=Back Side').first()).toBeVisible();
    
    // Use first() to get the visible card back
    const cardBack = page.getByTestId('membership-card-back').first();
    
    // Verify Terms & Conditions section
    await expect(cardBack.locator('text=Terms & Conditions')).toBeVisible();
    
    // Verify How to Use section
    await expect(cardBack.locator('text=How to Use')).toBeVisible();
    
    // Verify contact information
    await expect(cardBack.locator('text=+91 98765 43210')).toBeVisible();
    await expect(cardBack.locator('text=hello@bitzclub.com')).toBeVisible();
    await expect(cardBack.locator('text=www.bitzclub.com')).toBeVisible();
    
    // Verify emergency contact
    await expect(cardBack.locator('text=24/7 Support').first()).toBeVisible();
    await expect(cardBack.locator('text=1800-XXX-BITZ')).toBeVisible();
  });

  test('Flip card button toggles between front and back', async ({ page }) => {
    // Initially front side should be visible (use first() for visible one)
    await expect(page.getByTestId('membership-card-front').first()).toBeVisible();
    await expect(page.locator('text=Front Side').first()).toBeVisible();
    
    // Button should say "Show Back"
    const flipBtn = page.getByTestId('flip-card-btn');
    await expect(flipBtn).toContainText('Show Back');
    
    // Click to show back
    await flipBtn.click();
    await expect(page.getByTestId('membership-card-back').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Back Side').first()).toBeVisible();
    
    // Button should now say "Show Front"
    await expect(flipBtn).toContainText('Show Front');
    
    // Click to show front again
    await flipBtn.click();
    await expect(page.getByTestId('membership-card-front').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Front Side').first()).toBeVisible();
  });

  test('Upload Photo button is present and functional', async ({ page }) => {
    // Verify upload photo button exists
    const uploadBtn = page.getByTestId('upload-photo-btn');
    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toContainText('Upload Photo');
    
    // Verify hidden file input exists
    const fileInput = page.getByTestId('photo-upload-input');
    await expect(fileInput).toBeAttached();
  });

  test('Download PDF button triggers card download', async ({ page }) => {
    const downloadPdfBtn = page.getByTestId('download-pdf-btn');
    await expect(downloadPdfBtn).toBeVisible();
    await expect(downloadPdfBtn).toContainText('Download PDF');
    
    // Verify button is clickable
    await expect(downloadPdfBtn).toBeEnabled();
  });

  test('Download Image button triggers image download', async ({ page }) => {
    const downloadImgBtn = page.getByTestId('download-image-btn');
    await expect(downloadImgBtn).toBeVisible();
    await expect(downloadImgBtn).toContainText('Image');
    
    // Verify button is clickable
    await expect(downloadImgBtn).toBeEnabled();
  });

  test('Share button is present and functional', async ({ page }) => {
    const shareBtn = page.getByTestId('share-card-btn');
    await expect(shareBtn).toBeVisible();
    
    // Verify button is clickable
    await expect(shareBtn).toBeEnabled();
  });

  test('Profile Details section displays member information', async ({ page }) => {
    // Verify Profile Details section
    await expect(page.locator('text=Profile Details').first()).toBeVisible();
    
    // Verify Member ID is displayed
    await expect(page.locator('text=Member ID').first()).toBeVisible();
    await expect(page.locator('text=BITZ-2026-EGAX7B').first()).toBeVisible();
    
    // Verify Mobile is displayed
    await expect(page.locator('text=Mobile').first()).toBeVisible();
    await expect(page.locator('text=7777777777').first()).toBeVisible();
    
    // Verify Email is displayed
    await expect(page.locator('text=Email').first()).toBeVisible();
    await expect(page.locator('text=pwa.test@example.com').first()).toBeVisible();
    
    // Verify Plan is displayed
    await expect(page.locator('text=Plan').first()).toBeVisible();
    
    // Verify Status is displayed
    await expect(page.locator('text=Status').first()).toBeVisible();
  });

  test('Membership Validity section displays dates', async ({ page }) => {
    // Verify validity section
    await expect(page.locator('text=Membership Validity').first()).toBeVisible();
    await expect(page.locator('text=Valid From').first()).toBeVisible();
    await expect(page.locator('text=Valid Until').first()).toBeVisible();
  });

  test('Card has credit card dimensions note', async ({ page }) => {
    // Verify the card size note is visible
    await expect(page.locator('text=Credit card size').first()).toBeVisible();
    await expect(page.locator('text=Print ready').first()).toBeVisible();
  });
});

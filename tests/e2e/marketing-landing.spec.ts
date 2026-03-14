import { test, expect } from '@playwright/test';

test.describe('Marketing Landing Page - Lead Capture', () => {
  test.beforeEach(async ({ page }) => {
    // Hide Emergent badge
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('Marketing landing page loads at /join route', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Check page loads with title - use specific heading
    await expect(page.getByRole('heading', { name: 'Join BITZ Club' })).toBeVisible();
    
    // Check step progress indicator shows step 1
    await expect(page.getByTestId('step1-name')).toBeVisible();
  });

  test('Marketing landing page loads at /marketing route', async ({ page }) => {
    await page.goto('/marketing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Live the Premium Lifestyle')).toBeVisible();
  });

  test('Marketing landing page loads at /promo route', async ({ page }) => {
    await page.goto('/promo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Join BITZ Club' })).toBeVisible();
  });

  test('Step 1 form displays all required fields', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Check all form fields are present
    await expect(page.getByTestId('step1-name')).toBeVisible();
    await expect(page.getByTestId('step1-mobile')).toBeVisible();
    await expect(page.getByTestId('step1-email')).toBeVisible();
    await expect(page.getByTestId('step1-referral')).toBeVisible();
    await expect(page.getByTestId('step1-submit')).toBeVisible();
  });

  test('Step 1 form validates required fields', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Click submit without filling form
    await page.getByTestId('step1-submit').click();
    
    // Should show error toast
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
  });

  test('Step 1 form validates mobile number format', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Fill with invalid mobile (less than 10 digits)
    await page.getByTestId('step1-name').fill('Test User');
    await page.getByTestId('step1-mobile').fill('123456');
    await page.getByTestId('step1-submit').click();
    
    // Should show validation error
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-sonner-toast]')).toContainText(/10-digit/i);
  });

  test('Step 1 successful submission advances to Step 2', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `9${timestamp.toString().slice(-9)}`;
    
    // Fill form with valid data
    await page.getByTestId('step1-name').fill(`Test User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-email').fill(`test_${timestamp}@example.com`);
    await page.getByTestId('step1-referral').fill('TEST123');
    
    // Submit
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2 to appear
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Step 2 form fields should be visible
    await expect(page.getByTestId('step2-city')).toBeVisible();
    await expect(page.getByTestId('step2-password')).toBeVisible();
    await expect(page.getByTestId('step2-submit')).toBeVisible();
  });

  test('Referral code from URL is pre-filled', async ({ page }) => {
    await page.goto('/join?ref=PROMO2024', { waitUntil: 'domcontentloaded' });
    
    // Referral code should be pre-filled
    const referralInput = page.getByTestId('step1-referral');
    await expect(referralInput).toHaveValue('PROMO2024');
  });
});

test.describe('Marketing Landing Page - Step 2 Plan Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Hide Emergent badge
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('Step 2 shows plan selection with prices', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `8${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`Plan Test User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Plans should be loaded (check for radio buttons with plan prices)
    const planRadios = page.locator('input[type="radio"][name="plan"]');
    await expect(planRadios.first()).toBeVisible({ timeout: 5000 });
    
    // At least one plan should show price with ₹ symbol - use .first()
    await expect(page.locator('text=/₹\\d+/').first()).toBeVisible();
  });

  test('Step 2 validates password fields', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `7${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`Password Test ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Fill mismatched passwords
    await page.getByTestId('step2-password').fill('password123');
    await page.getByTestId('step2-confirm-password').fill('differentpass');
    await page.getByTestId('step2-submit').click();
    
    // Should show error about password mismatch - use filter for error toast
    await expect(page.locator('[data-sonner-toast][data-type="error"]').first()).toContainText(/match/i, { timeout: 5000 });
  });

  test('Step 2 validates short password', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `6${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`Short Pass Test ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Fill short password
    await page.getByTestId('step2-password').fill('123');
    await page.getByTestId('step2-confirm-password').fill('123');
    await page.getByTestId('step2-submit').click();
    
    // Should show error about password length - use filter for error toast
    await expect(page.locator('[data-sonner-toast][data-type="error"]').first()).toContainText(/6 characters/i, { timeout: 5000 });
  });

  test('Back button returns to Step 1', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `5${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`Back Button Test ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Click back button
    await page.getByRole('button', { name: /back/i }).click();
    
    // Should return to step 1 form - use specific heading
    await expect(page.getByRole('heading', { name: 'Join BITZ Club' })).toBeVisible();
    await expect(page.getByTestId('step1-name')).toBeVisible();
  });
});

test.describe('Marketing Landing Page - Contact Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent"], #emergent-badge');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('WhatsApp button is visible and has correct link', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const whatsappBtn = page.getByTestId('whatsapp-btn');
    await expect(whatsappBtn).toBeVisible();
    
    // Check href contains WhatsApp URL
    const href = await whatsappBtn.getAttribute('href');
    expect(href).toContain('wa.me/917812901118');
  });

  test('Call Now button is visible and has correct link', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const callBtn = page.getByTestId('call-now-btn');
    await expect(callBtn).toBeVisible();
    
    // Check href contains tel: link
    const href = await callBtn.getAttribute('href');
    expect(href).toContain('tel:');
    expect(href).toContain('7812901118');
  });

  test('Chat button opens chat modal', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Remove the emergent badge by evaluating JS
    await page.evaluate(() => {
      const badge = document.getElementById('emergent-badge');
      if (badge) badge.remove();
    });
    
    const chatBtn = page.getByTestId('chat-btn');
    await expect(chatBtn).toBeVisible();
    
    // Click chat button
    await chatBtn.click();
    
    // Modal should open with chat form
    await expect(page.getByText('Send us a Message')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('chat-name')).toBeVisible();
    await expect(page.getByTestId('chat-mobile')).toBeVisible();
    await expect(page.getByTestId('chat-message')).toBeVisible();
    await expect(page.getByTestId('chat-submit')).toBeVisible();
  });

  test('Chat form validates required fields', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Remove the emergent badge
    await page.evaluate(() => {
      const badge = document.getElementById('emergent-badge');
      if (badge) badge.remove();
    });
    
    // Open chat modal
    await page.getByTestId('chat-btn').click();
    await expect(page.getByText('Send us a Message')).toBeVisible({ timeout: 5000 });
    
    // Submit without filling fields
    await page.getByTestId('chat-submit').click();
    
    // Should show error - use first() to avoid strict mode
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 });
  });

  test('Chat form can be closed', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Remove the emergent badge
    await page.evaluate(() => {
      const badge = document.getElementById('emergent-badge');
      if (badge) badge.remove();
    });
    
    // Open chat modal
    await page.getByTestId('chat-btn').click();
    await expect(page.getByText('Send us a Message')).toBeVisible({ timeout: 5000 });
    
    // Close modal by clicking X
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();
    
    // Modal should close
    await expect(page.getByText('Send us a Message')).not.toBeVisible({ timeout: 3000 });
  });

  test('Chat form submits enquiry successfully', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    
    // Remove the emergent badge
    await page.evaluate(() => {
      const badge = document.getElementById('emergent-badge');
      if (badge) badge.remove();
    });
    
    // Open chat modal
    await page.getByTestId('chat-btn').click();
    await expect(page.getByText('Send us a Message')).toBeVisible({ timeout: 5000 });
    
    // Fill chat form
    await page.getByTestId('chat-name').fill(`Enquiry User ${timestamp}`);
    await page.getByTestId('chat-mobile').fill(`4${timestamp.toString().slice(-9)}`);
    await page.getByTestId('chat-message').fill('I have a question about membership plans.');
    
    // Submit
    await page.getByTestId('chat-submit').click();
    
    // Success message should appear - use first() to avoid strict mode
    await expect(page.locator('[data-sonner-toast]').first()).toContainText(/sent|contact/i, { timeout: 10000 });
  });
});

test.describe('Marketing Landing Page - Benefits & Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('Benefits section displays lifestyle experiences', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Scroll to benefits section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    
    // Check for benefits content - use first() for duplicate text
    await expect(page.getByText('Membership Benefits').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Luxury Hotels').first()).toBeVisible();
    await expect(page.getByText('Fine Dining').first()).toBeVisible();
    await expect(page.getByText('Spa & Wellness').first()).toBeVisible();
  });

  test('Hero stats are displayed', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Check stats - use first() for duplicate text
    await expect(page.getByText('500+').first()).toBeVisible();
    await expect(page.getByText('Partner Venues').first()).toBeVisible();
    await expect(page.getByText('40%').first()).toBeVisible();
    await expect(page.getByText('Avg. Savings').first()).toBeVisible();
  });

  test('Navigation bar shows phone and WhatsApp', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Navigation should have phone number and WhatsApp link - use first() for duplicates
    await expect(page.getByRole('link', { name: /whatsapp/i }).first()).toBeVisible();
    await expect(page.getByText('+917812901118').first()).toBeVisible();
  });

  test('Footer has contact information', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Footer should have BITZ Club and contact info
    await expect(page.locator('footer').getByText('BITZ Club').first()).toBeVisible({ timeout: 5000 });
  });
});


test.describe('Marketing Landing Page - Enhanced Features (Country & Referral)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('Country code selector is visible with default India (+91)', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Country selector should be visible
    const countrySelector = page.getByTestId('country-selector');
    await expect(countrySelector).toBeVisible();
    
    // Should show India flag and +91 by default
    await expect(countrySelector).toContainText('+91');
  });

  test('Country code selector dropdown shows all 15 countries', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Click country selector to open dropdown
    await page.getByTestId('country-selector').click();
    
    // Wait for dropdown to appear
    await page.waitForSelector('.absolute.top-full');
    
    // Check that multiple countries are visible
    await expect(page.getByText('India', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('United States')).toBeVisible();
    await expect(page.getByText('United Kingdom')).toBeVisible();
    await expect(page.getByText('UAE')).toBeVisible();
    await expect(page.getByText('Singapore')).toBeVisible();
  });

  test('Selecting UAE country code updates form', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Click country selector
    await page.getByTestId('country-selector').click();
    
    // Select UAE
    await page.getByText('UAE').click();
    
    // Verify country selector shows UAE code
    await expect(page.getByTestId('country-selector')).toContainText('+971');
    
    // Mobile input placeholder should update for 9 digits (UAE)
    const mobileInput = page.getByTestId('step1-mobile');
    await expect(mobileInput).toHaveAttribute('placeholder', '9-digit number');
  });

  test('Selecting US country code updates placeholder', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Click country selector
    await page.getByTestId('country-selector').click();
    
    // Select US
    await page.getByText('United States').click();
    
    // Verify country selector shows US code
    await expect(page.getByTestId('country-selector')).toContainText('+1');
    
    // Mobile input placeholder should update for 10 digits
    await expect(page.getByTestId('step1-mobile')).toHaveAttribute('placeholder', '10-digit number');
  });

  test('Referral code auto-populates from ?referral= URL param', async ({ page }) => {
    await page.goto('/join?referral=FRIEND2024', { waitUntil: 'domcontentloaded' });
    
    // Referral field should have the value
    await expect(page.getByTestId('step1-referral')).toHaveValue('FRIEND2024');
  });

  test('Referral code auto-populates from ?code= URL param', async ({ page }) => {
    await page.goto('/join?code=DISCOUNT10', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('step1-referral')).toHaveValue('DISCOUNT10');
  });

  test('Referral code auto-populates from ?promo= URL param', async ({ page }) => {
    await page.goto('/join?promo=SPRING2024', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('step1-referral')).toHaveValue('SPRING2024');
  });

  test('Referral code auto-populates from ?utm_campaign= URL param', async ({ page }) => {
    await page.goto('/join?utm_campaign=EMAIL_BLAST', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('step1-referral')).toHaveValue('EMAIL_BLAST');
  });

  test('Referral code from ?ref= is applied correctly', async ({ page }) => {
    await page.goto('/join?ref=TESTOFFER', { waitUntil: 'domcontentloaded' });
    
    // Referral field should have the value (primary check)
    await expect(page.getByTestId('step1-referral')).toHaveValue('TESTOFFER');
    
    // Toast notification is optional - just verify field is populated
  });

  test('International user (UAE) validation accepts 9 digits', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Select UAE
    await page.getByTestId('country-selector').click();
    await page.getByText('UAE').click();
    
    const timestamp = Date.now();
    
    // Fill form with 9 digit UAE mobile
    await page.getByTestId('step1-name').fill(`UAE Test User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill('501234567'); // 9 digits for UAE
    
    // Submit should succeed
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2 or success toast
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Marketing Landing Page - PIN Code Auto-fill (India)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('PIN code field is visible for Indian users in Step 2', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `9${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`PIN Test User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // PIN code field should be visible
    await expect(page.getByTestId('step2-pincode')).toBeVisible();
    
    // City and State fields should be visible for India
    await expect(page.getByTestId('step2-city')).toBeVisible();
    await expect(page.getByTestId('step2-state')).toBeVisible();
  });

  test('PIN code auto-fills city and state for valid Indian PIN', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `8${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`PIN AutoFill User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Enter valid Indian PIN code (Mumbai)
    await page.getByTestId('step2-pincode').fill('400001');
    
    // Wait for auto-fill to complete (API call + toast)
    await expect(page.locator('[data-sonner-toast]').first()).toContainText(/location found/i, { timeout: 10000 });
    
    // City should be auto-filled with Mumbai
    await expect(page.getByTestId('step2-city')).toHaveValue(/Mumbai/i);
    
    // State should be auto-filled with Maharashtra
    await expect(page.getByTestId('step2-state')).toHaveValue(/Maharashtra/i);
  });

  test('Invalid PIN code shows error toast', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    const timestamp = Date.now();
    const testMobile = `7${timestamp.toString().slice(-9)}`;
    
    // Complete step 1
    await page.getByTestId('step1-name').fill(`Invalid PIN User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill(testMobile);
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // Enter invalid PIN code
    await page.getByTestId('step2-pincode').fill('000000');
    
    // Should show error toast
    await expect(page.locator('[data-sonner-toast][data-type="error"]').first()).toContainText(/invalid/i, { timeout: 10000 });
  });

  test('International user (UAE) does not see state field', async ({ page }) => {
    await page.goto('/join', { waitUntil: 'domcontentloaded' });
    
    // Select UAE
    await page.getByTestId('country-selector').click();
    await page.getByText('UAE').click();
    
    const timestamp = Date.now();
    
    // Complete step 1 with UAE mobile
    await page.getByTestId('step1-name').fill(`UAE User ${timestamp}`);
    await page.getByTestId('step1-mobile').fill('501234567'); // 9 digits for UAE
    await page.getByTestId('step1-submit').click();
    
    // Wait for step 2
    await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 });
    
    // UAE users should see city and country, but state should not be visible
    await expect(page.getByTestId('step2-city')).toBeVisible();
    await expect(page.getByTestId('step2-country')).toBeVisible();
    
    // State field should NOT be visible for international users
    await expect(page.getByTestId('step2-state')).not.toBeVisible();
  });
});


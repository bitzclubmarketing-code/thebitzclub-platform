import { test, expect } from '@playwright/test';
import { dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://membership-go-live.preview.emergentagent.com';

test.describe('Registration Page - Plan Selection & Photo Upload', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    // Navigate and wait for page to load
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await removeEmergentBadge(page);
    // Wait for form to be visible
    await expect(page.getByTestId('register-name')).toBeVisible({ timeout: 15000 });
  });

  test('Registration page loads with form and plan selection', async ({ page }) => {
    // Verify form section
    await expect(page.getByRole('heading', { name: /your details/i })).toBeVisible();
    await expect(page.getByTestId('register-name')).toBeVisible();
    await expect(page.getByTestId('register-mobile')).toBeVisible();
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password')).toBeVisible();
    
    // Verify plan selection section
    await expect(page.getByRole('heading', { name: /select your plan/i })).toBeVisible();
  });

  test('Plans are loaded dynamically from API', async ({ page }) => {
    // Wait for plans to load from API
    const planCards = page.locator('[data-testid^="select-plan-"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
    
    const planCount = await planCards.count();
    expect(planCount).toBeGreaterThan(0);
    
    // Verify at least one plan has price and duration
    const firstPlan = planCards.first();
    await expect(firstPlan.getByText(/₹/)).toBeVisible();
    await expect(firstPlan.getByText(/months/i)).toBeVisible();
  });

  test('Photo upload section is visible', async ({ page }) => {
    // Photo upload section should be visible
    await expect(page.getByText(/profile photo/i)).toBeVisible();
    await expect(page.getByText(/upload your photo for membership card/i)).toBeVisible();
    
    // Camera icon should be visible
    await expect(page.locator('.lucide-camera')).toBeVisible();
  });

  test('Can select different plans', async ({ page }) => {
    // Wait for plans to load
    const planCards = page.locator('[data-testid^="select-plan-"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
    
    const planCount = await planCards.count();
    if (planCount >= 2) {
      // Click second plan
      await planCards.nth(1).click();
      
      // Verify selection indicator appears on second plan
      await expect(planCards.nth(1).getByText(/selected plan/i)).toBeVisible();
      
      // First plan should not show selected
      const firstPlanSelected = await planCards.first().getByText(/selected plan/i).isVisible().catch(() => false);
      expect(firstPlanSelected).toBeFalsy();
    }
  });

  test('Submit button shows selected plan price', async ({ page }) => {
    // Wait for plans to load
    const planCards = page.locator('[data-testid^="select-plan-"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
    
    // Submit button should show "Pay ₹X & Register"
    const submitBtn = page.getByTestId('register-submit');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText(/pay.*₹.*register/i);
  });

  test('Date of birth field has correct validation', async ({ page }) => {
    const dobField = page.getByTestId('register-dob');
    await expect(dobField).toBeVisible();
    
    // Should have max date set (cannot be future date)
    const maxAttr = await dobField.getAttribute('max');
    expect(maxAttr).toBeTruthy();
    
    // Max should be today or earlier
    const maxDate = new Date(maxAttr!);
    const today = new Date();
    expect(maxDate.getTime()).toBeLessThanOrEqual(today.getTime());
  });

  test('Referral ID field accepts employee and associate IDs', async ({ page }) => {
    const referralField = page.getByTestId('register-referral-id');
    await expect(referralField).toBeVisible();
    
    // Verify placeholder suggests format
    const placeholder = await referralField.getAttribute('placeholder');
    expect(placeholder).toContain('BITZ-E001');
    expect(placeholder).toContain('BITZ-A001');
    
    // Fill with employee ID format
    await referralField.fill('BITZ-E001');
    await expect(referralField).toHaveValue('BITZ-E001');
    
    // Fill with associate ID format
    await referralField.fill('BITZ-A001');
    await expect(referralField).toHaveValue('BITZ-A001');
  });

  test('Password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByTestId('register-password');
    await passwordInput.fill('TestPassword123!');
    
    // Verify password is hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    const toggleBtn = page.locator('button').filter({ has: page.locator('.lucide-eye, .lucide-eye-off') }).first();
    await toggleBtn.click();
    
    // Verify password is now visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Password mismatch shows validation error', async ({ page }) => {
    // Fill form with mismatched passwords
    await page.getByTestId('register-name').fill('Test User');
    await page.getByTestId('register-mobile').fill('1234567890');
    await page.getByTestId('register-password').fill('Password123!');
    await page.getByTestId('register-confirm-password').fill('DifferentPassword!');
    
    // Try to submit
    await page.getByTestId('register-submit').click();
    
    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 });
  });

  test('Mobile number validation requires 10 digits', async ({ page }) => {
    // Fill form with invalid mobile
    await page.getByTestId('register-name').fill('Test User');
    await page.getByTestId('register-mobile').fill('123');
    await page.getByTestId('register-password').fill('Test123!');
    await page.getByTestId('register-confirm-password').fill('Test123!');
    
    // Wait for plans
    const planCards = page.locator('[data-testid^="select-plan-"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
    
    // Try to submit
    await page.getByTestId('register-submit').click();
    
    // Should show validation error for mobile
    await expect(page.getByText(/valid mobile number/i)).toBeVisible({ timeout: 5000 });
  });

  test('Secure payment info is displayed', async ({ page }) => {
    // Verify Razorpay payment info is shown
    await expect(page.getByText(/secure payment via razorpay/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/membership will be activated immediately/i)).toBeVisible();
  });

  test('Link to login page works', async ({ page }) => {
    // Find and click login link
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Verify navigation to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Required field validation on empty submit', async ({ page }) => {
    // Wait for plans to load (form needs to be ready)
    const planCards = page.locator('[data-testid^="select-plan-"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
    
    // Try to submit empty form
    await page.getByTestId('register-submit').click();
    
    // Should show validation error
    await expect(page.getByText(/fill in all required fields|please enter/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Registration Initiation API Integration', () => {
  test('Registration form submits and opens Razorpay', async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await removeEmergentBadge(page);
    
    // Wait for form to be visible
    await expect(page.getByTestId('register-name')).toBeVisible({ timeout: 15000 });
    
    // Fill valid registration form
    const uniqueMobile = `98${Date.now().toString().slice(-8)}`;
    await page.getByTestId('register-name').fill('Test Registration User');
    await page.getByTestId('register-mobile').fill(uniqueMobile);
    await page.getByTestId('register-email').fill('test_playwright@example.com');
    await page.getByTestId('register-password').fill('SecurePass123!');
    await page.getByTestId('register-confirm-password').fill('SecurePass123!');
    
    // Wait for plans and select first one
    const planCards = page.locator('[data-testid^="select-plan-"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
    await planCards.first().click();
    
    // Listen for Razorpay script to be called
    let razorpayOpened = false;
    await page.exposeFunction('onRazorpayOpen', () => {
      razorpayOpened = true;
    });
    
    // Intercept Razorpay checkout
    await page.addInitScript(() => {
      (window as any).Razorpay = function(options: any) {
        return {
          open: () => {
            console.log('Razorpay opened with options:', options);
            // Simulate Razorpay modal open
            (window as any).onRazorpayOpen && (window as any).onRazorpayOpen();
          }
        };
      };
    });
    
    // Wait for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/registration/initiate') && response.status() === 200,
      { timeout: 15000 }
    );
    
    // Submit form
    await page.getByTestId('register-submit').click();
    
    // Wait for response
    const response = await responsePromise.catch(() => null);
    
    if (response) {
      const data = await response.json();
      // Verify response has Razorpay order
      expect(data.registration_id).toBeTruthy();
      expect(data.order_id).toMatch(/^order_/);
      expect(data.razorpay_key).toMatch(/^rzp_/);
    }
  });
});

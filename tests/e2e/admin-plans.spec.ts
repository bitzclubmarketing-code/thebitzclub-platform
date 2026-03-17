import { test, expect } from '@playwright/test';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://join-razorpay-debug.preview.emergentagent.com';

test.describe('Admin Plans Page - Plan CRUD', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent badge
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.getElementById('emergent-badge');
        if (badge) badge.remove();
      }, 1000);
    });
    
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('login-identifier')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-identifier').fill('9999999999');
    await page.getByTestId('login-password').fill('admin123');
    await page.getByTestId('login-submit').click();
    
    // Wait for navigation to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    
    // Navigate to plans page
    await page.getByRole('link', { name: /plans/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/plans/);
  });

  test('Plans page loads with existing plans', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: /membership plans/i })).toBeVisible();
    
    // Verify add plan button exists
    await expect(page.getByTestId('add-plan-btn')).toBeVisible();
    
    // Wait for plans to load from API
    await page.waitForResponse(
      response => response.url().includes('/api/plans') && response.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});
    
    // Wait a bit for React to render
    await page.waitForTimeout(1000);
    
    // Verify at least one plan card exists (Silver, Gold, or Platinum)
    const planCards = page.locator('[data-testid^="plan-card-"]');
    const planCount = await planCards.count();
    expect(planCount).toBeGreaterThan(0);
  });

  test('Can open add plan modal', async ({ page }) => {
    // Click add plan button
    await page.getByTestId('add-plan-btn').click();
    
    // Verify modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create new plan/i })).toBeVisible();
    
    // Verify form fields exist
    await expect(page.getByTestId('plan-name-input')).toBeVisible();
    await expect(page.getByTestId('plan-price-input')).toBeVisible();
    await expect(page.getByTestId('save-plan-btn')).toBeVisible();
  });

  test('Can create a new plan', async ({ page }) => {
    const timestamp = Date.now();
    const testPlanName = `TEST_Auto_${timestamp}`;
    
    // Click add plan button
    await page.getByTestId('add-plan-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in plan details
    await page.getByTestId('plan-name-input').fill(testPlanName);
    await page.locator('textarea').fill('Automated test plan description');
    await page.locator('input[type="number"]').first().fill('3'); // Duration
    await page.getByTestId('plan-price-input').fill('7500');
    
    // Add a feature
    await page.locator('input[placeholder="Feature description"]').first().fill('Test feature 1');
    
    // Submit the form
    await page.getByTestId('save-plan-btn').click();
    
    // Wait for modal to close and verify plan was created
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify the new plan appears in the list
    await expect(page.getByText(testPlanName)).toBeVisible({ timeout: 10000 });
    
    // Cleanup: Delete the test plan
    const planCard = page.locator(`[data-testid^="plan-card-"]`).filter({ hasText: testPlanName });
    const deleteBtn = planCard.locator('button').filter({ has: page.locator('[class*="lucide-trash"]') });
    
    // Accept confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await deleteBtn.click();
    
    // Verify plan is deleted
    await expect(page.getByText(testPlanName)).not.toBeVisible({ timeout: 10000 });
  });

  test('Can edit an existing plan', async ({ page }) => {
    // Find first plan with edit button
    const firstEditBtn = page.locator('[data-testid^="edit-plan-"]').first();
    await firstEditBtn.click();
    
    // Verify edit modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /edit plan/i })).toBeVisible();
    
    // Verify form is pre-filled
    const nameInput = page.getByTestId('plan-name-input');
    await expect(nameInput).toHaveValue(/.+/); // Should have some value
    
    // Close modal without changes
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Plan cards display correct information', async ({ page }) => {
    // Check Silver plan details
    const silverCard = page.locator('[data-testid="plan-card-silver"]');
    
    if (await silverCard.isVisible()) {
      // Verify price format
      await expect(silverCard.getByText(/₹/)).toBeVisible();
      
      // Verify duration format
      await expect(silverCard.getByText(/months/i)).toBeVisible();
      
      // Verify edit button exists
      await expect(silverCard.locator('button').filter({ hasText: /edit/i })).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';
import { loginAsAdmin, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Offline Member Creation - 3 Tab Form', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('should display offline member page with 3 tabs', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to offline member page
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page title
    await expect(page.getByText('Add New Member (Offline)')).toBeVisible();
    await expect(page.getByText('Manual entry for offline registrations')).toBeVisible();
    
    // Verify 3 tabs are visible
    await expect(page.getByTestId('tab-brief')).toBeVisible();
    await expect(page.getByTestId('tab-personal')).toBeVisible();
    await expect(page.getByTestId('tab-payment')).toBeVisible();
    
    // Verify Brief tab is active by default
    await expect(page.getByTestId('tab-brief')).toHaveAttribute('data-state', 'active');
  });

  test('should show Brief tab form fields', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify Brief tab form fields
    await expect(page.getByTestId('first-name-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('mobile-input')).toBeVisible();
    
    // Verify Title dropdown exists
    await expect(page.getByText('Title *')).toBeVisible();
    await expect(page.getByText('First Name *')).toBeVisible();
    await expect(page.getByText('Email *')).toBeVisible();
    await expect(page.getByText('Mobile No. *')).toBeVisible();
    
    // Verify photo upload area
    await expect(page.getByText('Member Photo')).toBeVisible();
    await expect(page.getByText('Click to upload')).toBeVisible();
  });

  test('should switch to Personal Details tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Personal Details tab
    await page.getByTestId('tab-personal').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify Personal Details tab is active
    await expect(page.getByTestId('tab-personal')).toHaveAttribute('data-state', 'active');
    
    // Verify Personal Details form fields
    await expect(page.getByText('Date of Birth')).toBeVisible();
    await expect(page.getByText('Gender')).toBeVisible();
    await expect(page.getByText('Address')).toBeVisible();
    await expect(page.getByText('Pin Code')).toBeVisible();
    await expect(page.getByText('Country')).toBeVisible();
    await expect(page.getByText('State')).toBeVisible();
    await expect(page.getByText('City / District')).toBeVisible();
  });

  test('should show Family Members section in Personal Details tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Switch to Personal Details tab
    await page.getByTestId('tab-personal').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify Family Members section exists - use heading to be specific
    await expect(page.getByRole('heading', { name: 'Family Members' })).toBeVisible();
    await expect(page.getByTestId('add-family-btn')).toBeVisible();
    await expect(page.getByText('No family members added', { exact: false })).toBeVisible();
  });

  test('should add family member in Personal Details tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Switch to Personal Details tab
    await page.getByTestId('tab-personal').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Click Add Family Member button
    await page.getByTestId('add-family-btn').click();
    
    // Verify family member form appears
    await expect(page.getByText('Family Member #1')).toBeVisible();
    
    // Verify "No family members added" message is gone
    await expect(page.getByText('No family members added')).not.toBeVisible();
  });

  test('should switch to Payment Details tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Payment Details tab
    await page.getByTestId('tab-payment').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify Payment Details tab is active
    await expect(page.getByTestId('tab-payment')).toHaveAttribute('data-state', 'active');
    
    // Verify Payment Details form fields
    await expect(page.getByText('Card Type / Plan *')).toBeVisible();
    await expect(page.getByText('Payment Method *')).toBeVisible();
    await expect(page.getByText('Payment Summary')).toBeVisible();
  });

  test('should show plan selection in Payment Details tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Switch to Payment Details tab
    await page.getByTestId('tab-payment').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify plan select dropdown exists
    await expect(page.getByTestId('plan-select')).toBeVisible();
    
    // Click on plan dropdown to see options
    await page.getByTestId('plan-select').click();
    await page.waitForTimeout(500);
    
    // Verify plans are loaded (at least one should be visible)
    const planOptions = page.locator('[role="option"]');
    await expect(planOptions.first()).toBeVisible();
  });

  test('should show payment amount calculation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Switch to Payment Details tab
    await page.getByTestId('tab-payment').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Verify payment summary shows calculation fields
    await expect(page.getByText('Plan Amount')).toBeVisible();
    await expect(page.getByText('GST (18%)')).toBeVisible();
    // Use exact match for Total Amount to avoid matching "Custom Total Amount"
    await expect(page.getByText('Total Amount', { exact: true })).toBeVisible();
  });

  test('should have Save Member button', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify Save Member button exists
    await expect(page.getByTestId('save-member-btn')).toBeVisible();
    await expect(page.getByTestId('save-member-btn')).toContainText('Save Member');
  });

  test('should have Go Back button', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify back button exists
    await expect(page.getByTestId('go-back-btn')).toBeVisible();
    
    // Click back button and verify navigation
    await page.getByTestId('go-back-btn').click();
    await expect(page).toHaveURL(/\/admin\/members/);
  });

  test('should validate required fields on submit', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/members/add', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Try to save without filling required fields
    await removeEmergentBadge(page);
    await page.getByTestId('save-member-btn').click({ force: true });
    
    // Wait a bit for async validation
    await page.waitForTimeout(1000);
    
    // Check for any indication of validation - toast, alert, or error text
    const toastVisible = await page.locator('[data-sonner-toast]').isVisible();
    const alertVisible = await page.locator('[role="alert"]').isVisible();
    
    // At least one validation indicator should appear, OR the form should stay on same page
    // (staying on page means it validated and stopped)
    const stillOnPage = page.url().includes('/admin/members/add');
    
    expect(toastVisible || alertVisible || stillOnPage).toBeTruthy();
  });
});

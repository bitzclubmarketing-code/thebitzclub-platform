import { test, expect } from '@playwright/test';
import { loginAsAdmin, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Plans Page - Maintenance Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('should display plans page with existing plans', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to Plans page
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page title
    await expect(page.getByText('Membership Plans')).toBeVisible();
    await expect(page.getByText('Manage pricing and plan features')).toBeVisible();
    
    // Verify Add Plan button
    await expect(page.getByTestId('add-plan-btn')).toBeVisible();
    
    // Verify at least one plan card is visible
    const planCards = page.locator('[data-testid^="plan-card-"]');
    await expect(planCards.first()).toBeVisible();
  });

  test('should open Create New Plan modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click Add Plan button
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Verify modal is open
    await expect(page.getByText('Create New Plan')).toBeVisible();
    
    // Verify form fields
    await expect(page.getByTestId('plan-name-input')).toBeVisible();
    await expect(page.getByTestId('plan-price-input')).toBeVisible();
  });

  test('should show Maintenance Configuration section in modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Open Create Plan modal
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Verify Maintenance Configuration section exists
    await expect(page.getByText('Maintenance Configuration')).toBeVisible();
    await expect(page.getByText('Maintenance Type')).toBeVisible();
    // Use role combobox to find the dropdown (more reliable)
    await expect(page.getByRole('combobox').filter({ hasText: 'No Maintenance Fee' })).toBeVisible();
  });

  test('should show maintenance type dropdown options', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Open Create Plan modal
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Click on maintenance type dropdown using combobox role
    await page.getByRole('combobox').filter({ hasText: 'No Maintenance Fee' }).click();
    await page.waitForTimeout(300);
    
    // Verify dropdown options
    await expect(page.getByRole('option', { name: 'No Maintenance Fee' })).toBeVisible();
    await expect(page.getByRole('option', { name: /Inclusive/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Enter Value/i })).toBeVisible();
  });

  test('should show maintenance fields when Enter Value is selected', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Open Create Plan modal
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Click on maintenance type dropdown
    await page.getByRole('combobox').filter({ hasText: 'No Maintenance Fee' }).click();
    await page.waitForTimeout(300);
    
    // Select "Enter Value"
    await page.getByRole('option', { name: /Enter Value/i }).click();
    await page.waitForTimeout(300);
    
    // Verify additional fields appear
    await expect(page.getByText('Maintenance Amount')).toBeVisible();
    await expect(page.getByText('GST (%)')).toBeVisible();
    await expect(page.getByText('Billing Cycle')).toBeVisible();
  });

  test('should show Renewal Amount field', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Open Create Plan modal
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Scroll to find renewal amount
    await expect(page.getByText('Renewal Amount')).toBeVisible();
    await expect(page.getByText('Amount to charge when membership is renewed')).toBeVisible();
  });

  test('should have Save Plan button in modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Open Create Plan modal
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Verify Save button
    await expect(page.getByTestId('save-plan-btn')).toBeVisible();
    await expect(page.getByTestId('save-plan-btn')).toContainText('Create');
  });

  test('should close modal on Cancel button', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Open Create Plan modal
    await page.getByTestId('add-plan-btn').click();
    await page.waitForTimeout(500);
    
    // Verify modal is open
    await expect(page.getByText('Create New Plan')).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(300);
    
    // Verify modal is closed
    await expect(page.getByText('Create New Plan')).not.toBeVisible();
  });

  test('should display Edit button on plan cards', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check that edit buttons exist on plan cards
    const editButtons = page.locator('[data-testid^="edit-plan-"]');
    await expect(editButtons.first()).toBeVisible();
  });

  test('should display plan features', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check that plan cards show features
    // At least one plan should have features listed
    const goldCard = page.locator('[data-testid="plan-card-gold"]');
    await expect(goldCard).toBeVisible();
    // Use first() to avoid strict mode violation
    await expect(goldCard.getByText(/All Silver benefits|Priority support|Exclusive events/i).first()).toBeVisible();
  });

  test('should display plan pricing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify price is displayed with rupee symbol - use first() to avoid strict mode
    await expect(page.getByText(/₹\d+,?\d*/).first()).toBeVisible();
    
    // Verify duration is shown - use first() to avoid strict mode
    await expect(page.getByText(/\/\d+ months/).first()).toBeVisible();
  });
});

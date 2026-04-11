import { test, expect } from '@playwright/test';

test.describe('FrostApp E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test.describe('Language', () => {
    test('should have German as default language', async ({ page }) => {
      // Check that the page title and content are in German
      await expect(page.getByText('FrostApp')).toBeVisible();
      
      // Check for German text - "Gefrierschränke" should appear in the list header
      await expect(page.getByText('Gefrierschränke', { exact: false })).toBeVisible();
    });

    test('should be able to switch language to English', async ({ page }) => {
      // Open language menu
      await page.getByRole('button', { name: /language/i }).click();
      
      // Click English option
      await page.getByText('English', { exact: false }).click();
      
      // Check for English text
      await expect(page.getByText('Fridges', { exact: false })).toBeVisible();
    });

    test('should persist language preference', async ({ page }) => {
      // Switch to English
      await page.getByRole('button', { name: /language/i }).click();
      await page.getByText('English', { exact: false }).click();
      
      // Reload the page
      await page.reload();
      
      // Should still show English text
      await expect(page.getByText('Fridges', { exact: false })).toBeVisible();
    });
  });

  test.describe('Fridge Management', () => {
    test('should create a new fridge', async ({ page }) => {
      // Click "New Fridge" button (in German: "Neuer Gefrierschrank")
      await page.getByRole('button', { name: /neuer/i }).click();
      
      // Fill in the form
      await page.getByLabel(/name/i).fill('Test Gefrierschrank');
      
      // Save
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Verify the fridge appears in the list
      await expect(page.getByText('Test Gefrierschrank')).toBeVisible();
    });

    test('should edit a fridge', async ({ page }) => {
      // Create a fridge first
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill('Original Name');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Wait for the fridge to appear
      await expect(page.getByText('Original Name')).toBeVisible();
      
      // Click edit button
      await page.locator('mat-list-item').filter({ hasText: 'Original Name' }).getByRole('button', { name: /edit/i }).click();
      
      // Update name
      await page.getByLabel(/name/i).fill('Updated Name');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Verify the update
      await expect(page.getByText('Updated Name')).toBeVisible();
      await expect(page.getByText('Original Name')).not.toBeVisible();
    });

    test('should delete a fridge', async ({ page }) => {
      // Create a fridge first
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill('To Delete');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Wait for the fridge to appear
      await expect(page.getByText('To Delete')).toBeVisible();
      
      // Click delete button
      await page.locator('mat-list-item').filter({ hasText: 'To Delete' }).getByRole('button', { name: /delete/i }).click();
      
      // Confirm deletion
      await page.getByRole('button', { name: /ja/i }).click();
      
      // Verify the fridge is gone
      await expect(page.getByText('To Delete')).not.toBeVisible();
    });

    test('should show empty state when no fridges exist', async ({ page }) => {
      // Check for empty state message
      await expect(page.getByText(/noch keine gefrierschränke/i)).toBeVisible();
    });
  });

  test.describe('Frost Items', () => {
    test('should add a frost item to a shelf', async ({ page }) => {
      // Create a fridge first
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill('Test Fridge');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Wait for the fridge to appear and click on it
      await expect(page.getByText('Test Fridge')).toBeVisible();
      await page.getByText('Test Fridge').click();
      
      // Should see the fridge detail view with tabs
      await expect(page.getByText('Test Fridge').first()).toBeVisible();
      
      // Add an item
      await page.getByRole('button', { name: /hinzufügen/i }).click();
      
      // Fill item form
      await page.getByLabel(/name/i).fill('Erdbeeren');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Verify the item appears
      await expect(page.getByText('Erdbeeren')).toBeVisible();
    });

    test('should delete a frost item', async ({ page }) => {
      // Create a fridge and add an item
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill('Test Fridge');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      await page.getByText('Test Fridge').click();
      await page.getByRole('button', { name: /hinzufügen/i }).click();
      await page.getByLabel(/name/i).fill('To Delete');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Verify item exists
      await expect(page.getByText('To Delete')).toBeVisible();
      
      // Delete the item
      await page.locator('mat-list-item').filter({ hasText: 'To Delete' }).getByRole('button', { name: /delete/i }).click();
      
      // Confirm deletion
      await page.getByRole('button', { name: /ja/i }).click();
      
      // Verify item is gone
      await expect(page.getByText('To Delete')).not.toBeVisible();
    });

    test('should show deposit date for frost items', async ({ page }) => {
      // Create a fridge and add an item
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill('Test Fridge');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      await page.getByText('Test Fridge').click();
      await page.getByRole('button', { name: /hinzufügen/i }).click();
      await page.getByLabel(/name/i).fill('Test Item');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Check for deposit date label (Einfrierdatum in German)
      await expect(page.getByText(/einfrierdatum/i)).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist fridges in localStorage', async ({ page }) => {
      // Create a fridge
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill('Persistent Fridge');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Verify it exists
      await expect(page.getByText('Persistent Fridge')).toBeVisible();
      
      // Reload page
      await page.reload();
      
      // Verify it still exists
      await expect(page.getByText('Persistent Fridge')).toBeVisible();
    });
  });
});

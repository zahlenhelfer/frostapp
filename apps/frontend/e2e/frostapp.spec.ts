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
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Check for German text - "Neuer Gefrierschrank" button should be in German (icon + text)
      await expect(page.getByRole('button', { name: /neuer/i })).toBeVisible();
    });

    test('should be able to switch language to English', async ({ page }) => {
      // Open language menu
      await page.getByRole('button', { name: /sprache/i }).click();
      
      // Click English option
      await page.getByText('Englisch').click();
      
      // Check for English text - button should contain "New" text
      await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
    });

    test('should persist language preference', async ({ page }) => {
      // Switch to English
      await page.getByRole('button', { name: /sprache/i }).click();
      await page.getByText('Englisch').click();
      
      // Verify English is active
      await expect(page.getByRole('button', { name: /new fridge/i })).toBeVisible();
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still show English text
      await expect(page.getByRole('button', { name: /new fridge/i })).toBeVisible();
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
      await page.locator('mat-list-item').filter({ hasText: 'Original Name' }).getByRole('button', { name: /bearbeiten/i }).click();
      
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
      await page.locator('mat-list-item').filter({ hasText: 'To Delete' }).getByRole('button', { name: /löschen/i }).click();
      
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
      const fridgeName = `Test Fridge Add Item ${Date.now()}`;
      
      // Create a fridge first
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill(fridgeName);
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Wait for the fridge to appear and click on it
      await expect(page.getByText(fridgeName)).toBeVisible();
      await page.getByText(fridgeName).click();
      
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
      const fridgeName = `Test Fridge Delete Item ${Date.now()}`;
      
      // Create a fridge and add an item
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill(fridgeName);
      await page.getByRole('button', { name: /speichern/i }).click();
      
      await page.getByText(fridgeName).click();
      await page.getByRole('button', { name: /hinzufügen/i }).click();
      await page.getByLabel(/name/i).fill('To Delete');
      await page.getByRole('button', { name: /speichern/i }).click();
      
      // Verify item exists
      await expect(page.getByText('To Delete')).toBeVisible();
      
      // Delete the item
      await page.locator('mat-list-item').filter({ hasText: 'To Delete' }).getByRole('button', { name: /löschen/i }).click();
      
      // Confirm deletion
      await page.getByRole('button', { name: /ja/i }).click();
      
      // Verify item is gone
      await expect(page.getByText('To Delete')).not.toBeVisible();
    });

    test('should show deposit date for frost items', async ({ page }) => {
      const fridgeName = `Test Fridge Deposit ${Date.now()}`;
      
      // Create a fridge and add an item
      await page.getByRole('button', { name: /neuer/i }).click();
      await page.getByLabel(/name/i).fill(fridgeName);
      await page.getByRole('button', { name: /speichern/i }).click();
      
      await page.getByText(fridgeName).click();
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

  test.describe('Complete Workflow', () => {
    test('should create fridge with 4 shelves, manage items, and delete everything', async ({ page }) => {
      const timestamp = Date.now();
      const fridgeName = `Test Fridge ${timestamp}`;
      const items = ['Erdbeeren', 'Blaubeeren', 'Himbeeren', 'Brombeeren', 'Johannisbeeren'];
      const updatedNames = ['Erdbeeren (Bio)', 'Blaubeeren (Bio)', 'Himbeeren (Bio)', 'Brombeeren (Bio)', 'Johannisbeeren (Bio)'];

      // Step 1: Create a fridge with 4 shelves
      await test.step('Create fridge with 4 shelves', async () => {
        await page.getByRole('button', { name: /neuer/i }).click();
        await page.getByLabel(/name/i).fill(fridgeName);
        // The default shelf count is already 4, so we just verify the slider label shows "Anzahl Fächer: 4"
        await expect(page.getByText(/anzahl fächer: 4/i)).toBeVisible();
        await page.getByRole('button', { name: /speichern/i }).click();
        await expect(page.getByText(fridgeName)).toBeVisible();
      });

      // Step 2: Open the fridge
      await test.step('Open fridge', async () => {
        await page.getByText(fridgeName).click();
        await expect(page.getByText(fridgeName).first()).toBeVisible();
      });

      // Step 3: Add 5 frost items across different shelves
      await test.step('Add 5 frost items', async () => {
        // Add first 2 items to shelf 1 (Fach 1)
        for (let i = 0; i < 2; i++) {
          await page.getByRole('button', { name: /hinzufügen/i }).click();
          await page.getByLabel(/name/i).fill(items[i]);
          await page.getByRole('button', { name: /speichern/i }).click();
          await expect(page.getByText(items[i])).toBeVisible();
        }

        // Switch to shelf 2 (Fach 2) and add 2 more items
        await page.getByRole('tab').nth(1).click();
        for (let i = 2; i < 4; i++) {
          await page.getByRole('button', { name: /hinzufügen/i }).click();
          await page.getByLabel(/name/i).fill(items[i]);
          await page.getByRole('button', { name: /speichern/i }).click();
          await expect(page.getByText(items[i])).toBeVisible();
        }

        // Switch to shelf 3 (Fach 3) and add 1 more item
        await page.getByRole('tab').nth(2).click();
        await page.getByRole('button', { name: /hinzufügen/i }).click();
        await page.getByLabel(/name/i).fill(items[4]);
        await page.getByRole('button', { name: /speichern/i }).click();
        await expect(page.getByText(items[4])).toBeVisible();
      });

      // Step 4: Edit all item names
      await test.step('Edit all item names', async () => {
        // Go back to shelf 1 and edit first 2 items
        await page.getByRole('tab').first().click();
        
        for (let i = 0; i < 2; i++) {
          await page.locator('mat-list-item').filter({ hasText: items[i] }).getByRole('button', { name: /bearbeiten/i }).click();
          await page.getByLabel(/name/i).fill(updatedNames[i]);
          await page.getByRole('button', { name: /speichern/i }).click();
          await expect(page.getByText(updatedNames[i], { exact: true })).toBeVisible();
          // Old name should not be visible (use exact match to avoid matching the updated name)
          await expect(page.getByText(items[i], { exact: true })).not.toBeVisible();
        }

        // Edit items in shelf 2
        await page.getByRole('tab').nth(1).click();
        for (let i = 2; i < 4; i++) {
          await page.locator('mat-list-item').filter({ hasText: items[i] }).getByRole('button', { name: /bearbeiten/i }).click();
          await page.getByLabel(/name/i).fill(updatedNames[i]);
          await page.getByRole('button', { name: /speichern/i }).click();
          await expect(page.getByText(updatedNames[i], { exact: true })).toBeVisible();
        }

        // Edit item in shelf 3
        await page.getByRole('tab').nth(2).click();
        await page.locator('mat-list-item').filter({ hasText: items[4] }).getByRole('button', { name: /bearbeiten/i }).click();
        await page.getByLabel(/name/i).fill(updatedNames[4]);
        await page.getByRole('button', { name: /speichern/i }).click();
        await expect(page.getByText(updatedNames[4], { exact: true })).toBeVisible();
      });

      // Step 5: Delete all items
      await test.step('Delete all items', async () => {
        // Delete item from shelf 3
        await page.locator('mat-list-item').filter({ hasText: updatedNames[4] }).getByRole('button', { name: /löschen/i }).click();
        await page.getByRole('button', { name: /ja/i }).click();
        await expect(page.getByText(updatedNames[4], { exact: true })).not.toBeVisible();

        // Delete items from shelf 2
        await page.getByRole('tab').nth(1).click();
        for (let i = 2; i < 4; i++) {
          await page.locator('mat-list-item').filter({ hasText: updatedNames[i] }).getByRole('button', { name: /löschen/i }).click();
          await page.getByRole('button', { name: /ja/i }).click();
          await expect(page.getByText(updatedNames[i], { exact: true })).not.toBeVisible();
        }

        // Delete items from shelf 1
        await page.getByRole('tab').first().click();
        for (let i = 0; i < 2; i++) {
          await page.locator('mat-list-item').filter({ hasText: updatedNames[i] }).getByRole('button', { name: /löschen/i }).click();
          await page.getByRole('button', { name: /ja/i }).click();
          await expect(page.getByText(updatedNames[i], { exact: true })).not.toBeVisible();
        }
      });

      // Step 6: Go back and delete the fridge
      await test.step('Delete the fridge', async () => {
        // Click back button - uses arrow icon, so we find it by the icon button
        await page.locator('app-fridge-detail').getByRole('button').first().click();
        await expect(page.getByText(fridgeName)).toBeVisible();
        
        await page.locator('mat-list-item').filter({ hasText: fridgeName }).getByRole('button', { name: /löschen/i }).click();
        await page.getByRole('button', { name: /ja/i }).click();
        await expect(page.getByText(fridgeName)).not.toBeVisible();
      });
    });
  });
});

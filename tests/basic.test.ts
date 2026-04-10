import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/React App/);
});

test('renders default tasks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Doctor Appointment')).toBeVisible();
  await expect(page.getByText('Meeting at School')).toBeVisible();
});

test('adds a new task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox').fill('Buy groceries');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Buy groceries')).toBeVisible();
});

test('deletes a task', async ({ page }) => {
  await page.goto('/');
  const item = page.getByText('Doctor Appointment');
  await item.locator('..').getByRole('button', { name: '✕' }).click();
  await expect(page.getByText('Doctor Appointment')).not.toBeVisible();
});

test('toggles a task as completed', async ({ page }) => {
  await page.goto('/');
  const checkbox = page.getByText('Meeting at School').locator('..').getByRole('checkbox');
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
});

// Intentionally failing tests to verify New Relic receives data on failure
test('FAILING — expects wrong title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Wrong Title/);
});

test('FAILING — expects non-existent element', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('This text does not exist')).toBeVisible({ timeout: 3000 });
});

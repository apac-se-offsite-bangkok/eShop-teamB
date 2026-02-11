import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';
import { assert } from 'console';

assert(process.env.E2E_USERNAME, 'E2E_USERNAME is not set');
assert(process.env.E2E_PASSWORD, 'E2E_PASSWORD is not set');

setup('Login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();

  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  await page.getByPlaceholder('Username').fill(process.env.E2E_USERNAME!);
  await page.getByPlaceholder('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
})

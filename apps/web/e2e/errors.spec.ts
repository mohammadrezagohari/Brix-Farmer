import {test,expect} from '@playwright/test';
import {errorDictionaries} from '../src/lib/errors';
import type {Locale} from '../src/lib/i18n';

test('errors and browser validation follow all ten selected languages',async({page})=>{
 await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  await route.fulfill({status:path.endsWith('/csrf')?200:path.endsWith('/me')?401:422,contentType:'application/json',body:JSON.stringify(path.endsWith('/csrf')?{token:'test-token'}:{message:'Verified supplier required.'})});
 });
 await page.goto('/auth');
 await page.locator('input[name=email]').fill('localization@example.test');
 await page.locator('input[name=password]').fill('test-password-123');
 await page.locator('form button').first().click();
 for(const locale of Object.keys(errorDictionaries) as Locale[]) {
  await page.locator('header select').first().selectOption(locale);
  await expect(page.locator('.notice.error[role=alert]')).toHaveText(errorDictionaries[locale].supplier);
  await page.locator('input[name=email]').fill('');
  await page.locator('form button').first().click();
  expect(await page.locator('input[name=email]').evaluate((field:HTMLInputElement)=>field.validationMessage)).toBe(errorDictionaries[locale].validation);
  await page.locator('input[name=email]').fill('localization@example.test');
 }
});

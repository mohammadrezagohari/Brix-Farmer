import {test,expect} from '@playwright/test';
import {landingDictionaries} from '../src/lib/landing-copy';
import {languages,type Locale} from '../src/lib/i18n';

test('all landing locales: native content, direction, FAQ schema, mobile navigation and persistence',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 for(const locale of Object.keys(languages) as Locale[]) {
  const c=landingDictionaries[locale];
  await page.locator('.lp-language select').selectOption(locale);
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  await expect(page.locator('html')).toHaveAttribute('dir',languages[locale].dir);
  await expect(page.locator('h1')).toHaveText(c.title+c.accent);
  await expect(page.locator('.lp-lead')).toHaveText(c.description);
  await expect(page.locator('.lp-hero-actions a').first()).toHaveText(c.primary);
  await expect(page.locator('.lp-logo small').first()).toHaveText(c.brandTagline);
  await expect(page.locator('.lp-field-photo')).toHaveAttribute('alt',c.photo);
  const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()||'{}');
  expect(schema.mainEntity[2].name).toBe(c.questions[2]);
  expect(schema.mainEntity[2].acceptedAnswer.text).toBe(c.answers[2]);
  await page.getByRole('tab',{name:c.trader,exact:true}).click();
  await expect(page.getByRole('tabpanel')).toContainText(c.traderBody);
  for(const width of [375,1024,1440]) {
   await page.setViewportSize({width,height:950});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),locale).toBe(true);
   for(const selector of ['.lp-header-actions','.lp-hero-actions','.lp-role-tabs','.lp-final .lp-button']) {
    const bounds=await page.locator(selector).boundingBox();
    expect(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+1,`${locale} ${width} ${selector}`).toBe(true);
   }
  }
  await page.setViewportSize({width:375,height:950});
  await page.getByRole('button',{name:c.menu,exact:true}).click();
  await expect(page.locator('#landing-mobile-nav')).toContainText(c.how);
  await page.keyboard.press('Escape');
  await page.screenshot({path:`test-results/landing-${locale}-mobile.png`,fullPage:true});
 }
 await page.reload();
 await expect(page.locator('h1')).toHaveText(landingDictionaries.zu.title+landingDictionaries.zu.accent);
 expect(errors).toEqual([]);
});

test('landing: responsive layout, image, FAQ, role tabs, language and theme',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('h1')).toContainText('حاصل زمین شما');
 await expect(page.locator('.lp-field-photo')).toBeVisible();
 await expect.poll(()=>page.locator('.lp-field-photo').evaluate((image:HTMLImageElement)=>image.naturalWidth)).toBeGreaterThan(0);
 for(const width of [375,768,1024,1440]) {
  await page.setViewportSize({width,height:950});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/landing-fa-${width}.png`,fullPage:true});
 }
 await page.getByRole('tab',{name:'تاجر و خریدار'}).click();
 await expect(page.getByRole('tabpanel')).toContainText('محصول مناسب را پیدا کنید');
 await expect(page.getByRole('tabpanel').getByRole('link')).toHaveAttribute('href','/auth?mode=register&role=trader');
 await page.getByRole('tab',{name:'تاجر و خریدار'}).press('Home');
 await expect(page.getByRole('tab',{name:'کشاورز و تأمین‌کننده'})).toBeFocused();
 await expect(page.getByRole('tab',{name:'کشاورز و تأمین‌کننده'})).toHaveAttribute('aria-selected','true');
 await page.locator('.lp-faq-list summary').nth(2).click();
 await expect(page.locator('.lp-faq-list details').nth(2)).toHaveAttribute('open','');
 await expect(page.locator('.lp-faq-list details').nth(2)).toContainText('۳۰ دقیقه');
 await page.getByRole('combobox',{name:'زبان',exact:true}).selectOption('en');
 await expect(page.locator('html')).toHaveAttribute('dir','ltr');
 await expect(page.locator('h1')).toContainText('What you grow');
 await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('h1')).toContainText('What you grow');
 await page.screenshot({path:'test-results/landing-en-dark.png',fullPage:true});
 await page.setViewportSize({width:375,height:900});
 await page.getByRole('button',{name:'Open menu'}).click();
 await expect(page.locator('#landing-mobile-nav')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#landing-mobile-nav')).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('landing CTA opens registration with trader intent; metadata is crawlable',async({page,request})=>{
 await page.route('**/api/v1/me',route=>route.fulfill({status:401,contentType:'application/json',body:'{}'}));
 await page.goto('/');
 await page.locator('.lp-hero-actions a').nth(1).click();
 await expect(page).toHaveURL(/\/auth\?mode=register&role=trader$/);
 await expect(page.locator('input[name=name]')).toBeVisible();
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);
 const response=await request.get('/');const html=await response.text();
 expect(html).toContain('حاصل زمین شما');expect(html).toContain('application/ld+json');
 expect(html).toContain('og:title');expect(html).toContain('name="description"');
 const robots=await request.get('/robots.txt');expect(await robots.text()).toContain('Disallow: /admin');
 const social=await request.get('/opengraph-image');expect(social.ok()).toBe(true);expect(social.headers()['content-type']).toContain('image/png');
});

import {test,expect} from '@playwright/test';

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

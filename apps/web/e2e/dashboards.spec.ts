import {test,expect,Page,Cookie} from '@playwright/test';
const sessions=new Map<string,Cookie[]>();
const password=process.env.E2E_PASSWORD;
test.skip(!password,'E2E_PASSWORD required; provision synthetic QA accounts with DashboardQaSeeder.');
async function login(page:Page,role:string){
 if(sessions.has(role)){await page.context().addCookies(sessions.get(role)!);await page.goto('/'+role);return;}
 await page.goto('/auth');await page.getByLabel('ایمیل',{exact:true}).fill(`${role}-dashboard-qa@example.test`);await page.getByLabel('رمز عبور',{exact:true}).fill(password!);await page.getByRole('button',{name:'ورود',exact:true}).click();await expect(page).toHaveURL(new RegExp('/'+role+'$'));sessions.set(role,await page.context().cookies());
}
for(const role of ['admin','farmer','trader'])test(`${role}: responsive shell, theme, language and navigation`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page,role);await expect(page.locator('.kpi-grid')).toBeVisible();
 for(const width of [375,768,1024,1440]){
  await page.setViewportSize({width,height:900});await expect(page.locator('.welcome-banner')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  if(width===375){await page.getByRole('button',{name:'بازکردن منو'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);}
  await page.screenshot({path:`test-results/${role}-${width}.png`,fullPage:true});
 }
 await page.getByRole('combobox',{name:'ظاهر',exact:true}).selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('combobox',{name:'زبان',exact:true}).selectOption('en');await expect(page.locator('html')).toHaveAttribute('dir','ltr');await expect(page.locator('html')).toHaveAttribute('lang','en');expect(errors).toEqual([]);
});
test('farmer draft wizard persists to API and renders on mobile',async({page})=>{
 await login(page,'farmer');await page.goto('/farmer/products/new');await page.setViewportSize({width:375,height:900});
 await page.getByLabel('محصول',{exact:true}).fill('Synthetic E2E pistachios '+Date.now());await page.getByRole('button',{name:'ذخیره · پیش‌نویس'}).click();await expect(page.getByRole('status').filter({hasText:'تغییرات با موفقیت ذخیره شد.'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);await page.goto('/farmer/products');await expect(page.locator('table')).toContainText('Synthetic E2E pistachios');
});
test('trader marketplace and private CRM forms are functional',async({page})=>{
 await login(page,'trader');await page.goto('/trader/marketplace');await expect(page.locator('main h1')).toHaveText('بازار محصولات');
 await page.goto('/trader/customers');await page.getByRole('button',{name:'نام شرکت',exact:true}).click();await page.getByLabel('نام شرکت',{exact:true}).fill('Synthetic E2E Import '+Date.now());await page.getByLabel('کد کشور',{exact:true}).fill('IN');await page.getByRole('button',{name:'تأیید عملیات',exact:true}).click();await expect(page.locator('table')).toContainText('Synthetic E2E Import');
 await page.goto('/admin');await expect(page.getByRole('heading',{name:'به این فضای کاری دسترسی ندارید.'})).toBeVisible();
});
test('farmer submission, admin KYB/moderation and trader partial reservation',async({browser})=>{
 test.setTimeout(90000);
 const farmerContext=await browser.newContext(),adminContext=await browser.newContext(),traderContext=await browser.newContext();
 const farmer=await farmerContext.newPage(),admin=await adminContext.newPage(),trader=await traderContext.newPage();
 const product='Synthetic approved E2E '+Date.now();
 try{
  await login(farmer,'farmer');await farmer.goto('/farmer/profile');
  await farmer.getByLabel('نام حقوقی',{exact:true}).fill('Synthetic QA legal farm');await farmer.getByLabel('شماره ثبت',{exact:true}).fill('SYN-E2E');await farmer.getByLabel('کد کشور',{exact:true}).fill('IR');await farmer.getByRole('textbox',{name:'نشانی قانونی',exact:true}).fill('Synthetic Kerman address');await farmer.getByRole('button',{name:'ذخیره',exact:true}).click();await expect(farmer.locator('.toast')).toBeVisible();
  await farmer.goto('/farmer/products/new');await farmer.getByLabel('محصول',{exact:true}).fill(product);await farmer.getByRole('button',{name:'ادامه',exact:false}).click();
  await farmer.getByLabel('مقدار موجود',{exact:false}).fill('50');await farmer.getByRole('combobox',{name:'واحد وزن',exact:false}).selectOption('tonne');await farmer.getByLabel('حداقل سفارش',{exact:false}).fill('1');await farmer.getByLabel('گرید کیفیت',{exact:false}).fill('A');await farmer.getByRole('button',{name:'ادامه',exact:false}).click();await farmer.getByRole('button',{name:'ادامه',exact:false}).click();await farmer.getByRole('button',{name:'ادامه',exact:false}).click();
  await farmer.getByRole('button',{name:'ارسال برای بررسی',exact:false}).click();await expect(farmer).toHaveURL(/\/farmer\/products$/);await expect(farmer.locator('table')).toContainText(product);
  await login(admin,'admin');await admin.goto('/admin/organizations');await admin.locator('.filter-bar input').fill('Synthetic QA farmer');await admin.locator('.filter-bar button').click();await admin.getByRole('button',{name:'بررسی',exact:true}).click();await admin.getByLabel('شواهد و منابع بررسی',{exact:true}).fill('Synthetic test-only identity evidence');await admin.getByLabel('دلیل تصمیم',{exact:true}).fill('Synthetic E2E KYB decision');await admin.getByRole('button',{name:'تأیید عملیات',exact:true}).click();await expect(admin.getByRole('dialog')).toHaveCount(0);
  await admin.goto('/admin/listings');await admin.locator('.filter-bar input').fill(product);await admin.locator('.filter-bar button').click();await admin.getByRole('button',{name:'بررسی',exact:true}).click();await admin.getByLabel('دلیل تصمیم',{exact:true}).fill('Synthetic test-only product review');await admin.getByRole('button',{name:'تأیید عملیات',exact:true}).click();await expect(admin.getByRole('dialog')).toHaveCount(0);
  await login(trader,'trader');await trader.goto('/trader/marketplace');await trader.locator('.filter-bar input[aria-label="جست‌وجو"]').fill(product);await trader.locator('.filter-bar button').click();await trader.getByRole('link',{name:'مشاهده جزئیات',exact:false}).click();await trader.getByLabel('مقدار موجود (کیلوگرم)',{exact:true}).fill('10000');await trader.getByRole('button',{name:'رزرو مقدار',exact:false}).click();await expect(trader.locator('.toast')).toBeVisible();
  await expect(trader.locator('.stock-highlight')).toContainText('۴۰');
  for(const width of [375,1440]){await trader.setViewportSize({width,height:900});expect(await trader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await trader.screenshot({path:`test-results/product-detail-${width}.png`,fullPage:true});}
  await farmer.goto('/farmer/incoming');await expect(farmer.locator('table')).toContainText(product);
 }finally{await Promise.allSettled([farmerContext.close(),adminContext.close(),traderContext.close()]);}
});

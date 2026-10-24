const {chromium}=require('../../apps/web/node_modules/@playwright/test');
const path=require('node:path');
const out=path.join(__dirname,'assets');
const products=[{id:1,title:'پسته اکبری',supplier:'تأمین‌کننده نمونه کرمان',status:'published',organization_id:2,inventory_lot_id:1,origin_country:'IR',available_kg:'40000.000',minimum_order_kg:'1000.000',details:{grade:'A',country:'IR',packaging:'کیسه ۲۵ کیلوگرمی',description:'نمونه نمایشی برای معرفی قابلیت‌های محصول',currency:'USD',quantity:'50000.000',minimum:'1000.000',unit:'kg'}},{id:2,title:'خرمای مضافتی',supplier:'تأمین‌کننده نمونه بم',status:'published',organization_id:2,inventory_lot_id:2,origin_country:'IR',available_kg:'12000.000',minimum_order_kg:'500.000',details:{grade:'ممتاز'}},{id:3,title:'کشمش سبز',supplier:'تأمین‌کننده نمونه خراسان',status:'review',organization_id:2,origin_country:'IR',available_kg:'8000.000',minimum_order_kg:'500.000',details:{grade:'A'}}];
const inventory=products.map((p,i)=>({id:i+1,product:p.title,on_hand_kg:i?'12000.000':'50000.000',available_kg:p.available_kg,reserved_kg:i?'0.000':'10000.000',allocated_kg:'0.000'}));
const customers=[{id:1,company:'مشتری نمونه امارات',country:'AE',contact_name:'مسئول خرید نمونه',email:'buyer@example.test'},{id:2,company:'مشتری نمونه هند',country:'IN',contact_name:'نماینده نمونه',email:'trade@example.test'}];
const organizations=[{id:1,name:'سازمان نمونه کشاورزی',role:'owner',suspended:false,verification_status:'verified'},{id:3,name:'شرکت نمونه بازرگانی',role:'trader',suspended:false,verification_status:'verified'}];
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await context.addInitScript(()=>{localStorage.setItem('agritrade.locale','fa');localStorage.setItem('agritrade.theme','light');localStorage.setItem('agritrade.organization','1');});
 await context.route('**/api/v1/**',async route=>{
  const key=new URL(route.request().url()).pathname.replace('/api/v1/','');let data=[];
  if(key==='me')data={id:1,name:'کاربر نمونه',email:'demo@example.test',is_platform_admin:true};
  else if(key==='organizations')data=organizations;
  else if(key==='categories'||key==='admin/categories')data=[{id:1,name:'خشکبار'},{id:2,name:'میوه و سبزی'}];
  else if(key==='workspace/dashboard'||key==='admin/dashboard')data={inventory_lots:3,available_kg:'60000.000',published:2,incoming:1,active_reservations:1,customers:2,users:8,farmers:3,traders:3,verified_organizations:4,pending_organizations:2,distribution:[{status:'published',count:2},{status:'review',count:1}],recent:[{id:1,action:'listing.published',subject:'پسته اکبری',created_at:'2026-10-24T08:00:00Z'},{id:2,action:'reservation.created',subject:'رزرو موقت نمونه',created_at:'2026-10-24T09:00:00Z'}]};
  else if(key==='workspace/inventory')data=inventory;
  else if(key==='marketplace/1')data={...products[0],lot:{available_kg:'40000.000',minimum_order_kg:'1000.000'}};
  else if(key==='marketplace'||key==='listings'||key==='admin/listings')data=products;
  else if(key==='trade-partners')data=customers;
  else if(key==='opportunities')data=[{id:1,title:'تأمین پسته اکبری',company:customers[0].company,stage:'new',next_action:'تکمیل نیاز خرید'},{id:2,title:'معرفی محصول خرما',company:customers[1].company,stage:'contacted',next_action:'هماهنگی گفت‌وگو'},{id:3,title:'بررسی نیاز خریدار',company:customers[0].company,stage:'qualified',next_action:'مرور مشخصات محصول'}];
  else if(key==='admin/organizations')data=[{id:1,name:'تأمین‌کننده نمونه کرمان',verification_status:'verified',suspended:false,profile:{legal_name:'سازمان نمونه کشاورزی',registration_number:'DEMO-001',address:'نشانی نمونه، کرمان',country:'IR'}},{id:2,name:'تأمین‌کننده نمونه بم',verification_status:'pending',suspended:false,profile:{legal_name:'مجموعه نمونه بم',registration_number:'DEMO-002',address:'نشانی نمونه، بم',country:'IR'}}];
  else if(key==='csrf')return route.fulfill({json:{token:'mock'}});
  await route.fulfill({json:{data,last_page:1}});
 });
 const page=await context.newPage();
 async function snap(name,url){await page.goto('http://localhost:8080'+url);await page.waitForTimeout(450);await page.locator('.skeleton-grid').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:path.join(out,name+'.png')});await page.locator('.workspace-main').screenshot({path:path.join(out,name+'-focus.png')});console.log(name);}
 await snap('farmer','/farmer');await snap('inventory','/farmer/inventory');await page.locator('.data-card').screenshot({path:path.join(out,'inventory-table.png')});await snap('market','/trader/marketplace');await snap('reservation','/trader/marketplace/1');await snap('crm','/trader/opportunities');await snap('admin','/admin/organizations');
 await page.getByRole('button',{name:'بررسی',exact:true}).first().click();await page.screenshot({path:path.join(out,'kyb.png')});
 await snap('wizard','/farmer/products/new');await page.getByLabel('محصول',{exact:true}).fill('پسته اکبری');await page.getByRole('button',{name:'ادامه',exact:false}).click();await page.getByLabel('مقدار موجود',{exact:false}).fill('50000.000');await page.getByLabel('حداقل سفارش',{exact:false}).fill('1000.000');await page.getByLabel('گرید کیفیت',{exact:false}).fill('A');await page.locator('.wizard').screenshot({path:path.join(out,'wizard-detail.png')});
 await snap('dark','/farmer');await page.getByRole('combobox',{name:'ظاهر',exact:true}).selectOption('dark');await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'dark.png')});
 await page.goto('http://localhost:8080/');await page.waitForTimeout(400);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.getByRole('combobox',{name:'ظاهر',exact:true}).selectOption('light');await page.screenshot({path:path.join(out,'landing.png')});
 await page.setViewportSize({width:390,height:844});await page.locator('.lp-language select').selectOption('ar');await page.locator('.lp-hero').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'mobile-ar.png')});
 await page.locator('.lp-language select').selectOption('fa');await page.screenshot({path:path.join(out,'mobile-fa.png')});
 await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});

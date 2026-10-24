import fs from 'node:fs/promises';
import path from 'node:path';
import {Presentation,PresentationFile} from 'file:///C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const root='C:/Users/USER/Desktop/Brix-Farmer';
const build=path.join(root,'.build/product-deck-20261024');
const assets=path.join(build,'assets');
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={green:'#123D2C',deep:'#0D261E',cream:'#F5F3E9',ink:'#193B2D',muted:'#6B786B',sage:'#B6CA86',gold:'#DCC39A',white:'#FFFFFF'};
const evidence='منبع قابلیت‌ها: docs/IMPLEMENTATION_STATUS.md، docs/DECISIONS.md و کد رابط کاربری در apps/web/src/components/. وضعیت محصول: ۲۴ اکتبر ۲۰۲۶. تصاویر رابط از برنامهٔ محلی با پاسخ‌های API نمایشی گرفته شده‌اند. تمام نام‌ها، مقادیر موجودی و تعدادها در تصاویر نمونه‌اند و شاخص فعالیت تجاری واقعی نیستند.';
function text(s,value,x,y,w,h,size=26,color=C.ink,bold=false,align='right',name='text'){
 const a=s.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 a.text=value;a.text.style={fontSize:size,typeface:'Tahoma',color,bold,alignment:align,verticalAlignment:'top',autoFit:'none',wrap:'square',insets:0};return a;
}
async function image(s,name,x,y,w,h,fit='contain',alt='تصویر رابط محصول با دادهٔ نمایشی'){
 const file=name==='fields'?path.join(root,'apps/web/public/images/fields.png'):path.join(assets,name+'.png');
 const bytes=await fs.readFile(file);
 s.images.add({blob:bytes,contentType:'image/png',alt,fit,position:{left:x,top:y,width:w,height:h}});
}
function slide(bg=C.cream,note='',sample=false){
 const s=p.slides.add();s.background.fill=bg;const dark=bg!==C.cream;
 text(s,'AgriTrade',55,677,130,23,15,dark?C.sage:C.muted,false,'left','brand-footer');
 text(s,String(p.slides.items.length).padStart(2,'0'),1190,677,35,23,15,dark?C.sage:C.muted,false,'right','page-footer');
 if(sample)text(s,'تصویر محصول با دادهٔ نمایشی',730,679,420,22,15,dark?'#C3CFBA':C.muted,false,'right','sample-disclosure');
 s.speakerNotes.text=note+'\n\n'+evidence;return s;
}
function heading(s,value,dark=false){text(s,value,55,48,1170,83,44,dark?C.cream:C.ink,true,'right','slide-title');}
function item(s,title,body,x,y,w,dark=false){text(s,title,x,y,w,48,30,dark?C.sage:C.ink,true);text(s,body,x,y+60,w,125,25,dark?'#D6E0CB':C.muted);}

// 01: editable cover typography, with a locally stored illustrative background.
{
 const s=slide(C.green,'شروع ارائه با معرفی محصول و دو کاربر اصلی. AgriTrade فضای کاری معرفی محصول کشاورزی، مدیریت موجودی و کشف تأمین‌کننده است. تصویر مزرعه اثر تولیدشده برای هویت بصری سایت است و مزرعهٔ یک تأمین‌کنندهٔ واقعی را معرفی نمی‌کند. منبع تصویر: apps/web/public/images/fields.png.');
 await image(s,'fields',0,0,620,720,'cover','چشم‌انداز کشاورزی، تصویرسازی تولیدشده برای هویت محصول');
 text(s,'معرفی محصول',695,83,520,45,24,C.sage);
 text(s,'AgriTrade',650,180,565,110,91,C.cream,true,'right','cover-title');
 text(s,'از مزرعه\nتا فرصت تجاری',680,324,535,185,56,C.cream,true);
 text(s,'فضای کاری کشاورزان و تجار',680,560,535,70,27,C.gold);
}
// 02: an editorial visual, not an unsubstantiated market-size claim.
{
 const s=slide(C.deep,'محصول با گردآوردن اطلاعات عرضه، موجودی و ارتباط با مشتری، یک نقطهٔ مشترک برای کشاورز و تاجر فراهم می‌کند. تصویر پسته صرفاً یک تصویرسازی مفهومی است، نه محصولِ فروشنده‌ای مشخص. تصویر: .build/product-deck-20261024/assets/pistachio.png، ساخته‌شده با image_gen.');
 await image(s,'pistachio',0,0,1280,720,'cover','تصویرسازی مفهومی پسته و برگ بر زمینهٔ سبز تیره');
 text(s,'عرضه و تأمین\nدر یک فضای مشترک',730,160,490,210,47,C.cream,true,'right','slide-title');
 text(s,'مشخصات محصول، موجودی\nو ارتباط با مشتری در کنار هم',750,431,465,130,26,'#E0E5D4');
}
// 03: flat typographic composition for the two supported customer roles.
{
 const s=slide(C.cream,'دو نقش اصلی محصول را معرفی کنید. تأمین‌کننده محصولات و موجودی خود را مدیریت می‌کند. تاجر عرضه‌های منتشرشده را می‌بیند، رزرو موقت انجام می‌دهد و مشتریان خود را مدیریت می‌کند. هیچ فعالیت فروش واقعی یا نتیجهٔ اقتصادی از دادهٔ نمایشی استنباط نمی‌شود.');
 heading(s,'دو نقش، یک محصول');
 text(s,'کشاورز',710,178,505,100,66,C.ink,true);
 text(s,'معرفی محصول و شرایط عرضه\nمدیریت موجودی و برداشت‌ها\nپیگیری درخواست‌های رزرو',710,330,505,210,29,C.muted);
 text(s,'تاجر',70,178,515,100,66,'#719151',true);
 text(s,'جست‌وجوی عرضه‌های منتشرشده\nرزرو موقت مقدار موردنیاز\nمدیریت مشتری و فرصت تجاری',70,330,515,210,29,C.muted);
 text(s,'فضای کاری هر سازمان، متناسب با نقش و عضویت کاربر',200,597,1015,48,25,C.ink);
}
// 04: four short process descriptions; no fabricated transaction stages.
{
 const s=slide(C.green,'این مسیر، گردش موجودِ معرفی و رزرو محصول را توضیح می‌دهد. تأیید سازمان و انتشار آگهی را دو تصمیم مستقل معرفی کنید. مرحلهٔ پایانی رزرو موقت است، نه سفارش، قرارداد یا خرید.');
 heading(s,'مسیر محصول از معرفی تا رزرو',true);
 const xs=[945,650,355,60];
 const titles=['پروفایل حقوقی','ثبت محصول','بررسی و انتشار','رزرو موقت'];
 const bodies=['اطلاعات سازمان\nبرای بررسی مدیر','مشخصات محصول\nو شرایط عرضه','تأیید تأمین‌کننده\nو بررسی آگهی','انتخاب مقدار\nاز موجودی آزاد'];
 xs.forEach((x,i)=>{text(s,String(i+1).padStart(2,'0'),x,213,270,90,72,C.sage,false);text(s,titles[i],x,344,270,65,29,C.cream,true);text(s,bodies[i],x,435,270,125,26,'#D0DDC5');});
 text(s,'رزرو در نسخهٔ فعلی، نگهداشت موقت موجودی است',170,605,1045,43,25,C.gold);
}
// 05: actual farmer workspace screenshot, with explicit mock-data disclosure.
{
 const s=slide(C.cream,'در داشبورد کشاورز، موجودی، وضعیت محصولات و درخواست‌های ورودی در دسترس‌اند. آمار در تصویر صرفاً دادهٔ نمایشی است. منبع تصویر: assets/farmer.png.',true);
 heading(s,'پنل کشاورز، نمای روشن عملیات');
 await image(s,'farmer',55,160,850,505);
 item(s,'نمای موجودی','نمای کلی عرضه‌ها\nو موجودی آزاد',940,197,285);
 item(s,'پیگیری فعالیت','وضعیت آگهی‌ها\nو درخواست‌های ورودی',940,435,285);
}
// 06: close-up of the real step-by-step product wizard.
{
 const s=slide(C.deep,'فرم ثبت محصول پنج مرحله دارد: اطلاعات محصول، مقدار و کیفیت، محل و بسته‌بندی، شرایط عرضه و بررسی و ارسال. ذخیرهٔ پیش‌نویس پشتیبانی می‌شود. مقدار و مبدأ موجودیِ ارسال‌شده قابل تغییر نیستند. منبع تصویر: assets/wizard-detail.png.',true);
 heading(s,'ثبت محصول، مرحله‌به‌مرحله',true);
 await image(s,'wizard-detail',55,148,720,523);
 text(s,'جزئیات عرضه\nپیش از انتشار',845,190,380,120,36,C.sage,true);
 text(s,'کیفیت و مبدأ محصول\nمقدار و حداقل سفارش\nبسته‌بندی و شرایط عرضه\nذخیرهٔ پیش‌نویس',845,357,380,220,27,C.cream);
}
// 07: no financial charts, only implemented inventory concepts.
{
 const s=slide(C.cream,'تفکیک موجودی از قابلیت‌های موجود است. این اسلاید هیچ مالکیت خریداری‌شده یا انتقال مالکیت را از رزرو استنباط نمی‌کند. تصویر رابط دارای دادهٔ نمونه است. منبع تصویر: assets/inventory-table.png.',true);
 heading(s,'موجودی با تفکیک قابل پیگیری');
 text(s,'آزاد',855,170,350,60,39,C.ink,true);
 text(s,'رزروشده',460,170,350,60,39,'#819C59',true);
 text(s,'تخصیص‌یافته',65,170,350,60,39,C.muted,true);
 await image(s,'inventory-table',55,280,1170,310);
 text(s,'نمایش وضعیت موجودی و دسترسی به سوابق گردش',220,619,995,42,24,C.muted);
}
// 08: marketplace discovery.
{
 const s=slide(C.cream,'بازار، آگهی‌های منتشرشدهٔ تأمین‌کنندگان واجد شرایط را نشان می‌دهد. جست‌وجو، فیلتر کشور و جزئیات محصول در رابط موجودند. تأیید سازمان به معنی تضمین کیفیت یا مجوز صادرات نیست. منبع تصویر: assets/market-focus.png.',true);
 heading(s,'کشف عرضه‌های بررسی‌شده');
 await image(s,'market-focus',55,155,865,500);
 item(s,'جست‌وجو و فیلتر','انتخاب محصول\nبراساس نیاز خریدار',955,185,270);
 item(s,'جزئیات عرضه','موجودی آزاد\nو حداقل سفارش',955,420,270);
}
// 09: the actual supported reservation duration.
{
 const s=slide(C.green,'رزرو در محصول فعلی ۳۰ دقیقه اعتبار دارد و می‌تواند بخشی از موجودی را در بر بگیرد. رزرو خرید، پرداخت، قرارداد یا انتقال مالکیت نیست. این محدودیت روی اسلاید هم دیده می‌شود. منبع تصویر: assets/reservation-focus.png.',true);
 heading(s,'رزرو موقت برای بررسی بیشتر',true);
 await image(s,'reservation-focus',55,170,780,440);
 text(s,'۳۰',880,160,335,168,130,C.sage,true);
 text(s,'دقیقه',880,355,335,65,43,C.cream,true);
 text(s,'انتخاب مقدار مشخص\nاز موجودی آزاد',870,441,345,100,28,C.cream);
 text(s,'رزرو به معنی خرید، پرداخت یا انتقال مالکیت نیست',190,622,1025,40,24,C.gold);
}
// 10: CRM stages are explicitly not orders or contracts.
{
 const s=slide(C.cream,'مدیریت مشتری و فرصت تجاری در محصول پیاده‌سازی شده است. تغییر مرحلهٔ فرصت فقط وضعیت CRM را تغییر می‌دهد و قرارداد یا سفارش ایجاد نمی‌کند. منبع تصویر: assets/crm-focus.png.',true);
 heading(s,'مشتری و فرصت، در یک مسیر');
 text(s,'ثبت مشتریان سازمان و پیگیری اقدام بعدی هر فرصت تجاری',55,140,1170,50,26,C.muted);
 await image(s,'crm-focus',55,220,1170,380);
 text(s,'مرحله‌های فرصت تجاری، وضعیت قرارداد یا خرید نیستند',160,620,1065,40,24,C.ink);
}
// 11: admin review with honest evidence limitations.
{
 const s=slide(C.cream,'بررسی حقوقی سازمان و بررسی آگهی دو گام مستقل هستند. تصمیم احراز سازمان دلیل و شواهد متنی دارد. سامانهٔ اسناد خصوصی امن و تأیید مقرراتی کامل هنوز جزو نسخهٔ موجود نیستند. منبع تصویر: assets/kyb.png.',true);
 heading(s,'اعتماد با بررسی سازمان و آگهی');
 await image(s,'kyb',55,165,840,470);
 item(s,'احراز سازمان','ثبت دلیل\nو شواهد بررسی',925,195,300);
 item(s,'انتشار محصول','بررسی آگهی\nتوسط مدیر',925,423,300);
 text(s,'شواهد فعلی به‌صورت ارجاع متنی ثبت می‌شوند',160,635,1065,35,21,C.muted);
}
// 12: ten supported locales are a product fact, not country-coverage claims.
{
 const s=slide(C.deep,'ده زبان فعال رابط عبارت‌اند از فارسی، انگلیسی، پرتغالی، روسی، چینی، هندی، عربی، امهری، اندونزیایی و زولو. فرهنگ کامل لندینگ و خطاها در کد موجود است. ترجمهٔ همهٔ واژه‌های داشبورد در همهٔ زبان‌ها هنوز کامل نیست و برخی از متن‌های جدید پنل‌ها به انگلیسی برمی‌گردند. نباید پوشش کامل تمام زبان‌های رسمی کشورهای بریکس یا تأیید بومی‌زبان را ادعا کرد. منبع: apps/web/src/lib/landing-copy.ts، i18n.ts، errors.ts و dashboard.ts.');
 heading(s,'رابط چندزبانه برای ارتباط گسترده‌تر',true);
 text(s,'۱۰',70,170,420,265,210,C.sage,true,'center');
 text(s,'زبان فعال',80,449,400,70,38,C.cream,false,'center');
 text(s,'فارسی\nانگلیسی\nپرتغالی\nروسی\nچینی',925,192,290,320,29,C.cream);
 text(s,'هندی\nعربی\nامهری\nاندونزیایی\nزولو',590,192,275,320,29,C.cream);
 text(s,'لندینگ و خطاها در هر ۱۰ زبان ترجمه شده‌اند',400,584,815,45,24,C.gold);
}
// 13: real desktop dark mode and real mobile landing screenshots.
{
 const s=slide(C.deep,'رابط در موبایل و دسکتاپ طراحی شده و تنظیم روشن، تاریک و پیروی از سیستم را ذخیره می‌کند. تصویر دسکتاپ نمای برنامه با دادهٔ نمایشی و تصویر موبایل از لندینگ واقعی محصول است. منابع تصویر: assets/dark.png و assets/mobile-ar.png.',true);
 heading(s,'یک محصول، چند شیوهٔ استفاده',true);
 await image(s,'dark',55,165,860,445);
 await image(s,'mobile-ar',990,145,230,498);
 text(s,'دسکتاپ با حالت تاریک',100,623,760,40,24,C.sage);
}
// 14: implemented controls, without claiming legal/compliance approval.
{
 const s=slide(C.cream,'این قابلیت‌ها از وضعیت پیاده‌سازی مخزن استخراج شده‌اند. دسترسی خصوصی با عضویت سازمانی محدود می‌شود، مقادیر اعشاری رشته‌ای و BCMath به کار می‌رود و گردش موجودی و outbox اتمیک ثبت می‌شوند. این اسلاید ادعای آماده‌بودن برای تولید، تأیید حقوقی یا قابلیت پرداخت ندارد.');
 heading(s,'کنترل از مرز سازمان تا موجودی');
 const ys=[185,300,415,530];
 const titles=['دسترسی سازمانی','گردش موجودی','رزرو زمان‌دار','دقت مقدار'];
 const descriptions=['اطلاعات خصوصی براساس عضویت و نقش کاربر','ثبت تغییرات موجودی در کنار عملیات مربوط','انقضا و آزادسازی رزروهای موقت','نگهداری مقدار وزن با دقت اعشاری'];
 ys.forEach((y,i)=>{text(s,titles[i],850,y,375,55,31,C.ink,true);text(s,descriptions[i],65,y+5,710,80,27,C.muted);});
}
// 15: explicitly separate shipped features and future scope.
{
 const s=slide(C.green,'ستون امروز قابلیت‌های موجود را فهرست می‌کند. ستون گام بعدی نقشهٔ توسعه است و تعهد زمان‌بندی، بودجه یا ادعای پیاده‌سازی ایجاد نمی‌کند. مذاکرهٔ تجاری نسخه‌دار، سفارش و قرارداد، سند خصوصی، حمل، پرداخت و تأیید صادرات هنوز کامل نیستند.');
 heading(s,'دامنهٔ فعلی و مسیر توسعه',true);
 text(s,'امروز',750,195,475,65,44,C.sage,true);
 text(s,'عرضه و بررسی محصول\nموجودی و رزرو موقت\nبازار و مدیریت مشتری\nلندینگ چندزبانه',720,302,505,225,29,C.cream);
 text(s,'گام‌های بعدی',65,195,510,65,44,C.gold,true);
 text(s,'مذاکره و نسخه‌های قیمت\nسفارش و قرارداد معتبر\nاسناد خصوصی و حمل\nپرداخت و الزامات صادرات',65,302,510,225,29,C.cream);
 text(s,'قابلیت‌های ستون آینده هنوز ارائه نشده‌اند',200,610,1025,42,24,C.gold);
}
// 16: product-demo close; no invented team, traction or fundraising terms.
{
 const s=slide(C.deep,'پایان ارائه با پیشنهاد دموی زندهٔ محصول. گردش قابل نمایش: معرفی محصول، بررسی سازمان و آگهی، جست‌وجو و رزرو موقت. طبق درخواست کاربر، مبلغ جذب سرمایه، اعضای تیم، درآمد، مشتری واقعی و اندازهٔ بازار در این نسخه نیامده‌اند. AgriTrade یک پلتفرم مستقل است و وابستگی رسمی به گروه بریکس ادعا نمی‌کند.');
 text(s,'AgriTrade',100,125,1080,140,102,C.sage,true,'center','closing-brand');
 text(s,'بیایید محصول را در عمل ببینیم',65,329,1150,100,48,C.cream,true,'center','slide-title');
 text(s,'ثبت محصول، بررسی، جست‌وجو و رزرو موقت',100,474,1080,75,27,'#D1DCC9',false,'center');
 text(s,'پلتفرمی مستقل با تمرکز بر تجارت کشاورزی',100,595,1080,50,23,C.gold,false,'center');
}

await (await PresentationFile.exportPptx(p)).save(path.join(build,'draft.pptx'));
await fs.writeFile(path.join(build,'deck.json'),JSON.stringify(p.toProto()));
console.log('Draft exported: '+p.slides.items.length+' editable slides');

# BRICS AgriTrade

## پنل‌های جدید

مسیرهای `/admin`، `/farmer` و `/trader` با منوی مستقل، فونت محلی وزیرمتن، چیدمان موبایل، داشبورد متصل به داده و کنترل دسترسی فعال شده‌اند. پس از ورود، کاربر به پنل مرتبط هدایت می‌شود.

گردش قابل استفاده این مرحله: تکمیل اطلاعات حقوقی کشاورز، ذخیره پیش‌نویس محصول، فرم پنج‌مرحله‌ای و ارسال برای بررسی، تصمیم احراز هویت و آگهی توسط مدیر با دلیل و شواهد، نمایش محصول تأییدشده در بازار، رزرو جزئی تاجر و نمایش درخواست دریافتی کشاورز. مشتریان خارجی و فرصت‌های تجاری در CRM خصوصی سازمان ذخیره می‌شوند.

برای حساب کشاورز در `apps/api` اجرا کنید: `php artisan access:create farmer@example.test --farmer`. پس از به‌روزرسانی کد، `php artisan migrate` را اجرا کنید. راهنمای وضعیت و محدودیت‌ها در `docs/DASHBOARD_IMPLEMENTATION_PLAN.md` و `docs/IMPLEMENTATION_STATUS.md` است.

این مرحله هنوز سفارش، قرارداد، انتقال مالکیت، بررسی صادرات، اسناد خصوصی، حمل، پرداخت، اختلافات و پیام‌رسانی را کامل نمی‌کند. رزرو، خرید یا تملک موجودی محسوب نمی‌شود.

## زبان، ظاهر و دسترسی‌ها

از بالای صفحه، یکی از ۱۰ زبان فارسی، انگلیسی، پرتغالی، روسی، چینی، هندی، عربی، امهری، اندونزیایی و زولو را انتخاب کنید. فارسی و عربی راست‌به‌چپ هستند. زبان و حالت روشن/تاریک/سیستم در مرورگر ذخیره می‌شوند. این مجموعه زبان‌های اصلی منتخب را پوشش می‌دهد و شامل تمام زبان‌های رسمی یا محلی کشورهای عضو نیست.

برای ساخت حساب ادمین و تاجر، از پوشه `apps/api` اجرا کنید:

```powershell
php artisan migrate
php artisan access:create admin@example.test --admin
php artisan access:create trader@example.test --trader
```

هر فرمان نام و رمز عبور حداقل ۱۲ نویسه‌ای را می‌پرسد؛ رمز هنگام ورود مخفی است. فرمان تاجر نام سازمان را هم دریافت می‌کند. ایمیل‌ها نمونه‌اند؛ می‌توانید ایمیل دلخواه بدهید. حساب موجود بازنویسی نمی‌شود. رمز پیش‌فرض مشترک وجود ندارد.

هر دو حساب از فرم ورود معمولی وارد می‌شوند. ادمین گزینه «مدیریت سامانه» را می‌بیند؛ این بخش فعلاً آمار و فهرست سازمان‌ها را نمایش می‌دهد. تاجر به موجودی و آمار سازمان خودش دسترسی دارد و می‌تواند موجودی ثبت کند. در فرم ایجاد سازمان نیز می‌توان نوع «فضای تاجر» را انتخاب کرد. نقش ادمین از ثبت‌نام عمومی قابل دریافت نیست و دسترسی ادمین به معنی عضویت خودکار در سازمان‌ها نیست. ساخت سازمان تاجر به معنی تأیید KYB یا مجوز تجارت نیست.

An early, persisted Laravel 13 / Next.js agricultural trade foundation. **The requested MVP is not complete.** Implemented: session registration/login/logout, organization creation/switching, membership-isolated lots, decimal inventory reservations, idempotent release, expiry scheduling and transactional movement/outbox records. Persian RTL is default; English LTR and system dark/light appearance are available.

Required source documents were not present. See docs/DECISIONS.md for the exact missing list. Never treat this foundation as approved business workflows or real trade compliance.

## Local startup without Docker

Requires PHP 8.3+, Composer, BCMath, PDO SQLite and Node 24. In apps/api:

```
composer install
```

Copy .env.example to .env; leave DB_CONNECTION=sqlite for this functional development adapter, then:

```
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

In a separate terminal, from apps/web:

```
npm ci
npm run dev
```

Open http://localhost:3000. Register a new account with at least 12 password characters, create an organization and create a lot (quantities as decimal strings, e.g. 50000 and 1000). Country format: IR. Seeded records are synthetic and have no shared login password or verified status.

SQLite is only a local functional adapter, not a supported concurrent inventory deployment. PostgreSQL is mandatory for transaction locking verification. Docker setup, workers, MinIO and Mailpit: docs/DEPLOYMENT.md. Tests: docs/TESTING.md. API contract: docs/API.md. Current scope and next steps: docs/IMPLEMENTATION_STATUS.md.

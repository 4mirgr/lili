# ربات تلگرام استعلام دلار

این ربات با دکمه «استعلام قیمت»، نرخ خرید و فروش دلار را مستقیماً از Bonbast دریافت می‌کند و همراه با زمان استعلام و زمان درج قیمت در سایت نمایش می‌دهد. همچنین ورودی‌هایی مانند `۸۰ دلار`، `80 USD` یا فقط `80` را با نرخ فروش روز به تومان محاسبه می‌کند.

## اجرای دائمی و رایگان روی Cloudflare Workers

نسخه مخصوص Cloudflare در پوشه `cloudflare/` قرار دارد و به‌جای polling از webhook تلگرام استفاده می‌کند؛ بنابراین نیازی به روشن‌ماندن کامپیوتر ندارد.

1. وارد پوشه شوید و وابستگی‌ها را نصب کنید:

   ```bash
   cd cloudflare
   npm install
   npx wrangler login
   ```

2. دو secret را ثبت کنید. هر دستور مقدار را به‌صورت مخفی از شما می‌پرسد:

   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put WEBHOOK_SECRET
   ```

   برای `WEBHOOK_SECRET` یک رشته تصادفی فقط شامل حروف انگلیسی، عدد، خط تیره یا زیرخط وارد کنید.

3. Worker را منتشر کنید:

   ```bash
   npm run deploy
   ```

   آدرس نهایی شبیه `https://estelam-dollar-bot.<account>.workers.dev` نمایش داده می‌شود.

4. webhook را یک بار تنظیم کنید؛ مقادیر داخل `<>` را جایگزین کنید:

   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://estelam-dollar-bot.<account>.workers.dev/telegram","secret_token":"<WEBHOOK_SECRET>","drop_pending_updates":true}'
   ```

5. نتیجه باید `{"ok":true,"result":true,...}` باشد. اکنون در تلگرام `/start` را ارسال کنید.

توجه: با فعال‌شدن webhook، نسخه Python مبتنی بر polling را هم‌زمان اجرا نکنید.

## راه‌اندازی سریع

1. در تلگرام به `@BotFather` پیام بدهید، دستور `/newbot` را اجرا کنید و توکن بات را بگیرید.
2. فایل تنظیمات را بسازید:

   ```bash
   cp .env.example .env
   ```

3. مقدار `TELEGRAM_BOT_TOKEN` در `.env` را با توکن واقعی جایگزین کنید.
4. اجرا با Docker:

   ```bash
   docker compose up -d --build
   ```

   یا اجرای مستقیم با Python 3.11 به بالا:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python bot.py
   ```

5. در صفحه بات تلگرام `/start` را بفرستید.

## تست

```bash
python -m unittest -v
```

## نکات عملیاتی

- اعداد Bonbast بر حسب تومان هستند؛ ربات تبدیل ریال/تومان انجام نمی‌دهد.
- زمان استعلام بر اساس `Asia/Tehran` ثبت می‌شود.
- زمان درج، فقط از فیلدهای زمانی پاسخ خود Bonbast خوانده می‌شود و با زمان سیستم جایگزین نمی‌شود.
- دسترسی مستقیم غیررسمی به صفحه و endpoint سایت ممکن است با تغییر ساختار یا محدودیت IP قطع شود. برای سرویس تجاری و پایداری تضمین‌شده، API رسمی پولی Bonbast گزینه مناسب‌تری است.
- قبل از استفاده عمومی، شرایط استفاده Bonbast را بررسی کنید و نام منبع را حذف نکنید.


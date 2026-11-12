# استودیو آلمانی لی‌لی

یک PWA آفلاین و فارسی‌محور برای حرکت از صفر تا C1. این برنامه در پوشه‌ای مستقل قرار دارد تا هیچ‌یک از فایل‌ها و سرویس‌های قبلی مخزن `lili` تغییر نکنند.

## آنچه اکنون آماده است

- ثبت‌نام آزاد، ورود و خروج با Supabase Auth و همگام‌سازی خودکار و نسخه‌دار
- سقف پنج حساب Lili در خود پایگاه‌داده (بدون نیاز به دعوت‌نامه)
- جداسازی کامل دادهٔ هر حساب با Row Level Security
- چهارده درس خرد واقعی A0/A1، از سلام و معرفی تا خرید، مسیر و معرفی ۶۰ثانیه‌ای
- یازده تمرین خواندن و شنیدن A0 تا C1 با واژگان در جمله، نکتهٔ دستوری، پرسش درک مطلب، پاسخ نوشتاری و سناریوی مکالمه
- مسیر واحد از A0 با دو سؤال در هر درس پایه، تمرین شنیداری قبل از عبور از A0/A1 و پیشنهاد اولین درس تکمیل‌نشده
- ۲۷ قطعهٔ صوتی Thorsten برای متن تمرین‌های شنیداری و گزیدهٔ جمله‌ها و واژه‌های A0، با پخش آفلاین و کنترل سرعت
- داشبورد راست‌چین با نوار کناری، جست‌وجوی دوزبانه و چیدمان واکنش‌گرا بر اساس قالب Dompet
- واژه‌نامهٔ سطح‌بندی‌شده با تلفظ، افزودن به مرور و خروجی UTF-8 برای ورود به Anki
- حالت آفلاین و پروفایل‌های محلی برای استفاده بدون حساب
- مسیر مهارتی A0 تا C1 با پیش‌نیاز، mastery gate و پیشنهاد درس بعد
- آزمون مقدماتی A1 تا C1 و تشخیص شروع از A0
- برنامه روزانه، حالت روز شلوغ و benchmark ماهانه
- فلش‌کارت با زمان‌بندی الهام‌گرفته از FSRS، تمرین گرامر و تبدیل خطاها به کارت
- تلفظ آلمانی با TTS مرورگر، shadowing و تمایز آوایی
- ضبط مکالمه، موقعیت‌های واقعی، تمرین ارائه/بحث و rubric هفت‌محوره شامل intelligibility
- نوشتن ایمیل، متن استدلالی و خلاصه در چرخهٔ پیش‌نویس، بازخورد و بازنویسی
- داشبورد آمادگی Goethe B2 بر پایهٔ سه آزمون شبیه‌سازی‌شده و ارزیابی معتبر خروجی‌ها
- گزارش پیشرفت، خروجی و بازیابی JSON و کارکرد آفلاین
- هایلایت متن همراه یادداشت، بازگشت به منبع و صفحهٔ «هایلایت‌های من»
- آیکون نصب‌پذیر با رنگ‌های پرچم آلمان برای وب، PWA و Apple Touch

## اجرای محلی

به‌علت Service Worker، برنامه را از یک وب‌سرور محلی اجرا کنید:

```bash
cd german-studio
python3 -m http.server 8080
```

سپس `http://localhost:8080` را باز کنید.

## منابع آموزشی

فهرست منابع منتخب از مجموعهٔ Awesome German با مجوز [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) اقتباس و با توضیح فارسی و تمرین کاربردی تکمیل شده است. برای هر منبع، نام ناشر و لینک مستقیم در برنامه آمده است.

- [Learning tools](https://github.com/awesome-german/learning-tools) برای دوره‌ها و تمرین آزمون Goethe
- [Flashcards](https://github.com/awesome-german/flashcards) برای مرور فاصله‌دار، جمله‌های نمونه و گردش کار Anki
- [AI tools](https://github.com/awesome-german/ai-tools) برای سناریوهای مکالمه و بازنویسی
- [Vocabulary](https://github.com/awesome-german/vocabulary) برای دیکشنری و الگوهای تلفظ
- [Grammar](https://github.com/awesome-german/grammar) برای دسته‌بندی نکات دستوری و تمرین تکمیلی
- [News](https://github.com/awesome-german/news) برای شنیدن و خواندن خبر بر اساس سطح

### منابع افزوده

- دسته‌بندی چهار مهارت در صفحهٔ آزمون از [exam.one](https://github.com/evgentrigub/exam.one) الهام گرفته است. تمرین‌های لی‌لی تألیفی‌اند. صفحهٔ آزمون به [نمونه‌های رسمی گوته](https://www.goethe.de/ins/de/de/prf/exc.html) و [Wordfeather](https://wordfeather.com/) پیوند می‌دهد.
- موضوع‌های سطح‌بندی‌شده و مثال‌های کاربردی با مرور [Awesome German](https://github.com/willianpaixao/awesome-german)، [Deutschland-Book-A1](https://github.com/Hazrat-Ali9/Deutschland-Book-A1)، [Deutschland-Book-A2](https://github.com/Hazrat-Ali9/Deutschland-Book-A2)، [Deutschland-Preposition](https://github.com/Hazrat-Ali9/Deutschland-Preposition) و فهرست‌های واژگان و آمادگی آزمون کاربر انتخاب شدند.
- در تمرین اطلاعیهٔ B2، اجزای یک اسم ترکیبی بررسی می‌شود. در جست‌وجو، صورت‌های جایگزین مانند `ae` و `ss` هم پذیرفته می‌شوند. منابع بررسی‌شده [German Compound Splitter](https://github.com/repodiac/german_compound_splitter) و [German Transliterate](https://github.com/repodiac/german_transliterate) هستند.
- تمرین ویرایش C1 با الهام از [humanizer-de](https://github.com/marmbiz/humanizer-de) بر حفظ واقعیت‌ها و روشن‌کردن فعل، عامل و زمان تمرکز دارد.
- تصویر نامهٔ رسمی از [قالب DIN 5008 اثر Alexey Abel](https://github.com/alexeyabel/latex-briefvorlage-din-5008) با مجوز MIT آمده است. منابع تصویری ناشران و فایل‌های دارای مجوز نامشخص، از جمله PDFهای [German Vocabulary With Picture](https://github.com/Hazrat-Ali9/German-Vocabulary-With-Picture)، وارد مخزن نشده‌اند.
- عکس درس اشیاء از [Books in stack with lamps اثر chuttersnap](https://commons.wikimedia.org/wiki/File:Books_in_stack_with_lamps_(Unsplash).jpg) با مجوز CC0 آمده و برای نمایش در وب کوچک شده است.
- کلیپ‌ها با [Thorsten-Voice](https://github.com/thorstenMueller/Thorsten-Voice) و [مدل Piper تحت CC0](https://huggingface.co/rhasspy/piper-voices/blob/main/de/de_DE/thorsten/medium/MODEL_CARD) از متن‌های لی‌لی ساخته شده‌اند. بازتولید با `python german-studio/tools/build-lesson-audio.py /path/to/de_DE-thorsten-medium.onnx`، همراه با فایل تنظیمات همان مدل، `piper-tts`، Node و FFmpeg.

## حساب‌ها و داده‌ها

احراز هویت و دادهٔ خصوصی با Supabase انجام می‌شود. SQL ایزولهٔ Lili در `../supabase/lili_schema.sql` قرار دارد و فقط جدول‌ها و policyهای دارای پیشوند `lili_` را می‌سازد. هر کاربر فقط ردیف متعلق به `auth.uid()` خودش را می‌بیند. ذخیره خودکار است و revision از overwrite خاموش بین دو دستگاه جلوگیری می‌کند. پوشهٔ قدیمی `german-backend` فقط برای حفظ تاریخچه نگه داشته شده و frontend دیگر از آن استفاده نمی‌کند.

## محدودیت صادقانه و مسیر تکمیل محتوا

1. گسترش محتوای ثابت هر سطح به حداقل ۸۰–۱۲۰ درس کوتاه و افزودن آزمون پایان سطح.
2. افزودن تمرین شنیداری دارای فایل صوتی و متن، با مجوز روشن.
3. افزودن STT آلمانی با رضایت کاربر و نمایش transcript/alignment؛ تا آن زمان برنامه ادعای نمرهٔ دقیق تلفظ نمی‌کند.
4. افزودن پنل مربی برای مشاهده نقاط ضعف، تعیین تکلیف و خروجی هفتگی.
5. آزمون کاربردپذیری با زبان‌آموزان واقعی A0، A2 و B1 پیش از تولید محتوای انبوه.

این محصول ابزار تمرین و سنجش آمادگی است و مدرک یا تضمین قبولی رسمی Goethe/telc ارائه نمی‌کند. «آماده» فقط وقتی نمایش داده می‌شود که learner سه mock متوالی با حداقل ۷۰ در هر چهار ماژول، کف مهارتی و دو ارزیابی معتبر برای Speaking/Writing داشته باشد.

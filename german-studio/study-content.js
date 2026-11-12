'use strict';

// Original exercises. External resources are credited in README.md.
window.STUDY_CONTENT = {
  levels: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'],
  resources: [
    ['DW · Nicos Weg', 'دوره', 'A1–B1', 'یک ویدیو ببین، سپس سه جملهٔ کاربردی آن را تکرار کن.', 'https://learngerman.dw.com/de/nicos-weg/c-36519687', 'learning-tools'],
    ['Goethe-Institut', 'آزمون', 'A1–C1', 'نمونهٔ رسمی سطح خودت را انتخاب کن و چهار مهارت را جداگانه بسنج.', 'https://www.goethe.de/ins/de/de/prf/exc.html', 'learning-tools'],
    ['Anki', 'فلش‌کارت', 'A0–C1', 'برای مرور فاصله‌دار، فایل TSV واژه‌نامهٔ لی‌لی را در Anki وارد کن.', 'https://apps.ankiweb.net/', 'flashcards'],
    ['Wiktionary', 'واژگان', 'A1–C1', 'املای واژه، جمع اسم، صرف فعل و مثال‌ها را بررسی کن.', 'https://de.wiktionary.org/', 'vocabulary'],
    ['Forvo', 'واژگان', 'A0–C1', 'واژه را جست‌وجو کن و نمونه‌های تلفظ گویندگان مختلف را بشنو.', 'https://forvo.com/languages/de/', 'vocabulary'],
    ['Lingolia · Artikel', 'گرامر', 'A1–B1', 'بعد از درس آرتیکل، شکل‌های der، die و das را در جمله مقایسه کن.', 'https://deutsch.lingolia.com/en/grammar/nouns-and-articles/articles-noun-markers', 'grammar'],
    ['Verbformen', 'گرامر', 'A1–C1', 'یک فعل از تمرین امروز را جست‌وجو کن و سه شکل پرکاربردش را در جمله به کار ببر.', 'https://www.verbformen.de/', 'grammar'],
    ['LanguageTool', 'نوشتن', 'A1–C1', 'در صورت تمایل متن خودت را در ابزار وارد کن، علت دو اصلاح را پیدا کن و جمله‌ها را بازنویسی کن.', 'https://languagetool.org/', 'ai-tools'],
    ['Nachrichtenleicht', 'خبر', 'A2–C1', 'یک خبر کوتاه انتخاب کن و در یک جمله بگو چه اتفاقی افتاده است.', 'https://www.nachrichtenleicht.de/', 'news'],
    ['Tagesschau · Einfache Sprache', 'خبر', 'B1–C1', 'خبر را یک بار بدون متن ببین و بار دوم جزئیات را یادداشت کن.', 'https://www.tagesschau.de/einfache-sprache', 'news'],
    ['DW · Langsam gesprochene Nachrichten', 'خبر', 'B2–C1', 'دو نکته از صوت استخراج کن، سپس با متن خبر بسنج و خلاصهٔ خودت را بنویس.', 'https://learngerman.dw.com/de/langsam-gesprochene-nachrichten/s-60040332', 'news']
  ],
  labs: [
    {
      id: 'hello', level: 'A0', title: 'دو نفر، دو اسم',
      text: 'Hallo! Ich heiße Mia. Und du? — Ich heiße Ali. — Tschüss, Ali!',
      hint: 'به نام هر نفر و آخرین کلمه گوش کن.',
      words: [['Hallo', 'سلام', 'Hallo, Mia!'], ['Tschüss', 'خداحافظ', 'Tschüss, Ali!']],
      grammar: ['گفتن نام', 'با Ich heiße شروع کن و بعد نامت را بگو.', 'Ich heiße Mia.'],
      checks: [['اسم نفر دوم چیست؟', ['Mia', 'Ali'], 1], ['آخر گفتگو چه گفتند؟', ['Tschüss', 'Danke'], 0]],
      output: 'با «Hallo! Ich heiße …» خودت را معرفی کن.',
      scenario: 'A first meeting. Ask my name with “Wie heißt du?” and teach me to answer with “Ich heiße …”.'
    },
    {
      id: 'meeting', level: 'A1', title: 'قرار جلوی ایستگاه',
      text: 'Hallo Sara! Ich komme heute um drei Uhr. Treffen wir uns am Bahnhof? Ich warte vor dem Eingang. Bis später! Leon',
      hint: 'ساعت و محل قرار را پیدا کن.',
      words: [['der Bahnhof', 'ایستگاه قطار', 'Wir treffen uns am Bahnhof.'], ['der Eingang', 'ورودی', 'Ich warte vor dem Eingang.']],
      grammar: ['ساعت در جمله', 'برای ساعت دقیق از um استفاده می‌کنیم. در مثال، فعل komme بلافاصله بعد از Heute آمده است.', 'Heute komme ich um drei Uhr.'],
      checks: [['ساعت قرار چند است؟', ['Um zwei Uhr', 'Um drei Uhr', 'Um vier Uhr'], 1], ['لئون کجا منتظر می‌ماند؟', ['Im Zug', 'Im Café', 'Vor dem Eingang'], 2]],
      output: 'در دو جمله جواب بده. یک ساعت جدید و همان محل را پیشنهاد کن.',
      scenario: 'Arrange a meeting at a train station. Ask for the time and place, one short question per turn.'
    },
    {
      id: 'train', level: 'A2', title: 'وقتی قطار نمی‌رسد',
      text: 'Gestern wollte Ben seine Schwester besuchen. Am Bahnhof hat er erfahren, dass sein Zug ausfällt. Er hat im Reisezentrum nach einer Alternative gefragt. Eine Mitarbeiterin hat ihm erklärt, dass in zwanzig Minuten ein Bus fährt. Ben hat seiner Schwester sofort geschrieben. Eine Stunde später ist er bei ihr angekommen.',
      hint: 'سه رویداد اصلی را به ترتیب پیدا کن.',
      words: [['ausfallen', 'لغو شدن', 'Mein Zug fällt heute aus.'], ['nach einer Alternative fragen', 'دربارهٔ گزینهٔ جایگزین پرسیدن', 'Ich frage nach einer Alternative.']],
      grammar: ['گذشتهٔ گفتاری (Perfekt)', 'با haben یا sein و شکل سوم فعل، رویداد گذشته را تعریف کن. برای رسیدن از sein استفاده می‌کنیم.', 'Ben hat gefragt. Später ist er angekommen.'],
      checks: [['بن چرا به مرکز مسافرتی رفت؟', ['قطارش لغو شد.', 'بلیت خواهرش را گرفت.', 'اتوبوس را گم کرد.'], 0], ['اتوبوس چند دقیقه بعد حرکت می‌کرد؟', ['Zehn Minuten', 'Eine Stunde', 'Zwanzig Minuten'], 2]],
      output: 'در چهار جمله با Perfekt بگو چه اتفاقی افتاد و بن چطور مشکل را حل کرد.',
      scenario: 'You work at the station information desk. My train is cancelled. Let me ask about the next bus and repeat back the departure time.'
    },
    {
      id: 'library', level: 'A2', title: 'ثبت‌نام در کتابخانه',
      text: 'Guten Tag, ich bin neu in der Stadt und möchte mich in Ihrer Bibliothek anmelden. Auf Ihrer Webseite steht, dass man einen Ausweis braucht. Reicht mein Reisepass? Unter der Woche arbeite ich bis 17 Uhr. Könnten Sie mir sagen, ob die Bibliothek am Samstag geöffnet ist? Vielen Dank und freundliche Grüße, Samira Rahimi.',
      hint: 'دو سؤال مشخص سامیرا را پیدا کن.',
      words: [['sich anmelden', 'ثبت‌نام کردن', 'Ich möchte mich anmelden.'], ['ausreichen', 'کافی بودن', 'Reicht mein Reisepass aus?']],
      grammar: ['پرسش غیرمستقیم با ob', 'وقتی جواب یک پرسش «بله» یا «خیر» است، آن را با ob در جمله بیاور و فعل صرف‌شده را آخر بگذار.', 'Wissen Sie, ob die Bibliothek geöffnet ist?'],
      checks: [['سامیرا می‌خواهد کجا ثبت‌نام کند؟', ['در دانشگاه', 'در کتابخانه', 'در باشگاه'], 1], ['دربارهٔ چه روزی سؤال دارد؟', ['Freitag', 'Sonntag', 'Samstag'], 2]],
      output: 'ایمیلی کوتاه برای ثبت‌نام در یک دوره بنویس و دربارهٔ زمان و مدرک لازم بپرس.',
      scenario: 'You work at the library. Let me ask which ID I need and whether you open on Saturday.'
    },
    {
      id: 'repair', level: 'B1', title: 'رادیو در کافهٔ تعمیر',
      text: 'Als mein Radio kaputtging, wollte ich zuerst ein neues kaufen. Eine Nachbarin erzählte mir jedoch von einem Repair-Café. Dort haben wir das Gerät gemeinsam geöffnet und ein lockeres Kabel gefunden. Die Reparatur war kostenlos, aber ich musste etwas warten. Trotzdem würde ich wieder hingehen, weil ich dabei selbst etwas gelernt habe.',
      hint: 'انتظار اول، نتیجه و دلیل نظر گوینده را جدا کن.',
      words: [['kaputtgehen', 'خراب شدن', 'Mein Radio ist kaputtgegangen.'], ['trotzdem', 'با وجود این', 'Ich musste warten. Trotzdem komme ich wieder.']],
      grammar: ['دلیل با weil', 'در بخش weil فعل صرف‌شده آخر می‌آید. اگر زمان Perfekt است، فعل کمکی بعد از شکل سوم می‌آید.', 'Ich komme wieder, weil ich etwas gelernt habe.'],
      checks: [['مشکل رادیو چه بود؟', ['باتری خالی بود.', 'یک سیم شل بود.', 'دکمه شکسته بود.'], 1], ['چرا گوینده دوباره می‌رود؟', ['چون چیزی یاد گرفته است.', 'چون رادیو هنوز خراب است.', 'چون نیاز به تعویض دارد.'], 0]],
      output: 'تجربهٔ مشابهی را تعریف کن و با weil و trotzdem توضیح بده چه نظری دربارهٔ تعمیر وسایل داری.',
      scenario: 'Discuss repairing versus replacing an old object. Ask me for a reason and respond with one polite objection.'
    },
    {
      id: 'city', level: 'B2', title: 'خیابان مشترک، نیازهای متفاوت',
      text: 'Die Stadt plant, einen Teil der Innenstadt für den Durchgangsverkehr zu sperren. Befürworter erwarten weniger Lärm und mehr Platz für Fußgänger. Einige Geschäftsleute befürchten dagegen, dass Kundinnen und Kunden aus dem Umland seltener kommen. Die Stadt schlägt deshalb einen befristeten Versuch vor: Während Lieferungen morgens möglich bleiben, wird der übrige Autoverkehr umgeleitet. Danach sollen Verkehrsdaten und Rückmeldungen gemeinsam ausgewertet werden.',
      hint: 'موضع دو گروه و دلیل اجرای آزمایشی را مشخص کن.',
      words: [['der Durchgangsverkehr', 'ترافیک عبوری', 'Der Durchgangsverkehr wird umgeleitet.'], ['die Rückmeldung auswerten', 'بازخورد را تحلیل کردن', 'Die Stadt wertet die Rückmeldungen aus.']],
      grammar: ['بیان تضاد', 'با während دو وضعیت را مقایسه کن. dagegen تضاد جملهٔ دوم با ادعای قبل را نشان می‌دهد.', 'Während manche weniger Lärm erwarten, befürchten andere weniger Kundschaft.'],
      checks: [['نگرانی فروشندگان چیست؟', ['افزایش زمان تحویل', 'کاهش مشتریان حومه', 'افزایش اجارهٔ مغازه'], 1], ['برنامه چگونه ارزیابی می‌شود؟', ['فقط با نظرسنجی', 'فقط با آمار فروش', 'با دادهٔ ترافیک و بازخورد'], 2]],
      output: 'در ۱۲۰ تا ۱۵۰ واژه موضع خودت را بنویس. یک مخالفت واقعی را توضیح بده و راهکاری پیشنهاد کن.',
      scenario: 'Simulate a B2 discussion on restricting car access downtown. Ask me to defend one proposal, counter it and invite a compromise.'
    },
    {
      id: 'metrics', level: 'C1', title: 'پیشرفت را چطور اندازه می‌گیریم؟',
      text: 'Eine Bibliothek meldet steigende Besucherzahlen, seit sie ihre Öffnungszeiten verlängert hat. Die Statistik erfasst allerdings jeden Eintritt, auch wenn dieselbe Person mehrmals am Tag kommt. Der Erfolg der Maßnahme hängt folglich davon ab, welches Ziel man zugrunde legt. Soll der Zugang flexibler werden, sind häufigere Besuche ein plausibles Signal. Geht es hingegen darum, neue Zielgruppen zu erreichen, wären zusätzliche Daten nötig. Die Zahlen liefern also einen Hinweis, lassen jedoch keinen eindeutigen Schluss auf die Zusammensetzung des Publikums zu.',
      hint: 'فرق میان دادهٔ موجود و نتیجه‌گیری قابل دفاع را پیدا کن.',
      words: [['zugrunde legen', 'مبنا قرار دادن', 'Welches Ziel legen wir zugrunde?'], ['einen Schluss zulassen', 'امکان نتیجه‌گیری دادن', 'Die Zahlen lassen keinen eindeutigen Schluss zu.']],
      grammar: ['شرط بدون wenn', 'در نثر تحلیلی می‌توان جملهٔ شرطی را با فعل صرف‌شده شروع کرد. «Geht es …» در این متن همان نقش «Wenn es … geht» را دارد.', 'Geht es um neue Zielgruppen, wären zusätzliche Daten nötig.'],
      checks: [['چرا آمار، جذب مخاطب تازه را ثابت نمی‌کند؟', ['بازدیدهای تکراری هم شمرده می‌شوند.', 'آمار فقط صبح‌ها ثبت شده است.', 'ساعات کار کمتر شده است.'], 0], ['موضع نویسنده چیست؟', ['داده بی‌ارزش است.', 'تفسیر داده به هدف بستگی دارد.', 'افزایش بازدید حتماً یعنی جذب مخاطب تازه.'], 1]],
      output: 'یک یادداشت تحلیلی بنویس. دو هدف ممکن را تفکیک کن و برای هر هدف شاخص و محدودیتش را پیشنهاد بده.',
      scenario: 'Discuss whether rising library visits prove improved access. Ask me to qualify my interpretation and consider an alternative indicator.'
    }
  ]
};

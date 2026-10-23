const BONBAST_URL = "https://www.bonbast.com";
const BUTTON_TEXT = "🔎 استعلام قیمت";
const KEYBOARD = {
  keyboard: [[{ text: BUTTON_TEXT }]],
  resize_keyboard: true,
};

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function extractToken(html) {
  const patterns = [
    /(?:param\s*[:=]\s*|\{\s*param\s*:\s*)["']([^"']+)["']/i,
    /\/json["']\s*,\s*\{\s*param\s*:\s*["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  throw new Error("توکن دریافت قیمت در صفحه Bonbast پیدا نشد.");
}

function parseNumber(value, label) {
  const normalized = String(value ?? "").replaceAll(",", "").trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`مقدار نامعتبر برای ${label} از Bonbast دریافت شد.`);
  }
  return Number(normalized);
}

function publishedTime(data) {
  if (String(data.last_modified ?? "").trim()) {
    return String(data.last_modified).trim();
  }

  const required = ["year", "month", "day", "hour", "minute"];
  if (required.every((key) => data[key] !== undefined && data[key] !== "")) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${data.year}/${pad(data.month)}/${pad(data.day)} - ${pad(data.hour)}:${pad(data.minute)}:${pad(data.second ?? 0)}`;
  }

  const combined = [data.date, data.time].filter(Boolean).join(" - ");
  if (combined) return combined;
  throw new Error("زمان درج قیمت در پاسخ Bonbast موجود نیست.");
}

export function parseQuote(data) {
  if (data.reset) throw new Error("Bonbast توکن موقت درخواست را رد کرد؛ دوباره تلاش کنید.");
  return {
    sell: parseNumber(data.usd1, "قیمت فروش دلار"),
    buy: parseNumber(data.usd2, "قیمت خرید دلار"),
    publishedAt: publishedTime(data),
  };
}

export function parseDollarAmount(text) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const normalized = String(text ?? "")
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[٬,]/g, "")
    .replace(/٫/g, ".")
    .trim();
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:دلار|usd|\$)?$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return null;
  return amount;
}

async function latestDollar() {
  const commonHeaders = {
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    "accept-language": "fa-IR,fa;q=0.9,en;q=0.7",
    cookie: "cookieconsent_status=true; st_bb=0",
  };
  const homepage = await fetch(BONBAST_URL, { headers: commonHeaders });
  if (!homepage.ok) throw new Error(`ارتباط با Bonbast برقرار نشد (${homepage.status}).`);
  const token = extractToken(await homepage.text());

  const response = await fetch(`${BONBAST_URL}/json`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      accept: "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      origin: BONBAST_URL,
      referer: `${BONBAST_URL}/`,
    },
    body: new URLSearchParams({ param: token }),
  });
  if (!response.ok) throw new Error(`پاسخ Bonbast ناموفق بود (${response.status}).`);
  return parseQuote(await response.json());
}

async function telegram(env, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Telegram API error: ${response.status}`);
}

function tehranNow() {
  return new Intl.DateTimeFormat("fa-IR-u-ca-gregory-nu-latn", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date()).replace("،", " -");
}

async function handleUpdate(update, env) {
  const message = update.message;
  if (!message?.chat?.id) return;
  const chatId = message.chat.id;
  const text = String(message.text ?? "").trim();

  if (text === "/start" || text.startsWith("/start@")) {
    await telegram(env, "sendMessage", {
      chat_id: chatId,
      text: "سلام! برای دریافت آخرین قیمت دلار از Bonbast روی دکمه زیر بزنید.",
      reply_markup: KEYBOARD,
    });
    return;
  }

  const requestedAmount = parseDollarAmount(text);
  if (text === BUTTON_TEXT || text === "استعلام قیمت" || requestedAmount !== null) {
    try {
      await telegram(env, "sendChatAction", { chat_id: chatId, action: "typing" });
      const quote = await latestDollar();
      const body = requestedAmount === null
        ? [
            "💵 <b>آخرین قیمت دلار</b>",
            "",
            `🔴 فروش: <b>${quote.sell.toLocaleString("en-US")}</b> تومان`,
            `🟢 خرید: <b>${quote.buy.toLocaleString("en-US")}</b> تومان`,
            "",
            `🕒 زمان استعلام: ${tehranNow()}`,
            `🗓 زمان درج در سایت: ${quote.publishedAt}`,
            "",
            'منبع: <a href="https://www.bonbast.com">Bonbast.com</a>',
          ].join("\n")
        : [
            "🧮 <b>محاسبه قیمت دلار</b>",
            "",
            `💵 مقدار: <b>${requestedAmount.toLocaleString("en-US")}</b> دلار`,
            `🔴 نرخ فروش هر دلار: <b>${quote.sell.toLocaleString("en-US")}</b> تومان`,
            `💰 مبلغ نهایی: <b>${Math.round(requestedAmount * quote.sell).toLocaleString("en-US")}</b> تومان`,
            "",
            `🕒 زمان استعلام: ${tehranNow()}`,
            `🗓 زمان درج در سایت: ${quote.publishedAt}`,
            "",
            'منبع: <a href="https://www.bonbast.com">Bonbast.com</a>',
          ].join("\n");
      await telegram(env, "sendMessage", {
        chat_id: chatId,
        text: body,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: KEYBOARD,
      });
    } catch (error) {
      console.error(error);
      await telegram(env, "sendMessage", {
        chat_id: chatId,
        text: `⚠️ در دریافت قیمت مشکلی پیش آمد:\n${error.message}\n\nلطفاً کمی بعد دوباره تلاش کنید.`,
        reply_markup: KEYBOARD,
      });
    }
    return;
  }

  await telegram(env, "sendMessage", {
    chat_id: chatId,
    text: "برای استعلام دکمه «استعلام قیمت» را بزنید یا مبلغی مثل «۸۰ دلار» بفرستید.",
    reply_markup: KEYBOARD,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return jsonResponse({ ok: true, service: "estelam-dollar-bot" });
    }
    if (request.method !== "POST" || url.pathname !== "/telegram") {
      return new Response("Not found", { status: 404 });
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.WEBHOOK_SECRET) {
      return new Response("Worker secrets are missing", { status: 500 });
    }
    if (request.headers.get("x-telegram-bot-api-secret-token") !== env.WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      await handleUpdate(await request.json(), env);
      return jsonResponse({ ok: true });
    } catch (error) {
      console.error(error);
      return jsonResponse({ ok: false }, 500);
    }
  },
};


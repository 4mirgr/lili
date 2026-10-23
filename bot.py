"""Telegram bot entry point."""

from __future__ import annotations

import logging
import os
import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv
from telegram import ReplyKeyboardMarkup, Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from bonbast import BONBAST_URL, BonbastClient, BonbastError


BUTTON_TEXT = "🔎 استعلام قیمت"
KEYBOARD = ReplyKeyboardMarkup([[BUTTON_TEXT]], resize_keyboard=True)
logger = logging.getLogger(__name__)


def _timezone() -> ZoneInfo:
    name = os.getenv("TIMEZONE", "Asia/Tehran")
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError as exc:
        raise RuntimeError(f"منطقه زمانی نامعتبر است: {name}") from exc


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "سلام! برای دریافت آخرین قیمت دلار از Bonbast روی دکمه زیر بزنید.",
        reply_markup=KEYBOARD,
    )


async def price(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.chat.send_action(ChatAction.TYPING)
    client: BonbastClient = context.application.bot_data["bonbast_client"]
    try:
        quote = await asyncio.to_thread(client.latest_dollar)
    except BonbastError as exc:
        logger.warning("Bonbast request failed: %s", exc)
        await update.message.reply_text(
            f"⚠️ در دریافت قیمت مشکلی پیش آمد:\n{exc}\n\nلطفاً کمی بعد دوباره تلاش کنید.",
            reply_markup=KEYBOARD,
        )
        return

    checked_at = datetime.now(_timezone()).strftime("%Y/%m/%d - %H:%M:%S")
    message = (
        "💵 <b>آخرین قیمت دلار</b>\n\n"
        f"🔴 فروش: <b>{quote.sell_toman:,}</b> تومان\n"
        f"🟢 خرید: <b>{quote.buy_toman:,}</b> تومان\n\n"
        f"🕒 زمان استعلام: {checked_at}\n"
        f"🗓 زمان درج در سایت: {quote.published_at}\n\n"
        f'منبع: <a href="{BONBAST_URL}">Bonbast.com</a>'
    )
    await update.message.reply_text(
        message,
        parse_mode=ParseMode.HTML,
        disable_web_page_preview=True,
        reply_markup=KEYBOARD,
    )


async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message:
        await update.message.reply_text("برای استعلام، دکمه «استعلام قیمت» را بزنید.", reply_markup=KEYBOARD)


def main() -> None:
    load_dotenv()
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN در فایل .env تنظیم نشده است.")

    logging.basicConfig(
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        level=logging.INFO,
    )
    timeout = float(os.getenv("REQUEST_TIMEOUT", "15"))
    app = Application.builder().token(token).build()
    app.bot_data["bonbast_client"] = BonbastClient(timeout=timeout)
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.Regex(r"^(?:🔎\s*)?استعلام قیمت$"), price))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown))
    logger.info("Bot is running")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()


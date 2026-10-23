"""Fetch the latest USD/Toman quote directly from Bonbast."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Mapping


BONBAST_URL = "https://www.bonbast.com"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0 Safari/537.36"
)


class BonbastError(RuntimeError):
    """A human-readable upstream error."""


@dataclass(frozen=True)
class DollarQuote:
    sell_toman: int
    buy_toman: int
    published_at: str


def _number(value: Any, field: str) -> int:
    normalized = str(value).replace(",", "").strip()
    if not normalized.isdigit():
        raise BonbastError(f"مقدار نامعتبر برای {field} از Bonbast دریافت شد.")
    return int(normalized)


def extract_token(html: str) -> str:
    """Extract the short-lived token embedded in Bonbast's home page."""
    patterns = (
        r"(?:param\s*[:=]\s*|\{\s*param\s*:\s*)[\"']([^\"']+)[\"']",
        r"/json[\"']\s*,\s*\{\s*param\s*:\s*[\"']([^\"']+)[\"']",
    )
    for pattern in patterns:
        match = re.search(pattern, html, flags=re.IGNORECASE)
        if match:
            return match.group(1)
    raise BonbastError("توکن دریافت قیمت در صفحه Bonbast پیدا نشد.")


def published_time(data: Mapping[str, Any]) -> str:
    """Return Bonbast's own update time without substituting local fetch time."""
    last_modified = str(data.get("last_modified", "")).strip()
    if last_modified:
        return last_modified

    parts = {key: data.get(key) for key in ("year", "month", "day", "hour", "minute", "second")}
    if all(parts[key] not in (None, "") for key in ("year", "month", "day", "hour", "minute")):
        try:
            dt = datetime(
                int(parts["year"]), int(parts["month"]), int(parts["day"]),
                int(parts["hour"]), int(parts["minute"]), int(parts["second"] or 0),
            )
            return dt.strftime("%Y/%m/%d - %H:%M:%S")
        except (TypeError, ValueError):
            pass

    date_text = str(data.get("date", "")).strip()
    time_text = str(data.get("time", "")).strip()
    combined = " - ".join(part for part in (date_text, time_text) if part)
    if combined:
        return combined
    raise BonbastError("زمان درج قیمت در پاسخ Bonbast موجود نیست.")


def parse_quote(data: Mapping[str, Any]) -> DollarQuote:
    if data.get("reset"):
        raise BonbastError("Bonbast توکن موقت درخواست را رد کرد؛ دوباره تلاش کنید.")
    return DollarQuote(
        sell_toman=_number(data.get("usd1"), "قیمت فروش دلار"),
        buy_toman=_number(data.get("usd2"), "قیمت خرید دلار"),
        published_at=published_time(data),
    )


class BonbastClient:
    def __init__(self, timeout: float = 15) -> None:
        import requests

        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": USER_AGENT,
            "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.7",
        })

    def latest_dollar(self) -> DollarQuote:
        import requests

        try:
            homepage = self.session.get(BONBAST_URL, timeout=self.timeout)
            homepage.raise_for_status()
            token = extract_token(homepage.text)
            response = self.session.post(
                f"{BONBAST_URL}/json",
                data={"param": token},
                headers={
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": f"{BONBAST_URL}/",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.Timeout as exc:
            raise BonbastError("پاسخ Bonbast بیش از حد طول کشید.") from exc
        except requests.RequestException as exc:
            raise BonbastError("ارتباط با Bonbast برقرار نشد.") from exc
        except ValueError as exc:
            raise BonbastError("پاسخ Bonbast JSON معتبر نبود.") from exc

        if not isinstance(payload, dict):
            raise BonbastError("ساختار پاسخ Bonbast معتبر نبود.")
        return parse_quote(payload)


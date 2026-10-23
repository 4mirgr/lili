import assert from "node:assert/strict";
import test from "node:test";
import { parseDollarAmount, parseQuote } from "../src/index.js";

test("parses a Bonbast quote", () => {
  const quote = parseQuote({
    usd1: "125,500", usd2: 124900,
    year: 2026, month: 10, day: 23,
    hour: 17, minute: 8, second: 9,
  });
  assert.deepEqual(quote, {
    sell: 125500,
    buy: 124900,
    publishedAt: "۲۰۲۶/۱۰/۲۳ - ۱۷:۰۸:۰۹",
  });
});

test("prefers Bonbast's Jalali date components", () => {
  const quote = parseQuote({
    usd1: 100, usd2: 90, last_modified: "October 23, 2026 19:51",
    year: 1405, month: 8, day: 1, hour: 23, minute: 21, second: 56,
  });
  assert.equal(quote.publishedAt, "۱۴۰۵/۰۸/۰۱ - ۲۳:۲۱:۵۶");
});

test("parses Persian and English dollar amounts", () => {
  assert.equal(parseDollarAmount("۸۰ دلار"), 80);
  assert.equal(parseDollarAmount("80 USD"), 80);
  assert.equal(parseDollarAmount("۱٬۲۵۰٫۵"), 1250.5);
  assert.equal(parseDollarAmount("قیمت ۸۰ دلار"), null);
});


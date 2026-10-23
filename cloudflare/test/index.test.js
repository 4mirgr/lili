import assert from "node:assert/strict";
import test from "node:test";
import { parseQuote } from "../src/index.js";

test("parses a Bonbast quote", () => {
  const quote = parseQuote({
    usd1: "125,500", usd2: 124900,
    year: 2026, month: 10, day: 23,
    hour: 17, minute: 8, second: 9,
  });
  assert.deepEqual(quote, {
    sell: 125500,
    buy: 124900,
    publishedAt: "2026/10/23 - 17:08:09",
  });
});

test("prefers last_modified", () => {
  assert.equal(parseQuote({ usd1: 100, usd2: 90, last_modified: "12:30" }).publishedAt, "12:30");
});


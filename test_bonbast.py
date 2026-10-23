import unittest

from bonbast import BonbastError, extract_token, parse_quote


class BonbastParserTests(unittest.TestCase):
    def test_extract_token(self):
        html = "<script>$.post('/json', {param: \"abc-123\"});</script>"
        self.assertEqual(extract_token(html), "abc-123")

    def test_parse_quote_with_components(self):
        quote = parse_quote({
            "usd1": "125,500", "usd2": 124900,
            "year": 2026, "month": 10, "day": 23,
            "hour": "17", "minute": "08", "second": "09",
        })
        self.assertEqual(quote.sell_toman, 125500)
        self.assertEqual(quote.buy_toman, 124900)
        self.assertEqual(quote.published_at, "2026/10/23 - 17:08:09")

    def test_parse_quote_prefers_last_modified(self):
        quote = parse_quote({"usd1": 100, "usd2": 90, "last_modified": "جمعه ۱ آبان - ۱۲:۳۰"})
        self.assertEqual(quote.published_at, "جمعه ۱ آبان - ۱۲:۳۰")

    def test_missing_time_is_an_error(self):
        with self.assertRaises(BonbastError):
            parse_quote({"usd1": 100, "usd2": 90})


if __name__ == "__main__":
    unittest.main()


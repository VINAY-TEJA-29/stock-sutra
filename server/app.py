import os
from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

IST = pytz.timezone("Asia/Kolkata")

# Simple in-memory cache to avoid repeated calls
CACHE = {}
CACHE_TTL = 30  # seconds


def get_cached(symbol):
    entry = CACHE.get(symbol)
    if not entry:
        return None
    data, timestamp = entry
    if (datetime.now().timestamp() - timestamp) > CACHE_TTL:
        return None
    return data


def set_cache(symbol, data):
    CACHE[symbol] = (data, datetime.now().timestamp())


@app.route("/stock/<symbol>")
def get_stock(symbol):
    try:
        symbol = symbol.upper().strip()

        # NSE default
        if "." not in symbol:
            symbol = symbol + ".NS"

        cached = get_cached(symbol)
        if cached:
            return jsonify(cached)

        ticker = yf.Ticker(symbol)
        info = ticker.fast_info or {}

        price = info.get("lastPrice")
        open_price = info.get("open")
        high = info.get("dayHigh")
        low = info.get("dayLow")
        prev_close = info.get("previousClose")
        volume = info.get("volume")

        if not price or not prev_close:
            return jsonify({"error": "Data unavailable"}), 400

        now_ist = datetime.now(IST)

        data = {
            "symbol": symbol,
            "price": round(price, 2),
            "open": round(open_price, 2) if open_price else None,
            "high": round(high, 2) if high else None,
            "low": round(low, 2) if low else None,
            "previous_close": round(prev_close, 2),
            "change": round(price - prev_close, 2),
            "change_percent": f"{round(((price - prev_close) / prev_close) * 100, 2)}%",
            "volume": int(volume) if volume else None,
            "latest_trading_day": now_ist.strftime("%d %b %Y, %I:%M %p")
        }

        set_cache(symbol, data)
        return jsonify(data)

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Could not fetch stock data"}), 500


@app.route("/")
def home():
    return "StockSutra backend running"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

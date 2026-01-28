import os
import time
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import pytz
import yfinance as yf

app = Flask(__name__)
CORS(app)

IST = pytz.timezone("Asia/Kolkata")

# ==============================
# SIMPLE IN-MEMORY CACHE
# ==============================
CACHE = {}
CACHE_TTL = 60  # seconds (1 minute)


def get_cached(symbol):
    data = CACHE.get(symbol)
    if not data:
        return None

    if time.time() - data["time"] > CACHE_TTL:
        del CACHE[symbol]
        return None

    return data["value"]


def set_cache(symbol, value):
    CACHE[symbol] = {
        "time": time.time(),
        "value": value
    }


@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        symbol = symbol.upper()

        # Force NSE format
        if not symbol.endswith(".NS"):
            return jsonify({"error": "Please use NSE format (eg: NTPC.NS)"}), 400

        # 🔹 Check cache first
        cached = get_cached(symbol)
        if cached:
            return jsonify(cached)

        stock = yf.Ticker(symbol)

        info = stock.fast_info
        hist = stock.history(period="2d")

        if hist.empty or not info:
            return jsonify({"error": "Data unavailable"}), 400

        latest = hist.iloc[-1]
        prev = hist.iloc[-2]

        data = {
            "symbol": symbol,
            "price": round(float(latest["Close"]), 2),
            "open": round(float(latest["Open"]), 2),
            "high": round(float(latest["High"]), 2),
            "low": round(float(latest["Low"]), 2),
            "previous_close": round(float(prev["Close"]), 2),
            "change": round(float(latest["Close"] - prev["Close"]), 2),
            "change_percent": f"{round(((latest['Close'] - prev['Close']) / prev['Close']) * 100, 2)}%",
            "volume": int(latest["Volume"]),
            "latest_trading_day": datetime.now(IST).strftime("%d %b %Y, %I:%M %p")
        }

        # 🔹 Save to cache
        set_cache(symbol, data)

        return jsonify(data)

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Could not fetch stock data"}), 500


# 🔍 DEBUG ENDPOINT (CACHE STATUS)
@app.route("/debug")
def debug():
    return {
        "cached_symbols": list(CACHE.keys()),
        "cache_ttl_seconds": CACHE_TTL
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

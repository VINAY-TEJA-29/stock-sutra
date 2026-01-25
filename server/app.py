import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__, static_folder="../client/build", static_url_path="/")
CORS(app)

IST = pytz.timezone("Asia/Kolkata")

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)

        info = stock.info
        fast = stock.fast_info

        # ✅ CORRECT KEYS
        price = (
            fast.get("lastPrice")
            or info.get("regularMarketPrice")
            or info.get("currentPrice")
            or info.get("previousClose")
            or 0
        )

        prev_close = (
            fast.get("previousClose")
            or info.get("previousClose")
            or price
        )

        volume = (
            fast.get("lastVolume")
            or info.get("volume")
            or 0
        )

        # ✅ SAFE MARKET TIME
        hist = stock.history(period="1d", interval="1m")

        if not hist.empty:
            last_time = hist.index[-1]
            if last_time.tzinfo is None:
                last_time = pytz.utc.localize(last_time)
            market_time = last_time.astimezone(IST)
            market_time_str = market_time.strftime("%d %b %Y, %I:%M %p")
        else:
            market_time_str = "Market Closed"

        data = {
            "symbol": symbol.upper(),
            "price": round(price, 2),
            "open": round(fast.get("open") or info.get("open", 0), 2),
            "high": round(fast.get("dayHigh") or info.get("dayHigh", 0), 2),
            "low": round(fast.get("dayLow") or info.get("dayLow", 0), 2),
            "previous_close": round(prev_close, 2),
            "change": round(price - prev_close, 2),
            "change_percent": f"{round(((price - prev_close) / prev_close) * 100, 2)}%" if prev_close else "0%",
            "volume": int(volume),
            "latest_trading_day": market_time_str
        }

        return jsonify(data)

    except Exception as e:
        print("[ERROR]", e)
        return jsonify({"error": "Failed to fetch stock data"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

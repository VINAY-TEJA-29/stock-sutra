import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__, static_folder="../client/build", static_url_path="/")
CORS(app)

IST = pytz.timezone("Asia/Kolkata")

# Serve React frontend
@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")


# Stock API endpoint
@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)

        # --- Fetch data ---
        fast = stock.fast_info
        info = stock.info

        # --- PRICE (reliable fallback chain) ---
        price = (
            fast.get("last_price")
            or info.get("regularMarketPrice")
            or info.get("currentPrice")
            or info.get("previousClose")
            or 0
        )

        # --- PREVIOUS CLOSE ---
        prev_close = (
            info.get("previousClose")
            or fast.get("previous_close")
            or price
        )

        # --- VOLUME ---
        volume = (
            fast.get("last_volume")
            or info.get("volume")
            or 0
        )

        # --- MARKET TIME (last traded candle) ---
        hist = stock.history(period="1d", interval="1m")

        if not hist.empty:
            market_time = hist.index[-1].tz_convert(IST)
            market_time_str = market_time.strftime("%d %b %Y, %I:%M %p")
            market_status = "OPEN" if market_time.hour < 15 or (market_time.hour == 15 and market_time.minute <= 30) else "CLOSED"
        else:
            market_time_str = "Market Closed"
            market_status = "CLOSED"

        # --- FINAL RESPONSE ---
        data = {
            "symbol": symbol.upper(),
            "price": round(price, 2),
            "open": round(info.get("open") or fast.get("open", 0), 2),
            "high": round(info.get("dayHigh") or fast.get("day_high", 0), 2),
            "low": round(info.get("dayLow") or fast.get("day_low", 0), 2),
            "previous_close": round(prev_close, 2),
            "change": round(price - prev_close, 2),
            "change_percent": f"{round(((price - prev_close) / prev_close) * 100, 2)}%" if prev_close else "0%",
            "volume": int(volume),
            "latest_trading_day": market_time_str,
            "market_status": market_status
        }

        return jsonify(data)

    except Exception as e:
        print("[ERROR]", e)
        return jsonify({"error": "Failed to fetch stock data"}), 500


# Render PORT binding
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

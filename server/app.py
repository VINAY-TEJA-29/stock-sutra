from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import time

app = Flask(__name__, static_folder="../client/build", static_url_path="/")
CORS(app)

# Simple cache: symbol -> (timestamp, data)
cache = {}

@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        current_time = time.time()
        # If cached within last 30 seconds
        if symbol in cache and current_time - cache[symbol][0] < 30:
            return jsonify(cache[symbol][1])

        stock = yf.Ticker(symbol)
        info = stock.info

        if info.get("regularMarketPrice") is None:
            raise ValueError("Invalid or unavailable symbol")

        data = {
            "symbol": symbol,
            "price": info.get("regularMarketPrice"),
            "open": info.get("open"),
            "high": info.get("dayHigh"),
            "low": info.get("dayLow"),
            "previous_close": info.get("previousClose"),
            "change": round(info.get("regularMarketPrice", 0) - info.get("previousClose", 0), 2),
            "change_percent": f"{round(((info.get('regularMarketPrice', 0) - info.get('previousClose', 0)) / info.get('previousClose', 1)) * 100, 2)}%",
            "volume": info.get("volume"),
            "latest_trading_day": time.strftime("%d/%m/%Y, %I:%M:%S %p")
        }

        cache[symbol] = (current_time, data)
        return jsonify(data)

    except Exception as e:
        if "Too Many Requests" in str(e):
            return jsonify({"error": "Too Many Requests. Rate limited. Try after a while."}), 429
        return jsonify({"error": str(e)}), 500

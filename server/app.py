import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
import time

app = Flask(__name__, static_folder="../client/build", static_url_path="/")
CORS(app)

# In-memory cache to reduce rate limits
cache = {}

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        current_time = time.time()
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
        return jsonify({"error": str(e)}), 500

# ✅ Fix: Bind to 0.0.0.0 and use PORT from environment
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

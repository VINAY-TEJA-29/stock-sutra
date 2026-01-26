import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY")
IST = pytz.timezone("Asia/Kolkata")


@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        if not API_KEY:
            return jsonify({"error": "API key not configured"}), 500

        symbol = symbol.upper().replace(".NS", ".BSE")

        url = "https://www.alphavantage.co/query"
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "apikey": API_KEY
        }

        res = requests.get(url, params=params, timeout=10)
        data = res.json()

        # ---- ERROR HANDLING ----
        if "Note" in data:
            return jsonify({"error": "API limit exceeded. Please wait 1 minute."}), 429

        if "Error Message" in data:
            return jsonify({"error": "Invalid stock symbol"}), 400

        if "Time Series (Daily)" not in data:
            return jsonify({"error": "Data unavailable"}), 400

        series = data["Time Series (Daily)"]
        dates = list(series.keys())

        latest = series[dates[0]]
        prev = series[dates[1]]

        price = float(latest["4. close"])
        open_price = float(latest["1. open"])
        high = float(latest["2. high"])
        low = float(latest["3. low"])
        prev_close = float(prev["4. close"])
        volume = int(latest["5. volume"])

        trade_date = datetime.strptime(dates[0], "%Y-%m-%d")
        trade_date = IST.localize(trade_date)

        return jsonify({
            "symbol": symbol.replace(".BSE", ".NS"),
            "price": round(price, 2),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "previous_close": round(prev_close, 2),
            "change": round(price - prev_close, 2),
            "change_percent": f"{round(((price - prev_close) / prev_close) * 100, 2)}%",
            "volume": volume,
            "latest_trading_day": trade_date.strftime("%d %b %Y")
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Could not fetch stock data"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

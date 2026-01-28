import os
from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

IST = pytz.timezone("Asia/Kolkata")

@app.route("/")
def home():
    return "StockSutra backend running"

# ===============================
# SUMMARY ENDPOINT (unchanged)
# ===============================
@app.route("/stock/<symbol>")
def get_stock(symbol):
    try:
        symbol = symbol.upper()
        stock = yf.Ticker(symbol)

        info = stock.fast_info
        hist = stock.history(period="2d")

        if hist.empty:
            return jsonify({"error": "Data unavailable"}), 400

        latest = hist.iloc[-1]
        prev = hist.iloc[-2]

        now_ist = datetime.now(IST)

        return jsonify({
            "symbol": symbol,
            "price": round(info.get("last_price", latest["Close"]), 2),
            "open": round(latest["Open"], 2),
            "high": round(latest["High"], 2),
            "low": round(latest["Low"], 2),
            "previous_close": round(prev["Close"], 2),
            "change": round(latest["Close"] - prev["Close"], 2),
            "change_percent": f"{round(((latest['Close'] - prev['Close']) / prev['Close']) * 100, 2)}%",
            "volume": int(latest["Volume"]) if "Volume" in latest else None,
            "latest_trading_day": now_ist.strftime("%d %b %Y, %I:%M %p")
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Could not fetch stock data"}), 500


# ===============================
# 🔥 INTRADAY CHART ENDPOINT
# ===============================
@app.route("/stock/<symbol>/chart")
def get_chart(symbol):
    try:
        symbol = symbol.upper()
        stock = yf.Ticker(symbol)

        # 1 day, 5 minute candles
        df = stock.history(period="1d", interval="5m")

        if df.empty:
            return jsonify({"error": "Chart data unavailable"}), 400

        data = []
        for index, row in df.iterrows():
            ist_time = index.tz_convert(IST)
            data.append({
                "time": ist_time.strftime("%H:%M"),
                "price": round(row["Close"], 2)
            })

        return jsonify({
            "symbol": symbol,
            "interval": "5m",
            "data": data
        })

    except Exception as e:
        print("CHART ERROR:", e)
        return jsonify({"error": "Could not fetch chart data"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

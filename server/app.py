import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

IST = pytz.timezone("Asia/Kolkata")


@app.route("/")
def home():
    return "StockSutra Backend Running"


# ============================================
# STOCK SUMMARY
# ============================================
@app.route("/stock/<symbol>")
def get_stock(symbol):
    try:
        symbol = symbol.upper()

        stock = yf.Ticker(symbol)
        hist = stock.history(period="2d")

        if hist.empty:
            return jsonify({"error": "Stock not found"}), 404

        latest = hist.iloc[-1]
        prev = hist.iloc[-2] if len(hist) >= 2 else latest

        change = latest["Close"] - prev["Close"]

        if prev["Close"] != 0:
            change_percent = (change / prev["Close"]) * 100
        else:
            change_percent = 0

        now = datetime.now(IST)

        return jsonify({
            "symbol": symbol,
            "price": round(float(latest["Close"]), 2),
            "open": round(float(latest["Open"]), 2),
            "high": round(float(latest["High"]), 2),
            "low": round(float(latest["Low"]), 2),
            "previous_close": round(float(prev["Close"]), 2),
            "change": round(float(change), 2),
            "change_percent": round(float(change_percent), 2),
            "volume": int(latest["Volume"]),
            "latest_trading_day": now.strftime("%d %b %Y, %I:%M %p")
        })

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


# ============================================
# CHART DATA
# ============================================
@app.route("/stock/<symbol>/chart")
def get_chart(symbol):

    try:

        symbol = symbol.upper()

        period = request.args.get("period", "1mo")

        interval_map = {
            "1d": "5m",
            "5d": "15m",
            "1mo": "1d",
            "3mo": "1d",
            "6mo": "1d",
            "1y": "1d",
            "5y": "1wk"
        }

        interval = interval_map.get(period, "1d")

        stock = yf.Ticker(symbol)

        df = stock.history(
            period=period,
            interval=interval
        )

        if df.empty:
            return jsonify({"error": "No chart data"}), 404

        chart = []

        for index, row in df.iterrows():

            if period in ["1d", "5d"]:

                try:
                    time = index.tz_convert(IST)
                except:
                    time = index

                label = time.strftime("%H:%M")

            else:

                label = index.strftime("%d %b")

            chart.append({
                "label": label,
                "price": round(float(row["Close"]), 2)
            })

        return jsonify({
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data": chart
        })

    except Exception as e:

        print(e)

        return jsonify({
            "error": str(e)
        }), 500


# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
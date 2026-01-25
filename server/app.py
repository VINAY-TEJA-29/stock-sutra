import os
from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

IST = pytz.timezone("Asia/Kolkata")

@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        symbol = symbol.upper().strip()
        stock = yf.Ticker(symbol)

        # 🔒 MOST STABLE yfinance call
        hist = stock.history(
            period="1d",
            interval="1d",
            auto_adjust=False,
            threads=False
        )

        if hist is None or hist.empty:
            return jsonify({"error": "No data returned from Yahoo Finance"}), 400

        # Ensure required columns exist
        required_cols = {"Open", "High", "Low", "Close", "Volume"}
        if not required_cols.issubset(hist.columns):
            return jsonify({"error": "Incomplete market data"}), 400

        row = hist.iloc[-1]

        price = float(row["Close"])
        open_price = float(row["Open"])
        high = float(row["High"])
        low = float(row["Low"])
        volume = int(row["Volume"])

        # Time handling (daily candle → date only)
        trade_date = hist.index[-1]
        if trade_date.tzinfo is None:
            trade_date = pytz.utc.localize(trade_date)
        trade_date = trade_date.astimezone(IST)

        data = {
            "symbol": symbol,
            "price": round(price, 2),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "previous_close": round(open_price, 2),
            "change": round(price - open_price, 2),
            "change_percent": f"{round(((price - open_price) / open_price) * 100, 2)}%",
            "volume": volume,
            "latest_trading_day": trade_date.strftime("%d %b %Y")
        }

        return jsonify(data)

    except Exception as e:
        # 🔍 LOG THE REAL ERROR
        print("YFINANCE ERROR:", str(e))
        return jsonify({"error": "Could not fetch stock data"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

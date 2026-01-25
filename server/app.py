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

        # ✅ MOST RELIABLE SOURCE
        hist = stock.history(period="1d")

        if hist.empty:
            return jsonify({"error": "Invalid symbol"}), 400

        last_row = hist.iloc[-1]

        price = float(last_row["Close"])
        open_price = float(last_row["Open"])
        high = float(last_row["High"])
        low = float(last_row["Low"])
        volume = int(last_row["Volume"])

        # --- TIME ---
        last_time = hist.index[-1]
        if last_time.tzinfo is None:
            last_time = pytz.utc.localize(last_time)
        market_time = last_time.astimezone(IST)

        data = {
            "symbol": symbol.upper(),
            "price": round(price, 2),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "previous_close": round(open_price, 2),
            "change": round(price - open_price, 2),
            "change_percent": f"{round(((price - open_price) / open_price) * 100, 2)}%",
            "volume": volume,
            "latest_trading_day": market_time.strftime("%d %b %Y, %I:%M %p")
        }

        return jsonify(data)

    except Exception as e:
        print("[ERROR]", e)
        return jsonify({"error": "Could not fetch stock data"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

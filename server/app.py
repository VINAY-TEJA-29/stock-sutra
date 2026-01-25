import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
from datetime import datetime, time
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

        # ----- MARKET TIME CHECK -----
        now_ist = datetime.now(IST).time()
        market_open = time(9, 15)
        market_close = time(15, 30)

        if market_open <= now_ist <= market_close:
            # 🟢 Market OPEN → intraday data
            hist = stock.history(period="1d", interval="1m")
            intraday = True
        else:
            # 🔴 Market CLOSED → daily data
            hist = stock.history(period="1d")
            intraday = False

        if hist.empty:
            return jsonify({"error": "Invalid symbol"}), 400

        last_row = hist.iloc[-1]

        price = float(last_row["Close"])
        open_price = float(last_row["Open"])
        high = float(last_row["High"])
        low = float(last_row["Low"])
        volume = int(last_row["Volume"])

        # ----- TIME HANDLING -----
        last_time = hist.index[-1]
        if last_time.tzinfo is None:
            last_time = pytz.utc.localize(last_time)
        market_time = last_time.astimezone(IST)

        if intraday:
            trading_time = market_time.strftime("%d %b %Y, %I:%M %p")
        else:
            trading_time = market_time.strftime("%d %b %Y")

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
            "latest_trading_day": trading_time
        }

        return jsonify(data)

    except Exception as e:
        print("[ERROR]", e)
        return jsonify({"error": "Could not fetch stock data"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

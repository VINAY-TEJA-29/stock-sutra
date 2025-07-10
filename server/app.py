import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
from datetime import datetime

app = Flask(__name__, static_folder="../client/build", static_url_path="/")
CORS(app)

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)

        # Try fast_info first
        info = stock.fast_info or {}

        # Fallback to info dict if fast_info is empty
        if not info.get("lastPrice"):
            info = stock.info

        # If still no data, raise an error
        if not info or not info.get("regularMarketPrice"):
            raise Exception("Data not available. Try again later.")

        data = {
            "symbol": symbol,
            "price": info.get("lastPrice") or info.get("regularMarketPrice"),
            "open": info.get("open"),
            "high": info.get("dayHigh"),
            "low": info.get("dayLow"),
            "previous_close": info.get("previousClose"),
            "change": round(
                (info.get("lastPrice") or info.get("regularMarketPrice", 0)) - info.get("previousClose", 0), 2
            ),
            "change_percent": f"{round(((info.get('lastPrice', 0) - info.get('previousClose', 0)) / info.get('previousClose', 1)) * 100, 2)}%",
            "volume": info.get("volume"),
            "latest_trading_day": datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
        }
        return jsonify(data)

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({"error": str(e)}), 500

# ✅ Required for Render deployment
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
from datetime import datetime, timedelta
import os

app = Flask(__name__, static_folder="../client/build", static_url_path="/")
CORS(app)

# Function to get current IST time
def get_ist_time():
    ist_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    return ist_time.strftime("%d/%m/%Y, %I:%M:%S %p")

# Serve the React frontend
@app.route("/stock/<symbol>")
def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info

        if not info or "regularMarketPrice" not in info:
            raise ValueError("No price info returned")

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
            "latest_trading_day": datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
        }
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

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

        info = stock.fast_info or stock.info

        if not info or not info.get("lastPrice", 0):
            raise ValueError("Invalid or unavailable symbol.")

        price = info.get("lastPrice") or info.get("regularMarketPrice")

        data = {
            "symbol": symbol,
            "price": price,
            "open": info.get("open"),
            "high": info.get("dayHigh"),
            "low": info.get("dayLow"),
            "previous_close": info.get("previousClose"),
            "change": round(price - info.get("previousClose", 0), 2),
            "change_percent": f"{round(((price - info.get('previousClose', 1)) / info.get('previousClose', 1)) * 100, 2)}%",
            "volume": info.get("volume"),
            "latest_trading_day": datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
        }

        return jsonify(data)
    
    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({"error": "Failed to fetch data. Please check the symbol or try again later."}), 500

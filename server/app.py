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
        fast_info = stock.fast_info
        data = {
            "symbol": symbol,
            "price": fast_info.get("lastPrice"),
            "open": fast_info.get("open"),
            "high": fast_info.get("dayHigh"),
            "low": fast_info.get("dayLow"),
            "previous_close": fast_info.get("previousClose"),
            "change": round(fast_info.get("lastPrice", 0) - fast_info.get("previousClose", 0), 2),
            "change_percent": f"{round(((fast_info.get('lastPrice', 0) - fast_info.get('previousClose', 0)) / fast_info.get('previousClose', 1)) * 100, 2)}%",
            "volume": fast_info.get("volume"),
            "latest_trading_day": datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

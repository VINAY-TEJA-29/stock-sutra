import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
from datetime import datetime  # ✅ FIXED: Import datetime

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

        if not fast_info:
            raise ValueError("No stock data available. Please check the symbol.")

        price = fast_info.get("lastPrice")
        previous_close = fast_info.get("previousClose", 0)

        data = {
            "symbol": symbol,
            "price": price,
            "open": fast_info.get("open"),
            "high": fast_info.get("dayHigh"),
            "low": fast_info.get("dayLow"),
            "previous_close": previous_close,
            "change": round(price - previous_close, 2) if price and previous_close else None,
            "change_percent": f"{round(((price - previous_close) / previous_close) * 100, 2)}%" if price and previous_close else "0%",
            "volume": fast_info.get("volume"),
            "latest_trading_day": datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
        }
        return jsonify(data)
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": str(e)}), 500

# ✅ Ensure it runs on Render or local
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

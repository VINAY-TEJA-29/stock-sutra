import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import pytz

app = Flask(__name__)

# Allow requests from any origin (configure more tightly in production)
CORS(app, resources={r"/*": {"origins": "*"}})

IST = pytz.timezone("Asia/Kolkata")


# ============================================
# HEALTH CHECK
# ============================================
@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "StockSutra Backend Running"})


@app.route("/health")
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now(IST).isoformat()})


# ============================================
# STOCK SUMMARY
# ============================================
@app.route("/stock/<symbol>")
def get_stock(symbol):
    try:
        symbol = symbol.upper().strip()

        stock = yf.Ticker(symbol)
        hist = stock.history(period="5d")

        if hist.empty:
            return jsonify({"error": f"No data found for symbol '{symbol}'. Please check the symbol (e.g. RELIANCE.NS, TCS.NS)."}), 404

        # Use last 2 available trading days for change calculation
        latest = hist.iloc[-1]
        prev = hist.iloc[-2] if len(hist) >= 2 else hist.iloc[-1]

        change = float(latest["Close"]) - float(prev["Close"])

        if float(prev["Close"]) != 0:
            change_percent = (change / float(prev["Close"])) * 100
        else:
            change_percent = 0.0

        now = datetime.now(IST)

        return jsonify({
            "symbol": symbol,
            "price": round(float(latest["Close"]), 2),
            "open": round(float(latest["Open"]), 2),
            "high": round(float(latest["High"]), 2),
            "low": round(float(latest["Low"]), 2),
            "previous_close": round(float(prev["Close"]), 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "volume": int(latest["Volume"]),
            "latest_trading_day": now.strftime("%d %b %Y, %I:%M %p IST")
        })

    except Exception as e:
        print(f"[ERROR] /stock/{symbol}: {e}")
        return jsonify({"error": f"Failed to fetch stock data: {str(e)}"}), 500


# ============================================
# COMPANY INFO
# ============================================
@app.route("/stock/<symbol>/info")
def get_stock_info(symbol):
    try:
        symbol = symbol.upper().strip()
        stock = yf.Ticker(symbol)
        info = stock.info

        if not info or info.get("regularMarketPrice") is None:
            return jsonify({"error": "Company info not available."}), 404

        return jsonify({
            "symbol": symbol,
            "company_name": info.get("longName", symbol),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "eps": info.get("trailingEps"),
            "dividend_yield": info.get("dividendYield"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "description": info.get("longBusinessSummary", "")[:400] + "..." if info.get("longBusinessSummary") else "N/A",
        })

    except Exception as e:
        print(f"[ERROR] /stock/{symbol}/info: {e}")
        return jsonify({"error": f"Failed to fetch company info: {str(e)}"}), 500


# ============================================
# CHART DATA
# ============================================
@app.route("/stock/<symbol>/chart")
def get_chart(symbol):
    try:
        symbol = symbol.upper().strip()

        period = request.args.get("period", "1mo")

        # Validate period
        valid_periods = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"}
        if period not in valid_periods:
            period = "1mo"

        interval_map = {
            "1d":  "5m",
            "5d":  "15m",
            "1mo": "1d",
            "3mo": "1d",
            "6mo": "1d",
            "1y":  "1wk",
            "5y":  "1mo"
        }

        interval = interval_map.get(period, "1d")

        stock = yf.Ticker(symbol)
        df = stock.history(period=period, interval=interval)

        if df.empty:
            return jsonify({"error": f"No chart data available for '{symbol}' with period '{period}'."}), 404

        chart = []
        for index, row in df.iterrows():
            try:
                if period in ["1d", "5d"]:
                    try:
                        time_ist = index.tz_convert(IST)
                    except Exception:
                        time_ist = index
                    label = time_ist.strftime("%H:%M")
                elif period in ["1mo", "3mo"]:
                    label = index.strftime("%d %b")
                elif period in ["6mo", "1y"]:
                    label = index.strftime("%b '%y")
                else:
                    label = index.strftime("%Y")

                close_price = float(row["Close"])
                if close_price > 0:
                    chart.append({
                        "label": label,
                        "price": round(close_price, 2)
                    })
            except Exception as row_err:
                print(f"[WARN] Skipping row: {row_err}")
                continue

        if not chart:
            return jsonify({"error": "No valid chart data points found."}), 404

        return jsonify({
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data": chart
        })

    except Exception as e:
        print(f"[ERROR] /stock/{symbol}/chart: {e}")
        return jsonify({"error": f"Failed to fetch chart data: {str(e)}"}), 500


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
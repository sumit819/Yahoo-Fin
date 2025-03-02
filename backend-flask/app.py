from flask import Flask, jsonify, Blueprint
from flask_cors import CORS
import yfinance as yf
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

stock_bp = Blueprint("stock", __name__)

@stock_bp.route("/")
def get_stock_data():
    """Fetch current stock info from Yahoo Finance."""
    try:
        df = get_top_50_stock_data(1)  # Get last 1-year data
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stock_bp.route("/details/<symbol>", methods=["GET"])
def get_stock_info(symbol):
    """Fetch basic stock information like Name, Symbol, Sector, Market Cap, and more."""
    try:
        stock = yf.Ticker(symbol)
        info = stock.info  # Fetch company details

        stock_data = {
            "symbol": info.get("symbol", symbol),
            "name": info.get("longName", "N/A"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "market_cap": info.get("marketCap", "N/A"),
            "previous_close": info.get("previousClose", "N/A"),
            "open": info.get("open", "N/A"),
            "day_high": info.get("dayHigh", "N/A"),
            "day_low": info.get("dayLow", "N/A"),
            "volume": info.get("volume", "N/A"),
            "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
            "52_week_low": info.get("fiftyTwoWeekLow", "N/A"),
            "dividend_yield": info.get("dividendYield", "N/A"),
            "pe_ratio": info.get("trailingPE", "N/A"),
            "eps": info.get("trailingEps", "N/A"),
            "website": info.get("website", "N/A")
        }

        return jsonify(stock_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500        

@stock_bp.route("/history/<symbol>")
def get_stock_history(symbol):
    """Fetch historical stock data (Date, Open, High, Low, Close, Volume)."""
    try:
        stock = yf.Ticker(symbol)
        history = stock.history(period="1mo")  # Fetch 1-month data
        history.reset_index(inplace=True)

        history_data = history[["Date", "Open", "High", "Low", "Close", "Volume"]].to_dict(orient="records")
        return jsonify(history_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# List of top 50 stock symbols (Example: S&P 500 large caps)
top_50_stocks = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "BRK-B", "JPM", "V",
    "JNJ", "XOM"
]

# Fetch historical data for all stocks
def get_top_50_stock_data(months=1):
    # Define date range
    end_date = pd.to_datetime("today").strftime("%Y-%m-%d")
    start_date = (pd.to_datetime("today") - pd.DateOffset(months=months)).strftime("%Y-%m-%d")

    # Download data from Yahoo Finance
    stock_data = yf.download(top_50_stocks, start=start_date, end=end_date, group_by="ticker")

    # Store in DataFrame
    stock_list = []
    for stock in top_50_stocks:
        if stock in stock_data.columns.levels[0]:  # Check if stock exists in data
            df = stock_data[stock].reset_index()
            df["Symbol"] = stock  # Add stock symbol column
            stock_list.append(df)

    # Combine all stock data
    full_stock_df = pd.concat(stock_list, ignore_index=True)

    return full_stock_df        

app.register_blueprint(stock_bp, url_prefix="/stock")

@app.route("/")
def home():
    return jsonify({"message": "Stock API is running!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)




#About project:
A Flask-based API that fetches  historical  stock market data using Yahoo Finance (yfinance) for last 1 month. This API provides stock details like Open, High, Low, Close, and Volume for a given company symbol.


#Environment setup
python -m venv venv
source venv/bin/activate  # For macOS/Linux
venv\Scripts\activate     # For Windows
set FLASK_ENV=app.py

#Install dependencies
pip install -r requirements.txt


#Start flask server..
flask run -p 5000

#Server will be accessable on :
http://127.0.0.1:5000/

#Technology user:
Flask – Python web framework
yfinance – Fetch stock market data
Pandas – Data processing
Flask-CORS – Enable cross-origin requests (if needed)



from flask import Flask
import mysql.connector
import traceback

print("1) File started")

app = Flask(__name__)

print("2) Flask app created")

try:
    db = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="root123",
        database="fintech_db"
    )
    print("3) MySQL connected successfully!")
except Exception as e:
    print("3) MySQL connection FAILED:")
    traceback.print_exc()

@app.route("/")
def home():
    return "Fintech Payment System Connected to MySQL!"

print("4) Route created")
print("5) Starting Flask server")

app.run(host="127.0.0.1", port=5000, debug=True)
"""
Flask API for demand prediction service.
This service exposes the Random Forest model to the Go Backend.
Uses real-time weather data from Open-Meteo for Coimbatore (Ettimadai).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import urllib.request
from datetime import datetime

# Ensure the models directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.demand_forecaster import DemandForecaster

app = Flask(__name__)
CORS(app)

# Initialize the ML Model (Random Forest)
model = DemandForecaster()

# Coimbatore (Ettimadai) coordinates
COIMBATORE_LAT = 10.9
COIMBATORE_LON = 76.9

# Cache weather to avoid hitting API on every request
_weather_cache = {}


def fetch_real_weather(date_str):
    """Fetch real weather for Coimbatore from Open-Meteo API"""
    if date_str in _weather_cache:
        return _weather_cache[date_str]
    
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={COIMBATORE_LAT}&longitude={COIMBATORE_LON}"
            f"&daily=temperature_2m_max,precipitation_sum,weathercode"
            f"&timezone=Asia/Kolkata"
            f"&start_date={date_str}&end_date={date_str}"
        )
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        
        daily = data.get('daily', {})
        if daily and daily.get('time'):
            temp_max = daily['temperature_2m_max'][0]
            precip = daily['precipitation_sum'][0]
            wmo_code = daily['weathercode'][0]
            
            # Convert to our weather categories
            if precip and precip > 15:
                weather = 'stormy'
            elif precip and precip > 5:
                weather = 'rainy'
            elif wmo_code and wmo_code >= 61:
                weather = 'rainy'
            elif wmo_code and wmo_code >= 51:
                weather = 'cloudy'
            elif temp_max and temp_max >= 33:
                weather = 'hot'
            elif temp_max and temp_max <= 22:
                weather = 'cold'
            else:
                weather = 'sunny'
            
            _weather_cache[date_str] = weather
            return weather
    except Exception as e:
        print(f"Weather API error: {e}")
    
    return None  # Caller should use provided weather or default


@app.route('/health', methods=['GET'])
def health():
    """Verifies that the ML Prediction service is live."""
    return jsonify({
        'status': 'OK',
        'service': 'ML Demand Forecaster',
        'college': 'Amrita Vishwa Vidyapeetham, Ettimadai',
        'model_trained': model.is_trained,
        'metrics': model.training_metrics
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Real-time Prediction Endpoint.
    Takes Meal Type, Weather, Schedule, and Day of Week as inputs.
    Returns predicted student volume (Demand).
    """
    data = request.get_json()
    
    meal_type = data.get('meal_type', 'lunch')
    weather = data.get('weather', 'sunny')
    schedule = data.get('schedule', 'regular')
    day_of_week = data.get('day_of_week', 'monday')
    
    # Execute inference
    result = model.predict(meal_type, weather, schedule, day_of_week)
    
    return jsonify({
        'success': True,
        'prediction': result
    })


@app.route('/predict/day', methods=['POST'])
def predict_day():
    """
    Predicts demand for all meals (Breakfast, Lunch, Snacks, Dinner) on a specific date.
    Uses real-time weather data from Open-Meteo for Coimbatore.
    """
    data = request.get_json()
    
    date_str = data.get('date')
    weather = data.get('weather', 'sunny')
    schedule = data.get('schedule', 'regular')
    
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d')
    except:
        date = datetime.now()
        date_str = date.strftime('%Y-%m-%d')
    
    # Try to get real weather for this date
    real_weather = fetch_real_weather(date_str)
    if real_weather:
        weather = real_weather
        print(f"Using real weather for {date_str}: {weather}")
    
    predictions = model.predict_day(date, weather, schedule)
    
    return jsonify({
        'success': True,
        'date': date.strftime('%Y-%m-%d'),
        'weather_used': weather,
        'weather_source': 'open-meteo' if real_weather else 'provided',
        'predictions': predictions
    })


@app.route('/weather', methods=['GET'])
def get_weather():
    """Get current real-time weather for Coimbatore"""
    today = datetime.now().strftime('%Y-%m-%d')
    weather = fetch_real_weather(today)
    return jsonify({
        'date': today,
        'location': 'Coimbatore, Ettimadai',
        'weather': weather or 'sunny'
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting ML Prediction API on port {port}...")
    print(f"Location: Coimbatore (Ettimadai) [{COIMBATORE_LAT}, {COIMBATORE_LON}]")
    print("Real-time weather: Open-Meteo API")
    # Run the Flask app (PORT from env for Railway, default 5001 for local dev)
    app.run(host='0.0.0.0', port=port, debug=False)

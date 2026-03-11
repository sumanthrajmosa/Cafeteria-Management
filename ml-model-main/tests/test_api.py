import pytest
from datetime import datetime
import json
import sys
import os

# Ensure the ML project root is in the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from api.predict_api import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test the /health endpoint returns correct structure and 200 OK"""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'OK'
    assert data['service'] == 'ML Demand Forecaster'
    assert 'model_trained' in data

def test_weather_endpoint(client, mocker):
    """Test the /weather endpoint returns valid weather"""
    # Mock real weather fetch to avoid failing on CI if API is down
    mocker.patch('api.predict_api.fetch_real_weather', return_value='sunny')
    
    response = client.get('/weather')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'location' in data
    assert 'weather' in data
    assert data['weather'] == 'sunny'

def test_predict_endpoint_defaults(client):
    """Test /predict endpoint with minimum payload"""
    response = client.post('/predict', json={})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'prediction' in data
    assert 'predicted_demand' in data['prediction']
    assert 'confidence' in data['prediction']

def test_predict_endpoint_custom(client):
    """Test /predict endpoint with full payload"""
    payload = {
        'meal_type': 'dinner',
        'weather': 'rainy',
        'schedule': 'exams',
        'day_of_week': 'sunday'
    }
    response = client.post('/predict', json=payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    prediction = data['prediction']
    factors = prediction['factors']
    assert factors['weather'] == 'rainy'
    assert factors['schedule'] == 'exams'

def test_predict_day_endpoint(client, mocker):
    """Test the /predict/day endpoint returns predictions for all 4 meals"""
    # Disable real weather fetch
    mocker.patch('api.predict_api.fetch_real_weather', return_value=None)
    
    payload = {
        'date': '2025-01-01',
        'weather': 'cloudy',
        'schedule': 'regular'
    }
    response = client.post('/predict/day', json=payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert data['success'] is True
    assert data['date'] == '2025-01-01'
    assert data['weather_used'] == 'cloudy'
    
    predictions = data['predictions']
    assert 'breakfast' in predictions
    assert 'lunch' in predictions
    assert 'snacks' in predictions
    assert 'dinner' in predictions

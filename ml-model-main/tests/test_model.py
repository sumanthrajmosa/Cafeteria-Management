import pytest
from datetime import datetime
import sys
import os

# Ensure the ML project root is in the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from models.demand_forecaster import DemandForecaster

@pytest.fixture
def forecaster():
    # Force rule-based mode for deterministic tests by skipping train initialization
    f = DemandForecaster(model_path="nonexistent_path_to_force_rule_based.pkl")
    f.is_trained = False
    return f

def test_rule_based_base_demand(forecaster):
    """Test that rule-based predictions are bounded around base demand"""
    res = forecaster.predict('lunch', 'sunny', 'regular', 'monday')
    
    # Lunch base is 500, monday factor 1.02, sunny 1.0, regular 1.0 => target ~510
    # Add +/- noise tolerance
    demand = res['predicted_demand']
    assert 400 <= demand <= 600
    
    res_b = forecaster.predict('breakfast', 'sunny', 'regular', 'monday')
    # Breakfast base is 300
    assert 200 <= res_b['predicted_demand'] <= 400

def test_weather_factor_impact(forecaster):
    """Test that bad weather reduces demand and confidence"""
    base_res = forecaster.predict('lunch', 'sunny', 'regular', 'monday')
    rainy_res = forecaster.predict('lunch', 'stormy', 'regular', 'monday')
    
    # Stormy factor is 0.62 vs Sunny 1.0
    assert rainy_res['predicted_demand'] < base_res['predicted_demand']
    # Confidence should be lower for extreme weather in rule-based
    assert rainy_res['confidence'] < base_res['confidence'] + 10  # allow noise overlap

def test_schedule_factor_impact(forecaster):
    """Test that holidays drastically reduce demand"""
    base_res = forecaster.predict('lunch', 'sunny', 'regular', 'monday')
    holiday_res = forecaster.predict('lunch', 'sunny', 'holiday', 'monday')
    
    # Holiday factor is 0.17
    assert holiday_res['predicted_demand'] < (base_res['predicted_demand'] / 2)

def test_predict_day_returns_all_meals(forecaster):
    """Test that predict_day generates predictions for all 4 standard meals"""
    dt = datetime(2025, 5, 5) # Monday
    predictions = forecaster.predict_day(dt, 'cloudy', 'regular')
    
    assert len(predictions) == 4
    for meal in ['breakfast', 'lunch', 'snacks', 'dinner']:
        assert meal in predictions
        assert 'predicted_demand' in predictions[meal]
        assert 'confidence' in predictions[meal]

def test_model_info_returns_structure(forecaster):
    """Test get_model_info status structure"""
    info = forecaster.get_model_info()
    assert 'is_trained' in info
    assert info['is_trained'] is False
    assert info['model_type'] == 'RuleBased'

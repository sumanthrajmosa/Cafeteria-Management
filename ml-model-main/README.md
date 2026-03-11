# 🤖 Smart Cafeteria - ML Prediction Engine

[![Python Version](https://img.shields.io/badge/python-3.9+-3776AB?style=flat&logo=python)](https://www.python.org/)
[![Library](https://img.shields.io/badge/library-Scikit--learn-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org/)
[![API](https://img.shields.io/badge/api-Flask-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)

The intelligence layer of the Smart Cafeteria system. Designed to optimize food preparation, minimize waste, and forecast student demand based on real-world contextual factors.

---

## 🧠 1. Model Architecture & Specifications

The predicting engine operates as a standalone microservice to ensure heavy computation does not block user traffic on the Go API.

- **Model Type:** Random Forest Regressor (Ensemble Learning). Joblib serialized.
- **Accuracy Grade:** **81.52%** 
- **MAE**: ~6.0 | **MAPE**: ~18.5%

### Features Used for Inference
1. **Date / Day of Week** (Captures weekend drops vs mid-week peaks).
2. **Meal Type** (Breakfast, Lunch, Snacks, Dinner).
3. **Weather & Temp** -> Live-fetched from the Open-Meteo REST API.
4. **Academic Schedule** (Exams, regular classes, holidays).

### Fallback Architecture
If the API fails to fetch live weather or confidence drops below a set threshold, the system automatically falls back to a deterministic rule-based calculation to ensure the cafeteria staff always get a number.

---

## 💻 2. Developer Documentation

### Prerequisites
- [Python](https://www.python.org/) (3.11+)

### Local Setup
```bash
# 1. Create and activate a Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the Flask Service (Starts on Port 5001)
python api/predict_api.py
```

### Continuous Integration (CI/CD)
The `.github/workflows/ci.yml` action runs:
1. `py_compile` syntax checks.
2. Verified imports test for Flask, NumPy, Pandas, and Scikit-learn.
3. Automatically builds the Docker image.

---

## 🔌 3. API Documentation

This service is primarily internal. It is meant to be called by the `Go Backend`, not directly by the Frontend or end-users.

### `POST /predict`
Predict demand for a specific, isolated meal configuration.
**Payload:**
```json
{
  "date": "2026-02-21",
  "meal_type": "lunch",
  "weather": "sunny",
  "temperature": 32.5,
  "schedule": "regular"
}
```
**Response:**
```json
{
  "predicted_demand": 285,
  "confidence": 0.87,
  "method": "ml_model",
  "weather_source": "open-meteo"
}
```

### `GET /predict/day?date=YYYY-MM-DD`
Automatically fetches the weather for the requested date and runs predictions across all 4 meal types simultaneously.
**Response:** Returns an array of predictions mapped to breakfast, lunch, snacks, and dinner.

---

## 📂 4. Project Structure (Data & Code)
```
ml-model/
├── api/
│   └── predict_api.py         # Flask REST API Controller
├── data/
│   ├── generate_dataset.py    # Synthetic + Real weather data generation engine
│   └── training_data.csv      # Historical dataset (~800+ records for Coimbatore)
└── models/
    ├── demand_forecaster.py   # SKLearn training & evaluation logic
    └── random_forest.joblib   # Serialized production model
```

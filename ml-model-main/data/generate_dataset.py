"""
Synthetic Dataset Generator for Cafeteria Demand Forecasting
Generates 1 year of realistic demand data with proper patterns and variability
"""

import csv
import random
from datetime import datetime, timedelta
import math

# Set seed for reproducibility
random.seed(42)

# Base demand by meal type (with realistic cafeteria numbers)
BASE_DEMAND = {
    'breakfast': 85,
    'lunch': 160,
    'dinner': 125
}

# Weather distribution (probability weights)
WEATHER_DISTRIBUTION = {
    'sunny': 0.45,
    'cloudy': 0.30,
    'rainy': 0.20,
    'stormy': 0.05
}

# Weather impact on demand (multipliers)
WEATHER_IMPACT = {
    'sunny': 1.08,
    'cloudy': 1.0,
    'rainy': 0.82,
    'stormy': 0.55
}

# Academic schedule patterns
SCHEDULE_IMPACT = {
    'regular': 1.0,
    'exams': 1.25,      # More students stay on campus during exams
    'holiday': 0.25,    # Very few students during holidays
    'weekend': 0.45
}

# Day of week patterns
DAY_IMPACT = {
    'monday': 0.92,     # Slower start to the week
    'tuesday': 1.0,
    'wednesday': 1.05,  # Mid-week peak
    'thursday': 1.02,
    'friday': 0.88,     # Many leave early for weekend
    'saturday': 0.42,
    'sunday': 0.38
}

# Month-based seasonal adjustments (semester patterns)
MONTH_SEASONAL = {
    1: 0.85,   # January - winter break ending
    2: 1.05,   # February - full semester
    3: 1.08,   # March - mid-semester
    4: 1.02,   # April - approaching finals
    5: 0.75,   # May - exams then summer break starts
    6: 0.40,   # June - summer break
    7: 0.35,   # July - summer break
    8: 0.70,   # August - semester starting
    9: 1.10,   # September - full semester
    10: 1.05,  # October - normal
    11: 1.02,  # November - approaching finals
    12: 0.65   # December - exams then winter break
}

# Special events that boost/reduce demand
SPECIAL_EVENTS = {
    # Format: (month, day): (impact_multiplier, event_name)
    (1, 26): (0.30, 'Republic Day Holiday'),
    (8, 15): (0.30, 'Independence Day Holiday'),
    (10, 2): (0.30, 'Gandhi Jayanti Holiday'),
    (11, 14): (1.25, 'Childrens Day - Special Menu'),
    (12, 25): (0.20, 'Christmas Holiday'),
}

# Exam periods (month, start_day, end_day)
EXAM_PERIODS = [
    (4, 20, 30),   # April end-semester exams
    (5, 1, 10),    # May exams continued
    (11, 25, 30),  # November end-semester exams
    (12, 1, 10),   # December exams continued
]

# Holiday periods (month, start_day, end_day)
HOLIDAY_PERIODS = [
    (1, 1, 5),     # New Year break
    (5, 15, 31),   # Summer break start
    (6, 1, 30),    # Full summer break
    (7, 1, 31),    # Full summer break
    (12, 20, 31),  # Winter break
]


def get_weather(date):
    """Get weather for a date with seasonal variation"""
    month = date.month
    
    # Adjust weather probabilities based on season
    if month in [6, 7, 8, 9]:  # Monsoon season
        weights = {'sunny': 0.20, 'cloudy': 0.30, 'rainy': 0.40, 'stormy': 0.10}
    elif month in [12, 1, 2]:  # Winter
        weights = {'sunny': 0.55, 'cloudy': 0.35, 'rainy': 0.08, 'stormy': 0.02}
    elif month in [4, 5]:  # Summer
        weights = {'sunny': 0.65, 'cloudy': 0.25, 'rainy': 0.08, 'stormy': 0.02}
    else:  # Default
        weights = WEATHER_DISTRIBUTION
    
    return random.choices(list(weights.keys()), weights=list(weights.values()))[0]


def get_schedule(date):
    """Determine academic schedule for a date"""
    month = date.month
    day = date.day
    weekday = date.weekday()
    
    # Weekend
    if weekday >= 5:
        return 'weekend'
    
    # Check exam periods
    for exam_month, start_day, end_day in EXAM_PERIODS:
        if month == exam_month and start_day <= day <= end_day:
            return 'exams'
    
    # Check holiday periods
    for hol_month, start_day, end_day in HOLIDAY_PERIODS:
        if month == hol_month and start_day <= day <= end_day:
            return 'holiday'
    
    return 'regular'


def add_noise(value, noise_level=0.15):
    """Add realistic random noise to a value"""
    # Use combination of uniform and gaussian noise for more realistic variation
    gaussian_noise = random.gauss(0, noise_level * 0.6)
    uniform_noise = random.uniform(-noise_level * 0.4, noise_level * 0.4)
    
    # Occasional larger deviations (unexpected events)
    if random.random() < 0.05:  # 5% chance of larger deviation
        gaussian_noise *= 2.5
    
    total_noise = gaussian_noise + uniform_noise
    return value * (1 + total_noise)


def calculate_demand(date, meal_type, weather, schedule):
    """Calculate demand with all factors and realistic noise"""
    
    base = BASE_DEMAND[meal_type]
    
    # Apply all multipliers
    weather_mult = WEATHER_IMPACT[weather]
    schedule_mult = SCHEDULE_IMPACT[schedule]
    day_mult = DAY_IMPACT[date.strftime('%A').lower()]
    month_mult = MONTH_SEASONAL[date.month]
    
    # Calculate base demand
    demand = base * weather_mult * schedule_mult * day_mult * month_mult
    
    # Check for special events
    event_key = (date.month, date.day)
    if event_key in SPECIAL_EVENTS:
        event_mult, _ = SPECIAL_EVENTS[event_key]
        demand *= event_mult
    
    # Add time-based trends (slight growth over time)
    days_from_start = (date - datetime(2024, 1, 1)).days
    trend_factor = 1 + (days_from_start / 365) * 0.03  # 3% annual growth
    demand *= trend_factor
    
    # Add noise - this is what makes accuracy realistic (not 100%)
    demand = add_noise(demand, noise_level=0.18)
    
    # Ensure minimum demand
    demand = max(5, int(round(demand)))
    
    return demand


def generate_dataset(start_date, end_date, output_file):
    """Generate the full dataset"""
    
    data = []
    current_date = start_date
    
    while current_date <= end_date:
        weather = get_weather(current_date)
        schedule = get_schedule(current_date)
        day_of_week = current_date.strftime('%A').lower()
        
        for meal_type in ['breakfast', 'lunch', 'dinner']:
            actual_demand = calculate_demand(current_date, meal_type, weather, schedule)
            
            data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'meal_type': meal_type,
                'weather': weather,
                'schedule': schedule,
                'day_of_week': day_of_week,
                'actual_demand': actual_demand
            })
        
        current_date += timedelta(days=1)
    
    # Write to CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'meal_type', 'weather', 'schedule', 'day_of_week', 'actual_demand'])
        writer.writeheader()
        writer.writerows(data)
    
    return data


def print_dataset_stats(data):
    """Print statistics about the generated dataset"""
    
    print("\n" + "="*60)
    print("SYNTHETIC DATASET STATISTICS")
    print("="*60)
    
    total_rows = len(data)
    print(f"\nTotal records: {total_rows}")
    print(f"Date range: {data[0]['date']} to {data[-1]['date']}")
    
    # Demand by meal type
    print("\n--- Average Demand by Meal Type ---")
    for meal in ['breakfast', 'lunch', 'dinner']:
        demands = [r['actual_demand'] for r in data if r['meal_type'] == meal]
        avg = sum(demands) / len(demands)
        min_d = min(demands)
        max_d = max(demands)
        print(f"{meal.capitalize():12} | Avg: {avg:6.1f} | Min: {min_d:4d} | Max: {max_d:4d}")
    
    # Demand by weather
    print("\n--- Average Demand by Weather ---")
    for weather in ['sunny', 'cloudy', 'rainy', 'stormy']:
        demands = [r['actual_demand'] for r in data if r['weather'] == weather]
        if demands:
            avg = sum(demands) / len(demands)
            count = len(demands)
            print(f"{weather.capitalize():12} | Avg: {avg:6.1f} | Days: {count//3:4d}")
    
    # Demand by schedule
    print("\n--- Average Demand by Schedule ---")
    for schedule in ['regular', 'weekend', 'exams', 'holiday']:
        demands = [r['actual_demand'] for r in data if r['schedule'] == schedule]
        if demands:
            avg = sum(demands) / len(demands)
            count = len(demands)
            print(f"{schedule.capitalize():12} | Avg: {avg:6.1f} | Days: {count//3:4d}")
    
    print("\n" + "="*60)


if __name__ == '__main__':
    import os
    
    # Generate 1 year of data (2024)
    start = datetime(2024, 1, 1)
    end = datetime(2024, 12, 31)
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'training_data.csv')
    
    print(f"Generating synthetic dataset from {start.date()} to {end.date()}...")
    data = generate_dataset(start, end, output_path)
    
    print(f"\n✅ Dataset saved to: {output_path}")
    print_dataset_stats(data)
    
    # Also keep a backup of original sample data
    print(f"\n📁 Original sample data preserved in: sample_training_data.csv")

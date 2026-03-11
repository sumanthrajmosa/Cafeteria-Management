"""
Authentic Dataset Generator for Amrita Vishwa Vidyapeetham, Ettimadai, Coimbatore
Generates realistic cafeteria demand data using REAL historical weather data.
"""

import csv
import json
import random
import math
from datetime import datetime, timedelta
import urllib.request

random.seed(42)  # Reproducibility

# ======================== COLLEGE CONFIGURATION ========================
COLLEGE = "Amrita Vishwa Vidyapeetham, Ettimadai"
TOTAL_STUDENTS = 10000
CAFETERIA_USAGE = 0.85  # 80-90% use cafeteria

# Base demand per meal (as given by user)
BASE_DEMAND = {
    'breakfast': 300,
    'lunch': 500,
    'snacks': 200,
    'dinner': 700
}

# ======================== ACADEMIC CALENDAR ========================
# Academic year: June 2025 - April 2026
ACADEMIC_START = datetime(2025, 6, 2)  # First day of classes
ACADEMIC_END = datetime(2026, 4, 15)

# Exam periods
EXAM_PERIODS = [
    # Mid-sem 1: August mid, 1 week
    (datetime(2025, 8, 11), datetime(2025, 8, 16), 'mid_sem'),
    # End-sem 1: October full month
    (datetime(2025, 10, 1), datetime(2025, 10, 25), 'end_sem'),
    # Mid-sem 2: January mid, 1 week
    (datetime(2026, 1, 12), datetime(2026, 1, 17), 'mid_sem'),
    # End-sem 2: March
    (datetime(2026, 3, 1), datetime(2026, 3, 25), 'end_sem'),
]

# Holiday periods (cafeteria still runs but with reduced occupancy)
HOLIDAY_PERIODS = [
    # After end-sem 1: 2 weeks break
    (datetime(2025, 10, 26), datetime(2025, 11, 8), 'semester_break'),
    # Diwali break: 5 days (around Oct 20-ish in 2025, Diwali was Oct 20)
    (datetime(2025, 10, 18), datetime(2025, 10, 22), 'diwali'),
    # Pongal: 1 week (Jan 13-17)
    (datetime(2026, 1, 13), datetime(2026, 1, 19), 'pongal'),
    # After end-sem 2: 2 months (April-May) - beyond our data range mostly
    (datetime(2026, 3, 26), datetime(2026, 5, 31), 'summer_break'),
]

# Food fest periods (3-4 per year, Thu-Fri-Sat, crowd decreases)
FOOD_FEST_PERIODS = [
    (datetime(2025, 7, 17), datetime(2025, 7, 19)),   # July food fest
    (datetime(2025, 9, 11), datetime(2025, 9, 13)),   # September food fest
    (datetime(2025, 12, 4), datetime(2025, 12, 6)),    # December food fest
    (datetime(2026, 2, 5), datetime(2026, 2, 7)),      # February food fest
]

# Long weekends when students go home (specific examples)
LONG_WEEKENDS = [
    (datetime(2025, 8, 14), datetime(2025, 8, 17)),   # Independence Day
    (datetime(2025, 10, 2), datetime(2025, 10, 5)),    # Gandhi Jayanti
    (datetime(2026, 1, 24), datetime(2026, 1, 26)),    # Republic Day
]

# Alternate Saturdays have classes (even weeks have class)
def is_class_saturday(date):
    """Check if this Saturday has classes (alternate Saturdays)"""
    # Week number determines if it's a class Saturday
    week_num = date.isocalendar()[1]
    return week_num % 2 == 0  # Even weeks have Saturday classes


# ======================== WEATHER DATA ========================
def fetch_weather_data():
    """Fetch real historical weather data for Coimbatore from Open-Meteo"""
    print("Fetching real weather data for Coimbatore (Ettimadai)...")
    url = (
        "https://archive-api.open-meteo.com/v1/archive?"
        "latitude=10.9&longitude=76.9"
        "&start_date=2025-06-01&end_date=2026-02-20"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode"
        "&timezone=Asia/Kolkata"
    )
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        
        weather_map = {}
        daily = data['daily']
        for i, date_str in enumerate(daily['time']):
            temp_max = daily['temperature_2m_max'][i]
            precip = daily['precipitation_sum'][i]
            wmo_code = daily['weathercode'][i]
            
            # Convert WMO weather code to our categories
            if wmo_code >= 61:  # Rain
                weather = 'rainy'
            elif wmo_code >= 51:  # Drizzle
                weather = 'cloudy'
            elif wmo_code >= 3:   # Overcast
                weather = 'cloudy'
            elif temp_max >= 33:
                weather = 'hot'
            elif temp_max <= 22:
                weather = 'cold'
            else:
                weather = 'sunny'
            
            # Refine: heavy rain
            if precip > 15:
                weather = 'stormy'
            elif precip > 5:
                weather = 'rainy'
            
            weather_map[date_str] = {
                'weather': weather,
                'temp_max': temp_max,
                'temp_min': daily['temperature_2m_min'][i],
                'precipitation': precip,
                'wmo_code': wmo_code
            }
        
        print(f"  Got weather data for {len(weather_map)} days")
        return weather_map
    except Exception as e:
        print(f"  Warning: Could not fetch weather data: {e}")
        print("  Generating weather based on Coimbatore seasonal patterns...")
        return generate_fallback_weather()


def generate_fallback_weather():
    """Generate realistic Coimbatore weather if API fails"""
    weather_map = {}
    current = datetime(2025, 6, 1)
    end = datetime(2026, 4, 15)
    
    while current <= end:
        month = current.month
        date_str = current.strftime('%Y-%m-%d')
        
        # Coimbatore seasonal patterns
        if month in [3, 4, 5]:  # Summer - hot
            weather = random.choices(['hot', 'sunny', 'cloudy'], weights=[50, 35, 15])[0]
            temp_max = random.uniform(32, 37)
        elif month in [6, 7, 8, 9]:  # Southwest monsoon - moderate rain
            weather = random.choices(['rainy', 'cloudy', 'sunny', 'stormy'], weights=[30, 35, 25, 10])[0]
            temp_max = random.uniform(27, 32)
        elif month in [10, 11]:  # Northeast monsoon - heavy rain
            weather = random.choices(['rainy', 'stormy', 'cloudy', 'sunny'], weights=[35, 15, 30, 20])[0]
            temp_max = random.uniform(26, 31)
        else:  # Dec, Jan, Feb - cool, dry
            weather = random.choices(['sunny', 'cloudy', 'cold', 'rainy'], weights=[40, 30, 20, 10])[0]
            temp_max = random.uniform(25, 31)
        
        precip = 0
        if weather == 'rainy':
            precip = random.uniform(2, 15)
        elif weather == 'stormy':
            precip = random.uniform(15, 40)
        
        weather_map[date_str] = {
            'weather': weather,
            'temp_max': temp_max,
            'temp_min': temp_max - random.uniform(8, 12),
            'precipitation': precip,
            'wmo_code': 0
        }
        current += timedelta(days=1)
    
    return weather_map


# ======================== DEMAND CALCULATION ========================
def get_schedule_type(date):
    """Determine the academic schedule for a given date"""
    # Check holidays first
    for start, end, holiday_type in HOLIDAY_PERIODS:
        if start <= date <= end:
            return 'holiday'
    
    # Check exams
    for start, end, exam_type in EXAM_PERIODS:
        if start <= date <= end:
            return 'exams'
    
    # Check if before academic start or after academic end
    if date < ACADEMIC_START or date > ACADEMIC_END:
        return 'holiday'
    
    # Weekend check
    if date.weekday() == 6:  # Sunday
        return 'weekend'
    if date.weekday() == 5:  # Saturday
        if not is_class_saturday(date):
            return 'weekend'
        return 'regular'  # Class Saturday
    
    return 'regular'


def is_food_fest(date):
    """Check if date falls during a food fest"""
    for start, end in FOOD_FEST_PERIODS:
        if start <= date <= end:
            return True
    return False


def is_long_weekend(date):
    """Check if date is part of a long weekend"""
    for start, end in LONG_WEEKENDS:
        if start <= date <= end:
            return True
    return False


def calculate_demand(date, meal_type, weather_info, schedule):
    """Calculate realistic demand based on all factors"""
    base = BASE_DEMAND[meal_type]
    
    # === SCHEDULE MULTIPLIER ===
    if schedule == 'holiday':
        # Most students go home, only ~15-20% remain
        schedule_mult = random.uniform(0.12, 0.22)
    elif schedule == 'exams':
        if meal_type == 'dinner':
            # Dinner less crowded during exams (students study in room, order outside)
            schedule_mult = random.uniform(0.70, 0.85)
        elif meal_type == 'lunch':
            # Lunch more crowded during exams (quick break between study)
            schedule_mult = random.uniform(1.05, 1.15)
        elif meal_type == 'breakfast':
            # Breakfast slightly less (students wake late after night study)
            schedule_mult = random.uniform(0.75, 0.90)
        else:  # snacks
            # Snacks increase during exams (stress eating)
            schedule_mult = random.uniform(1.10, 1.25)
    elif schedule == 'weekend':
        # Weekends: many students stay but some go home
        if is_long_weekend(date):
            schedule_mult = random.uniform(0.30, 0.45)  # Long weekend, many go home
        else:
            schedule_mult = random.uniform(0.75, 0.88)
    else:  # regular
        schedule_mult = random.uniform(0.92, 1.08)
    
    # === WEATHER MULTIPLIER ===
    weather = weather_info.get('weather', 'sunny') if weather_info else 'sunny'
    precip = weather_info.get('precipitation', 0) if weather_info else 0
    
    if weather == 'stormy' or precip > 15:
        # Heavy rain: fewer people come out
        weather_mult = random.uniform(0.55, 0.70)
    elif weather == 'rainy' or precip > 5:
        weather_mult = random.uniform(0.75, 0.88)
    elif weather == 'hot':
        if meal_type in ['lunch', 'snacks']:
            weather_mult = random.uniform(0.82, 0.92)  # Hot = less appetite for lunch
        else:
            weather_mult = random.uniform(0.90, 1.00)
    elif weather == 'cold':
        if meal_type == 'breakfast':
            weather_mult = random.uniform(0.85, 0.95)  # Cold morning = lazy
        else:
            weather_mult = random.uniform(0.95, 1.05)
    elif weather == 'cloudy':
        weather_mult = random.uniform(0.92, 1.02)
    else:  # sunny
        weather_mult = random.uniform(0.95, 1.05)
    
    # === DAY OF WEEK PATTERN ===
    dow = date.weekday()  # 0=Mon, 6=Sun
    day_factors = {
        0: 1.02,   # Monday: slightly high (fresh week)
        1: 1.00,   # Tuesday: normal
        2: 0.98,   # Wednesday: normal
        3: 1.01,   # Thursday: normal
        4: 0.95,   # Friday: some leave early
        5: 0.82,   # Saturday: significantly less
        6: 0.78,   # Sunday: even less
    }
    day_mult = day_factors.get(dow, 1.0)
    
    # === FOOD FEST EFFECT ===
    if is_food_fest(date):
        # Students prefer food fest stalls over cafeteria
        food_fest_mult = random.uniform(0.40, 0.55)
    else:
        food_fest_mult = 1.0
    
    # === TIME OF SEMESTER EFFECT ===
    # First week of semester: slightly chaotic, demand dips
    days_from_start = (date - ACADEMIC_START).days
    if 0 <= days_from_start <= 7:
        semester_start_mult = random.uniform(0.80, 0.90)
    elif 7 < days_from_start <= 14:
        semester_start_mult = random.uniform(0.90, 0.95)
    else:
        semester_start_mult = 1.0
    
    # === CALCULATE FINAL DEMAND ===
    demand = base * schedule_mult * weather_mult * day_mult * food_fest_mult * semester_start_mult
    
    # Add natural daily variance (±5%)
    noise = random.gauss(0, 0.05 * demand)
    demand += noise
    
    # Ensure reasonable bounds
    demand = max(10, int(round(demand)))
    
    return demand


# ======================== GENERATE DATASET ========================
def generate_dataset():
    """Generate the complete authentic dataset"""
    # Fetch real weather data
    weather_data = fetch_weather_data()
    
    # Also generate weather for dates not covered by API (after Feb 20, 2026)
    fallback_weather = generate_fallback_weather()
    
    # Merge: use real data where available, fallback otherwise
    for key in fallback_weather:
        if key not in weather_data:
            weather_data[key] = fallback_weather[key]
    
    # Generate data from June 1, 2025 to February 20, 2026 (real weather range)
    start_date = datetime(2025, 6, 1)
    end_date = datetime(2026, 2, 20)
    
    meal_types = ['breakfast', 'lunch', 'snacks', 'dinner']
    rows = []
    
    current = start_date
    while current <= end_date:
        date_str = current.strftime('%Y-%m-%d')
        day_name = current.strftime('%A').lower()
        schedule = get_schedule_type(current)
        weather_info = weather_data.get(date_str, {'weather': 'sunny', 'precipitation': 0})
        weather = weather_info['weather']
        
        for meal in meal_types:
            demand = calculate_demand(current, meal, weather_info, schedule)
            rows.append({
                'date': date_str,
                'meal_type': meal,
                'weather': weather,
                'schedule': schedule,
                'day_of_week': day_name,
                'actual_demand': demand
            })
        
        current += timedelta(days=1)
    
    return rows


def print_stats(rows):
    """Print dataset statistics"""
    import collections
    
    print(f"\n{'='*60}")
    print(f"  DATASET STATISTICS - {COLLEGE}")
    print(f"{'='*60}")
    print(f"  Total records: {len(rows)}")
    print(f"  Date range: {rows[0]['date']} to {rows[-1]['date']}")
    print(f"  Days covered: {len(rows) // 4}")
    
    # Per meal stats
    print(f"\n  {'Meal':<12} {'Min':>6} {'Max':>6} {'Avg':>6} {'Count':>6}")
    print(f"  {'-'*40}")
    for meal in ['breakfast', 'lunch', 'snacks', 'dinner']:
        demands = [r['actual_demand'] for r in rows if r['meal_type'] == meal]
        print(f"  {meal:<12} {min(demands):>6} {max(demands):>6} {sum(demands)//len(demands):>6} {len(demands):>6}")
    
    # Weather distribution
    print(f"\n  Weather Distribution:")
    weather_counts = collections.Counter(r['weather'] for r in rows)
    for w, count in weather_counts.most_common():
        print(f"    {w:<10}: {count//4} days ({count//4*100//(len(rows)//4)}%)")
    
    # Schedule distribution
    print(f"\n  Schedule Distribution:")
    sched_counts = collections.Counter(r['schedule'] for r in rows)
    for s, count in sched_counts.most_common():
        print(f"    {s:<10}: {count//4} days")
    
    print(f"{'='*60}")


def main():
    print(f"Generating authentic dataset for {COLLEGE}")
    print(f"Using REAL weather data from Open-Meteo API\n")
    
    rows = generate_dataset()
    print_stats(rows)
    
    # Write CSV
    output_path = 'data/training_data.csv'
    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'meal_type', 'weather', 'schedule', 'day_of_week', 'actual_demand'])
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✓ Dataset saved to {output_path}")
    print(f"  {len(rows)} records generated")


if __name__ == '__main__':
    main()

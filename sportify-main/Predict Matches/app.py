from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import os

# Define constants
MODEL_FILE = 'barca_prediction_model.joblib'
DATA_FILE = 'FCB_Football_Matches.xlsx'
STATS_TO_TRACK = ['Barca_Goals', 'Barca_Possession%', 'Barca_xG', 'Barca_Shots']

# Initialize FastAPI app
app = FastAPI(title="FC Barcelona Match Predictor API", version="1.0")

# Load model and data globally so it only runs once at startup
if not os.path.exists(MODEL_FILE):
    raise RuntimeError(f"Model file '{MODEL_FILE}' not found. Please train the model first.")

if not os.path.exists(DATA_FILE):
    raise RuntimeError(f"Data file '{DATA_FILE}' not found. Required for calculating current form.")

model = joblib.load(MODEL_FILE)

# Load data to get the current form (last 3 matches)
df = pd.read_excel(DATA_FILE)
df['Date'] = pd.to_datetime(df['Date'])
df = df.sort_values('Date').reset_index(drop=True)
current_form = df[STATS_TO_TRACK].tail(3).mean()

# Define the expected JSON payload schema
class MatchInput(BaseModel):
    home_team: str
    away_team: str
    referee_name: str = "Other"

@app.post("/predict")
def predict_match(match: MatchInput):
    try:
        # Determine venue and opponent based on Barcelona's position
        if match.home_team.lower() in ['barcelona', 'barca', 'fc barcelona']:
            venue = 'Home'
            opponent = match.away_team
        else:
            venue = 'Away'
            opponent = match.home_team

        # Prepare the input dictionary
        input_dict = {
            'Venue': [venue],
            'Opponent': [opponent],
            'Referee': [match.referee_name]
        }

        # Add the rolling average stats
        for stat in STATS_TO_TRACK:
            input_dict[f'{stat}_Last3'] = [current_form[stat]]

        # Convert to DataFrame
        input_data = pd.DataFrame(input_dict)

        # Make predictions
        prediction_code = model.predict(input_data)[0]
        probabilities = model.predict_proba(input_data)[0]

        # Map predictions back to letters
        reverse_label_map = {0: 'L', 1: 'D', 2: 'W', 'L': 'L', 'D': 'D', 'W': 'W'}
        final_prediction = reverse_label_map[prediction_code]

        # Format probabilities
        classes = model.classes_
        prob_dict = {reverse_label_map[classes[i]]: round(probabilities[i] * 100, 1) for i in range(len(classes))}

        # Return the response as JSON
        return {
            "match": f"{match.home_team} vs {match.away_team}",
            "referee": match.referee_name,
            "prediction": final_prediction,
            "probabilities": prob_dict
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
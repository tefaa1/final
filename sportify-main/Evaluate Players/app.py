from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import uvicorn

# --- 1. Setup & Configuration ---
app = FastAPI(title="Football Player Rating API", version="1.0")

MODEL_FILE = 'player_evaluation_model.joblib'
DATA_FILE = 'Football_Players_Data.csv'

model = None
df_raw = None

# Define features exactly as they were during training
categorical_features = ['Position', 'Nationality']
numeric_features = [
    'Age', 'Matches', 'Minutes', 'Goals', 'Assists', 'xG', 'xA', 'Shots',
    'Shots_on_Target', 'Pass_Accuracy%', 'Key_Passes', 'Dribbles_Success%',
    'Tackles_Won%', 'Aerial_Won%', 'Interceptions', 'Distance_km/game',
    'Sprint_Speed_km/h', 'Yellow_Cards', 'Red_Cards',
    'Goals_p90', 'Assists_p90', 'xG_p90', 'xA_p90', 'Shots_p90',
    'SoT_p90', 'KeyPasses_p90', 'Shot_Accuracy', 'xG_Overperform',
    'GoalContrib_p90', 'Defensive_Score', 'Physical_Score',
    'Aerial_Sq', 'Aerial_x_Minutes', 'Discipline'
]

# Feature Engineering Logic 
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Replicates the feature engineering used during model training."""
    df  = df.copy()
    eps = 0.001
    m90 = df['Minutes'] / 90 + eps               

    df['Goals_p90']       = df['Goals']           / m90
    df['Assists_p90']     = df['Assists']         / m90
    df['xG_p90']          = df['xG']              / m90
    df['xA_p90']          = df['xA']              / m90
    df['Shots_p90']       = df['Shots']           / m90
    df['SoT_p90']         = df['Shots_on_Target'] / m90
    df['KeyPasses_p90']   = df['Key_Passes']      / m90

    df['Shot_Accuracy']   = df['Shots_on_Target'] / (df['Shots'] + eps)
    df['xG_Overperform']  = df['Goals'] - df['xG']          
    df['GoalContrib_p90'] = (df['Goals'] + df['Assists']) / m90
    df['Defensive_Score'] = (df['Tackles_Won%'] + df['Aerial_Won%'] + df['Interceptions']) / 3
    df['Physical_Score']  = df['Distance_km/game'] * df['Sprint_Speed_km/h']
    df['Aerial_Sq']       = df['Aerial_Won%'] ** 2
    df['Aerial_x_Minutes']= df['Aerial_Won%'] * (df['Minutes'] / 100)
    df['Discipline']      = -(df['Yellow_Cards'] + df['Red_Cards'] * 3)

    return df

# Startup Event (Load Model & Data) 
@app.on_event("startup")
def load_assets():
    global model, df_raw
    if not os.path.exists(MODEL_FILE):
        raise RuntimeError(f"Model file {MODEL_FILE} not found!")
    if not os.path.exists(DATA_FILE):
        raise RuntimeError(f"Data file {DATA_FILE} not found!")
        
    model = joblib.load(MODEL_FILE)
    df_raw = pd.read_csv(DATA_FILE)
    print("Model and Data loaded successfully!")

# API Endpoints 

@app.get("/")
def home():
    return {"message": "Welcome to the Football Player Rating API. Go to /docs for testing."}

@app.get("/predict/{player_name}")
def predict_by_name(player_name: str):
    """Predicts a player's rating by pulling their stats from the dataset."""
    match = df_raw[df_raw['Name'].str.lower() == player_name.lower()]
    
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found.")

    player_row = match.iloc[[0]]
    player_eng = engineer_features(player_row)
    
    # We only pass the features the model was trained on
    input_features = ['Position', 'Nationality'] + [
        'Age', 'Matches', 'Minutes', 'Goals', 'Assists', 'xG', 'xA', 'Shots',
        'Shots_on_Target', 'Pass_Accuracy%', 'Key_Passes', 'Dribbles_Success%',
        'Tackles_Won%', 'Aerial_Won%', 'Interceptions', 'Distance_km/game',
        'Sprint_Speed_km/h', 'Yellow_Cards', 'Red_Cards'
    ]
    
    input_data = player_eng[categorical_features + numeric_features]
    predicted = model.predict(input_data)[0]
    
    # Safely get real rating if it exists
    real_rating = player_row['Overall_Rating'].values[0] if 'Overall_Rating' in player_row else None

    return {
        "Name": player_row['Name'].values[0],
        "Position": player_row['Position'].values[0],
        "Predicted_Rating": round(float(predicted), 1),
        "Real_Rating_in_Data": round(float(real_rating), 1) if real_rating else "N/A"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
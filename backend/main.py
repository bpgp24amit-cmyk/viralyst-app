from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
import io

app = FastAPI()

# Enable CORS so Frontend (Port 5173) can talk to Backend (Port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace * with your specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_persona_description(stats):
    """Converts cluster statistics into a human-readable prompt."""
    desc = []
    for key, value in stats.items():
        if isinstance(value, (int, float)):
            desc.append(f"Average {key}: {round(value, 2)}")
        else:
            desc.append(f"Most common {key}: {value}")
    return ", ".join(desc)

@app.post("/analyze-segments")
async def analyze_segments(file: UploadFile = File(...)):
    try:
        # 1. Read Excel File
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="Excel file is empty")

        # 2. Preprocessing
        # Create a copy for training so we don't mess up the original readable data
        training_data = df.copy()
        
        # Handle Categorical Data (Text -> Numbers)
        le = LabelEncoder()
        for col in training_data.select_dtypes(include='object').columns:
            training_data[col] = le.fit_transform(training_data[col].astype(str))
            
        # Handle Missing Values (Fill with 0 for simplicity)
        training_data = training_data.fillna(0)

        # Scale Data (Normalize range)
        scaler = StandardScaler()
        numeric_cols = training_data.select_dtypes(include=['float64', 'int64']).columns
        if len(numeric_cols) == 0:
             raise HTTPException(status_code=400, detail="No numeric data found to cluster")
             
        scaled_features = scaler.fit_transform(training_data[numeric_cols])

        # 3. K-Means Clustering (Defaulting to 3 Personas)
        n_clusters = min(3, len(df)) # Don't create more clusters than rows
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(scaled_features)
        
        df['Cluster'] = clusters
        
        # 4. Generate Persona Profiles
        personas = []
        for i in range(n_clusters):
            segment = df[df['Cluster'] == i]
            
            # Calculate logic for the Prompt
            numeric_means = segment.select_dtypes(include=['float64', 'int64']).mean().to_dict()
            if 'Cluster' in numeric_means: del numeric_means['Cluster']
            
            categorical_modes = {}
            for col in segment.select_dtypes(include='object').columns:
                if not segment[col].empty:
                    categorical_modes[col] = segment[col].mode()[0]
                
            stats = {**numeric_means, **categorical_modes}
            description = generate_persona_description(stats)
            
            personas.append({
                "id": i,
                "name": f"Persona Segment {i+1}",
                "description": description,
                "size": len(segment),
                "pct": round((len(segment) / len(df)) * 100)
            })

        return {"success": True, "personas": personas}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

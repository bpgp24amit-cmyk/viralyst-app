from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
import io
import json # Ensure this is imported if needed elsewhere, otherwise it can be removed

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
    # CRITICAL: Restart the Python server if you change this file.
    
    try:
        # 1. Read Excel
        contents = await file.read()
        
        if not contents:
            raise ValueError("File is empty.")

        # Use io.BytesIO to wrap the content for Pandas to read from memory
        df = pd.read_excel(io.BytesIO(contents))
        
        if df.empty:
            raise ValueError("Excel file read successfully, but it contains no rows/data.")

    except ValueError as e:
        # Catch common issues like empty file or improper format
        raise HTTPException(
            status_code=400, 
            detail=f"Clustering failed: Load failed. Check if it's a valid .xlsx file. Details: {e}"
        )
        
    except Exception as e:
        # Catch any other Python runtime errors during file loading
        print(f"Server Error during file processing: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during clustering. Please check server console."
        )

    # --- 2. PREPROCESSING AND CLUSTERING LOGIC (Correctly Indented) ---
    try:
        training_data = df.copy()
        
        # Auto-encode categorical columns (like 'Gender' or 'Location')
        le = LabelEncoder()
        for col in training_data.select_dtypes(include='object').columns:
            training_data[col] = le.fit_transform(training_data[col].astype(str))
            
        # Handle Missing Values (Fill with 0 for simplicity)
        training_data = training_data.fillna(0)

        # Scale Data (Normalize range)
        scaler = StandardScaler()
        numeric_cols = training_data.select_dtypes(include=['float64', 'int64']).columns
        
        if len(numeric_cols) == 0:
            raise HTTPException(status_code=400, detail="No numeric data found to cluster. Check your spreadsheet.")
            
        scaled_features = scaler.fit_transform(training_data[numeric_cols])

        # 3. K-Means Clustering (Defaulting to 3 Personas)
        # Ensure we don't try to create more clusters than available data points
        n_clusters = min(3, len(df)) 
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
                # Calculate percentage, ensuring len(df) is not zero
                "pct": round((len(segment) / len(df)) * 100) if len(df) > 0 else 0
            })

        return {"success": True, "personas": personas}

    except HTTPException as e:
        # Re-raise explicit HTTP exceptions
        raise e
        
    except Exception as e:
        # Catch any clustering/math errors and return 500
        print(f"Clustering Runtime Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Clustering failed due to a runtime error (math/data issue). Details: {e}"
        )

# --- END OF ANALYZE_SEGMENTS ---


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

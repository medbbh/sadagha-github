from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Recommendation Service",
    description="A microservice for handling recommendations with Arabic text support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint returning service information"""
    return {
        "message": "Recommendation Service is running",
        "service": "recommendation_service", 
        "version": "1.0.0",
        "arabic_support": "✅ يدعم النصوص العربية",
        "features": [
            "Personalized recommendations",
            "Similar campaigns",
            "Arabic text support",
            "Real-time data from Supabase"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Include recommendation routes
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.recommendations import router as recommendations_router
app.include_router(recommendations_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
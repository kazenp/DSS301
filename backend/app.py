import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routes import predict, orders, drones, admin

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Drone Delivery Decision Support System (DSS) and Machine Learning (ML) predictions.",
    version="1.0.0"
)

# Set up CORS middleware to allow connection from frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(predict.router, prefix=settings.API_V1_STR + "/predict", tags=["Prediction"])
app.include_router(orders.router, prefix=settings.API_V1_STR + "/orders", tags=["Orders"])
app.include_router(drones.router, prefix=settings.API_V1_STR + "/drones", tags=["Drones"])
app.include_router(admin.router, prefix=settings.API_V1_STR + "/admin", tags=["Admin"])

@app.get("/", tags=["General"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "status": "online",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from api import models as models_api, upload, ar
from core.config import MODEL_STORAGE, QR_STORAGE
from core.database import Base, engine
import models as db_models
import os
import time
from sqlalchemy.exc import OperationalError

app = FastAPI(title="MXLab Testing API")

# Allow all origins with credentials using regex
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure database tables exist with retry logic
MAX_RETRIES = 10
RETRY_DELAY = 2

for i in range(MAX_RETRIES):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database connected and tables created.")
        break
    except OperationalError as e:
        if i == MAX_RETRIES - 1:
            print(f"Could not connect to database after {MAX_RETRIES} attempts.")
            raise e
        print(f"Database not ready, retrying in {RETRY_DELAY} seconds... ({i+1}/{MAX_RETRIES})")
        time.sleep(RETRY_DELAY)

app.include_router(models_api.router, prefix="/models", tags=["models"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(ar.router, prefix="/ar", tags=["ar"])

os.makedirs(MODEL_STORAGE, exist_ok=True)
os.makedirs(QR_STORAGE, exist_ok=True)

app.mount("/models/files", StaticFiles(directory=MODEL_STORAGE), name="models")
app.mount("/qrcodes", StaticFiles(directory=QR_STORAGE), name="qrcodes")
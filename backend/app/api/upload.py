from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from crud import models as crud_models
from core.database import get_db
import os
import shutil
from core.config import MODEL_STORAGE
from api.utils import sanitize_filename

router = APIRouter()


@router.post("/model")
def upload_model(
    name: str,  # Model name like "Vanne De Regulation"
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a 3D model file (.glb) and associate it with an existing model.
    
    Args:
        name: The model name (e.g., "Vanne De Regulation")
        file: The .glb file to upload
        
    Returns:
        The model file URL
    """
    os.makedirs(MODEL_STORAGE, exist_ok=True)
    safe_filename = sanitize_filename(file.filename)
    file_path = os.path.join(MODEL_STORAGE, safe_filename)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    return {
        "filename": safe_filename,
        "url": f"/models/files/{safe_filename}",
        "model_file_url": f"/models/files/{safe_filename}"
    }

@router.post("/asset")
def upload_asset(file: UploadFile = File(...)):
    """
    Generic upload for assets (images, videos, PDFs) that doesn't create a ModelDB entry.
    Returns the URL of the uploaded file.
    """
    os.makedirs(MODEL_STORAGE, exist_ok=True)
    safe_filename = sanitize_filename(file.filename)
    file_path = os.path.join(MODEL_STORAGE, safe_filename)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    return {
        "filename": safe_filename,
        "url": f"/models/files/{safe_filename}",
        "model_file_url": f"/models/files/{safe_filename}"
    }
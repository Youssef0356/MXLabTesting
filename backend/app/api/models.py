from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from crud import models as crud_models
from core.database import get_db
from schemas import ModelResponse, ModelCreate
import json

router = APIRouter()


@router.get("/", response_model=list[dict])
def list_models(db: Session = Depends(get_db)):
    models = crud_models.get_models(db)
    result = []
    for m in models:
        result.append({
            "id": m.name,
            "modelFileUrl": m.model_file_url,
            "description": json.loads(m.description_json) if m.description_json else [],
            "video": m.video,
            "datasheetUrl": m.datasheet_url,
            "buttons": json.loads(m.buttons_json) if m.buttons_json else [],
            "parts": json.loads(m.parts_json) if m.parts_json else []
        })
    return result


@router.get("/{name}", response_model=dict)
def get_model(name: str, db: Session = Depends(get_db)):
    model = crud_models.get_model(db, name)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return {
        "id": model.name,
        "modelFileUrl": model.model_file_url,
        "description": json.loads(model.description_json) if model.description_json else [],
        "video": model.video,
        "datasheetUrl": model.datasheet_url,
        "buttons": json.loads(model.buttons_json) if model.buttons_json else [],
        "parts": json.loads(model.parts_json) if model.parts_json else []
    }


@router.post("/", response_model=dict)
def create_model_hierarchy(model: ModelCreate, db: Session = Depends(get_db)):
    """
    Create a new model hierarchy.
    Accepts a recursive JSON structure.
    """
    created = crud_models.create_model(db, model)
    return {
        "id": created.name,
        "modelFileUrl": created.model_file_url,
        "description": json.loads(created.description_json) if created.description_json else [],
        "video": created.video,
        "datasheetUrl": created.datasheet_url,
        "buttons": json.loads(created.buttons_json) if created.buttons_json else [],
        "parts": json.loads(created.parts_json) if created.parts_json else []
    }


@router.put("/{name}", response_model=dict)
def update_model_hierarchy(name: str, model: ModelCreate, db: Session = Depends(get_db)):
    """
    Update an existing model hierarchy.
    Accepts the same structure as create but updates an existing model.
    """
    existing = crud_models.get_model(db, name)
    if not existing:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Update all fields
    existing.name = model.id
    existing.model_file_url = model.modelFileUrl
    existing.description_json = json.dumps([d.dict() for d in model.description]) if model.description else None
    # Handle video path - ensure it has the correct prefix
    if model.video and not model.video.startswith("/models/files/") and not model.video.startswith("http"):
        existing.video = f"/models/files/{model.video}"
    else:
        existing.video = model.video
    existing.datasheet_url = model.datasheetUrl
    existing.buttons_json = json.dumps([b.dict() for b in model.buttons]) if model.buttons else None
    existing.parts_json = json.dumps([p.dict() for p in model.parts]) if model.parts else None
    
    db.commit()
    db.refresh(existing)
    
    return {
        "id": existing.name,
        "modelFileUrl": existing.model_file_url,
        "description": json.loads(existing.description_json) if existing.description_json else [],
        "video": existing.video,
        "datasheetUrl": existing.datasheet_url,
        "buttons": json.loads(existing.buttons_json) if existing.buttons_json else [],
        "parts": json.loads(existing.parts_json) if existing.parts_json else []
    }
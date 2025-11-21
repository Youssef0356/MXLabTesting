import json
import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from core.config import QR_STORAGE
from core.database import get_db
from crud import ar_equipments as crud_ar
from schemas import AREquipmentCreate, AREquipmentResponse

router = APIRouter()


@router.post("/equipments/", response_model=AREquipmentResponse)
def create_ar_equipment(
    payload: AREquipmentCreate,
    db: Session = Depends(get_db),
) -> AREquipmentResponse:
    existing = crud_ar.get_ar_equipment_by_tag(db, payload.tag)
    if existing:
        raise HTTPException(status_code=400, detail="AR equipment with this tag already exists")

    db_obj = crud_ar.create_ar_equipment(db, payload)
    return AREquipmentResponse(
        name=db_obj.name,
        tag=db_obj.tag,
        qr_image_url=db_obj.qr_image_url,
        created_at=db_obj.created_at
    )


@router.get("/equipments/", response_model=list[AREquipmentResponse])
def list_ar_equipments(
    db: Session = Depends(get_db),
) -> list[AREquipmentResponse]:
    db_objs = crud_ar.get_all_ar_equipments(db)
    return [AREquipmentResponse(
        name=obj.name,
        tag=obj.tag,
        qr_image_url=obj.qr_image_url,
        created_at=obj.created_at
    ) for obj in db_objs]


@router.get("/equipments/{tag}")
def get_ar_equipment(
    tag: str,
    db: Session = Depends(get_db),
):
    """
    Get AR equipment with FULL model hierarchy and resolved URLs.
    This returns everything Unity needs in a single call.
    """
    from crud import models as crud_models
    from api.utils import model_db_to_dict, resolve_model_urls
    
    # Get AR equipment
    db_obj = crud_ar.get_ar_equipment_by_tag(db, tag)
    if not db_obj:
        raise HTTPException(status_code=404, detail="AR equipment not found")
    
    # Get the associated model
    model = crud_models.get_model(db, db_obj.name)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Convert model to dict with parsed JSON fields
    model_data = model_db_to_dict(model)
    
    # Resolve all URLs (button images, etc.)
    resolve_model_urls(model_data)
    
    # Return complete response
    return {
        "tag": db_obj.tag,
        "qr_image_url": db_obj.qr_image_url,
        "created_at": db_obj.created_at,
        "model": model_data
    }


@router.put("/equipments/{tag}", response_model=AREquipmentResponse)
def update_ar_equipment(
    tag: str,
    payload: AREquipmentCreate,
    db: Session = Depends(get_db),
) -> AREquipmentResponse:
    """
    Update an existing AR equipment's name and tag.
    """
    existing = crud_ar.get_ar_equipment_by_tag(db, tag)
    if not existing:
        raise HTTPException(status_code=404, detail="AR equipment not found")
    
    existing.name = payload.name
    existing.tag = payload.tag
    
    db.commit()
    db.refresh(existing)
    
    return AREquipmentResponse(
        name=existing.name,
        tag=existing.tag,
        qr_image_url=existing.qr_image_url,
        created_at=existing.created_at
    )


@router.post("/equipments/{tag}/qr-image", response_model=AREquipmentResponse)
def upload_qr_image(
    tag: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> AREquipmentResponse:
    db_obj = crud_ar.get_ar_equipment_by_tag(db, tag)
    if not db_obj:
        raise HTTPException(status_code=404, detail="AR equipment not found")

    os.makedirs(QR_STORAGE, exist_ok=True)

    filename = f"{tag}_{file.filename}"
    file_path = os.path.join(QR_STORAGE, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_obj.qr_image_url = f"/qrcodes/{filename}"
    db.commit()
    db.refresh(db_obj)

    return AREquipmentResponse(
        name=db_obj.name,
        tag=db_obj.tag,
        qr_image_url=db_obj.qr_image_url,
        created_at=db_obj.created_at
    )

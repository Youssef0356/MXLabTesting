from sqlalchemy.orm import Session
from models import ModelDB, AREquipmentDB
from schemas import ModelCreate, AREquipmentCreate
import json

def create_model(db: Session, model: ModelCreate):
    # Convert Pydantic model to dict and serialize JSON fields
    db_model = ModelDB(
        name=model.id,
        model_file_url=model.modelFileUrl,
        description_json=json.dumps([d.dict() for d in model.description]) if model.description else None,
        video=model.video,
        datasheet_url=model.datasheetUrl,
        buttons_json=json.dumps([b.dict() for b in model.buttons]) if model.buttons else None,
        parts_json=json.dumps([p.dict() for p in model.parts]) if model.parts else None
    )
    
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

def get_models(db: Session):
    return db.query(ModelDB).all()

def get_model(db: Session, name: str):
    return db.query(ModelDB).filter(ModelDB.name == name).first()

def get_model_by_tag(db: Session, tag: str):
    return db.query(ModelDB).filter(ModelDB.tag == tag).first()

def create_ar_equipment(db: Session, equipment: AREquipmentCreate):
    db_equipment = AREquipmentDB(
        name=equipment.name,
        tag=equipment.tag
    )
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

def get_ar_equipment_by_tag(db: Session, tag: str):
    return db.query(AREquipmentDB).filter(AREquipmentDB.tag == tag).first()

from sqlalchemy.orm import Session
from models import AREquipmentDB
from schemas import AREquipmentCreate

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

def get_all_ar_equipments(db: Session):
    return db.query(AREquipmentDB).all()

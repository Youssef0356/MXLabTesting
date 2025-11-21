from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from core.database import Base


class ModelDB(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)  # Like "Vanne De Regulation"
    model_file_url = Column(String, nullable=True)  # URL to .glb file: /models/files/xxx.glb
    description_json = Column(String, nullable=True)  # JSON array of {key, value}
    video = Column(String, nullable=True)  # Just filename
    datasheet_url = Column(String, nullable=True)
    buttons_json = Column(String, nullable=True)  # JSON array of buttons
    parts_json = Column(String, nullable=True)  # JSON array of child parts
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)



class AREquipmentDB(Base):
    __tablename__ = "ar_equipments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # References ModelDB.name
    tag = Column(String, nullable=False, unique=True, index=True)
    qr_image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

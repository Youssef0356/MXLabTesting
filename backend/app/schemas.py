from datetime import datetime

from pydantic import BaseModel


class DescriptionItem(BaseModel):
    key: str
    value: str


class ARButton(BaseModel):
    id: str
    imageFileName: str


class ModelBase(BaseModel):
    id: str  # This is like "Positionneur electropneumatique"
    modelFileUrl: str | None = None  # URL to the .glb file
    description: list[DescriptionItem] = []
    video: str | None = None
    datasheetUrl: str | None = None
    buttons: list[ARButton] = []


class ModelCreate(ModelBase):
    parts: list['ModelCreate'] = []


class ModelResponse(ModelBase):
    parts: list['ModelResponse'] = []

    class Config:
        from_attributes = True


# Resolve forward reference for recursive model
ModelResponse.update_forward_refs()
ModelCreate.update_forward_refs()


class AREquipmentBase(BaseModel):
    name: str
    tag: str


class AREquipmentCreate(AREquipmentBase):
    pass


class AREquipmentResponse(AREquipmentBase):
    qr_image_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AREquipmentFullResponse(BaseModel):
    """
    Full AR Equipment response including complete model hierarchy.
    This is returned by GET /ar/equipments/{tag}
    """
    tag: str
    qr_image_url: str | None = None
    created_at: datetime
    model: dict  # Complete model structure with resolved URLs

    class Config:
        from_attributes = True

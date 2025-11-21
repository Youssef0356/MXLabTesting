from pydantic import BaseModel
from datetime import datetime
from typing import Optional
class ModelBase(BaseModel):
    name :str 
    filename:str
    url:str
    version: int = 1
class ModelCreate(ModelBase):
    pass

class ModelResponse(ModelBase):
    id:int
    uploaded_at:datetime
    class Config:
        orm_mode = True

from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DestinationCreate(BaseModel):
    name: str
    country: str
    description: Optional[str] = None


class DestinationResponse(DestinationCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: str
    password: str


class ItineraryCreate(BaseModel):
    title: str
    destination_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[int] = None


class ItineraryResponse(ItineraryCreate):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

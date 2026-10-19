
from database import Base, engine
import models
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from database import test_connection, get_db
from sqlalchemy.orm import Session
from schemas import (
    DestinationCreate,
    DestinationResponse,
    UserCreate,
    UserResponse,
    UserLogin,
    ItineraryCreate,
    ItineraryResponse,
)
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
import jwt
import os
from datetime import date, datetime, timedelta, timezone
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()

app = FastAPI(title="TravelPlanner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://travel-planner-one-wine.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class AIItineraryRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    departure_city: str = Field(min_length=2, max_length=120)
    departure_date: date
    return_date: date
    budget: float = Field(gt=0, le=100000000)
    travelers: int = Field(ge=1, le=50)
    interests: list[str] = Field(min_length=1, max_length=10)
password_hash = PasswordHash.recommended()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://travel-planner-one-wine.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "TravelPlanner Backend is running!"}


@app.get("/health/db")
def database_health():
    try:
        result = test_connection()
        return {
            "database": "connected",
            "test_result": result,
        }
    except Exception as error:
        return {
            "database": "disconnected",
            "error": str(error),
        }


@app.post(
    "/destinations",
    response_model=DestinationResponse,
)
def create_destination(
    destination: DestinationCreate,
    db: Session = Depends(get_db),
):
    new_destination = models.Destination(
        name=destination.name,
        country=destination.country,
        description=destination.description,
    )

    db.add(new_destination)
    db.commit()
    db.refresh(new_destination)

    return new_destination


@app.get(
    "/destinations",
    response_model=list[DestinationResponse],
)
def get_destinations(db: Session = Depends(get_db)):
    return db.query(models.Destination).all()


@app.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=password_hash.hash(user.password),
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    return new_user


@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

    if not existing_user or not password_hash.verify(
        user.password,
        existing_user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    secret = os.getenv("JWT_SECRET")

    if not secret:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not configured",
        )

    token = jwt.encode(
        {
            "sub": str(existing_user.id),
            "exp": datetime.now(timezone.utc)
            + timedelta(hours=2),
        },
        secret,
        algorithm="HS256",
    )

    # Return the token and user details to the frontend
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
        },
    }


def get_current_user(
    authorization: str = Header(...),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization.split(" ", 1)[1]
    secret = os.getenv("JWT_SECRET")

    if not secret:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not configured",
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
        )
        return int(payload["sub"])
    except (
        jwt.InvalidTokenError,
        ValueError,
        KeyError,
        TypeError,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


@app.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }


@app.post(
    "/itineraries",
    response_model=ItineraryResponse,
    status_code=201,
)
def create_itinerary(
    itinerary: ItineraryCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    destination = (
        db.query(models.Destination)
        .filter(
            models.Destination.id == itinerary.destination_id
        )
        .first()
    )

    if not destination:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    if (
        itinerary.start_date
        and itinerary.end_date
        and itinerary.end_date < itinerary.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date",
        )

    new_itinerary = models.Itinerary(
        title=itinerary.title,
        destination_id=itinerary.destination_id,
        start_date=itinerary.start_date,
        end_date=itinerary.end_date,
        budget=itinerary.budget,
        user_id=user_id,
    )

    db.add(new_itinerary)
    db.commit()
    db.refresh(new_itinerary)

    return new_itinerary

@app.post("/ai/itinerary")
def generate_ai_itinerary(request: AIItineraryRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured",
        )

    if request.return_date < request.departure_date:
        raise HTTPException(
            status_code=400,
            detail="Return date cannot be before departure date",
        )

    duration = (
        request.return_date - request.departure_date
    ).days + 1

    if duration > 31:
        raise HTTPException(
            status_code=400,
            detail="Trips longer than 31 days are not supported yet",
        )

    interests = ", ".join(request.interests)

    prompt = f"""
You are the AI travel planning assistant for Voyagea.

Create a practical, personalized trip itinerary using these details.

Destination: {request.destination}
Departure city: {request.departure_city}
Departure date: {request.departure_date}
Return date: {request.return_date}
Trip duration: {duration} calendar days
Total budget: {request.budget} USD
Travelers: {request.travelers}
Interests: {interests}

Requirements:
1. Create one itinerary entry for every calendar day of the trip.
2. Include morning, afternoon, and evening activities for each day.
3. Match the activities to the destination and selected interests.
4. Provide a realistic estimated budget breakdown in USD.
5. Include transport, accommodation, food, activities, and miscellaneous
   costs when relevant.
6. Keep the total estimated budget within the user's budget where practical.
7. Do not claim that flights, hotels, tickets, or reservations are booked.
8. Do not invent live prices, real-time availability, or weather information.
9. If exact costs are unknown, clearly label amounts as estimates.
10. If you are uncertain about a local attraction, avoid inventing details.

11. Include recommended areas to stay in the destination, with reasons
    such as transport access, sightseeing convenience, and budget.

12. Suggest 2-3 hotel or accommodation options for each major city or
    overnight stop. Include the property name only when reasonably
    confident it is a real property. Otherwise suggest a suitable area
    and accommodation type, and clearly label it as a suggestion.

13. For each accommodation suggestion, include:
    - name
    - area
    - accommodation_type
    - why_recommended
    - estimated_price_per_night
    - price_currency
    - booking_url

14. Never invent current prices, ratings, room availability, or booking
    URLs. If these cannot be verified, use null and label the suggestion
    as unverified. Clearly distinguish estimates from live prices.

15. Recommend 3-5 local special foods or dishes for the destination.
    Explain briefly what each dish is and where or in which type of
    local area it is commonly found. Mention dietary considerations
    where relevant.

16. Suggest local restaurants only when reasonably confident they exist.
    Do not invent restaurant addresses, current opening hours, ratings,
    or menu prices.

17. Include practical activities and experiences each day, with
    sightseeing, local culture, food experiences, and optional activities
    that match the user's interests and budget.

18. Return the accommodation and local food suggestions as structured
    JSON fields so the frontend can render them separately.

Return valid JSON only, using exactly this structure:
{{
  "destination": "{request.destination}",
  "duration_days": {duration},
  "summary": "A short overview of the trip",

  "accommodation_suggestions": [
    {{
      "destination_area": "City or destination area",
      "name": null,
      "area": "Recommended neighborhood",
      "accommodation_type": "Hotel, hostel, or guesthouse",
      "why_recommended": "Why this area or accommodation is suitable",
      "estimated_price_per_night": null,
      "price_currency": "USD",
      "booking_url": null,
      "verified_live_data": false
    }}
  ],

  "local_food_recommendations": [
    {{
      "dish": "Local food name",
      "description": "What the dish is",
      "where_to_try": "Recommended area or type of restaurant",
      "dietary_notes": "Relevant dietary information"
    }}
  ],

  "days": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity"
    }}
  ],

  "budget_breakdown": [
    {{
      "category": "Food",
      "estimated_cost": 100,
      "notes": "Short explanation"
    }}
  ],

  "estimated_total": 0,
  "estimated_per_person": 0,
  "disclaimer": "All prices are estimates, not live quotes. Accommodation prices, availability, ratings, and booking links are not verified live."
}}

Use exactly {duration} day entries.
All budget amounts must be numeric USD values.
Recommend relevant local dishes and practical accommodation areas.
Do not invent hotel names, current prices, ratings, availability, or booking URLs.
If a hotel name or booking URL cannot be provided confidently, use null.
Set verified_live_data to false unless the information has actually been verified using a live source.
Treat accommodation prices as estimates, not confirmed quotes.
"""
       
    try:
        print("AI itinerary request received", flush=True)

        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty response",
            )

        result = json.loads(response.text)

        return {
            "message": "AI itinerary generated successfully",
            "itinerary": result,
        }
    
    except HTTPException:
        raise

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid itinerary format. Please try again.",
        )

    except Exception as error:
        print(
            f"Gemini itinerary error: {type(error).__name__}: {error}",
            flush=True,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Gemini error type: {type(error).__name__}",
        )


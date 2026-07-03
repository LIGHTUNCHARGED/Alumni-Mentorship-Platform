from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, mentors, bookings, forum, dashboard

app = FastAPI(
    title="NALUM Alumni Mentorship API",
    description="A simplified API for NALUM Alumni Mentorship recruitment task.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For simplified recruitment task, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(mentors.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(forum.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to the NALUM Alumni Mentorship API. Go to /docs for interactive Swagger API documentation."}

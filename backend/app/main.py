import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, mentors, bookings, forum, dashboard, admin, users

app = FastAPI(
    title="NALUM Alumni Mentorship API",
    description="A simplified API for NALUM Alumni Mentorship recruitment task.",
    version="1.1.0"
)

cors_origins_str = os.environ.get("CORS_ORIGINS", "*")
if cors_origins_str == "*":
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(mentors.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(forum.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to the NALUM Alumni Mentorship API. Go to /docs for interactive Swagger API documentation."}

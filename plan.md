# NALUM Alumni Mentorship Platform — 3-Day Implementation Plan

> **Context**: Junior Developer Recruitment Task  
> **Tech Stack**: HTML / Tailwind CSS / Vanilla JS · Python / FastAPI · SQLite / SQLAlchemy  
> **Timeline**: 3 days  
> **Deployment**: GitHub Pages (frontend) + Render (backend)

---

## Table of Contents

1. [Scope & Simplifications](#1-scope--simplifications)
2. [Architecture](#2-architecture)
3. [Data Models (ERD & SQLAlchemy)](#3-data-models-erd--sqlalchemy)
4. [API Endpoints](#4-api-endpoints)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [3-Day Implementation Schedule](#6-3-day-implementation-schedule)
7. [Deployment](#7-deployment)
8. [Component & File Structure](#8-component--file-structure)

---

## 1. Scope & Simplifications

### Core Features (must-have)

| Feature | What to Build |
|---------|---------------|
| **Mentor Profiles** | Display name, domain, experience, bio, availability. Search/filter by domain & experience. |
| **Booking Requests** | Students send requests (name, date/time, topic, message). Mentors accept or decline. |
| **Discussion Forum** | Create posts, reply (single-level threading), upvote. Search by keyword. |
| **Dashboard** | Mentors: pending requests + upcoming sessions. Students: sent requests + forum activity. |

### What's Cut (vs. the full 9-week plan)

| Removed | Reason |
|---------|--------|
| Role-based JWT auth (3 roles) | Simplified to 2 roles (Student / Alumni) with basic JWT |
| Admin panel & moderation | Not a core feature for the demo |
| Email / SMTP notifications | Replaced with in-app notifications only |
| Alembic migrations | Use `Base.metadata.create_all()` — sufficient for a demo |
| Availability slots model | Simplify to a text field on the mentor profile |
| Downvotes | Upvote-only (simpler, still demonstrates the concept) |
| Nested reply threading | Single-level replies (replies to posts, not replies-to-replies) |
| CI/CD pipeline | Manual deploy is fine for a recruitment task |
| Refresh tokens | Single JWT with reasonable expiry (24h) |
| Advanced security (CSP, rate limiting) | Basic auth + CORS is sufficient |
| Markdown in forum posts | Plain text only |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│                   BROWSER                            │
│                                                      │
│  index.html   mentors.html   forum.html   dashboard  │
│      │             │             │           │       │
│      └─────────────┴─────────────┴───────────┘       │
│                        │                             │
│               ┌────────▼────────┐                    │
│               │     api.js      │                    │
│               │ (fetch wrapper) │                    │
│               └────────┬────────┘                    │
└────────────────────────┼─────────────────────────────┘
                         │  HTTPS + JSON
                         ▼
┌────────────────────────────────────────────────────────┐
│              FastAPI Backend (Render)                   │
│                                                        │
│   ┌──────────┐  ┌─────────────────────────────────┐   │
│   │ JWT Auth │  │         API Routers             │   │
│   │ Middleware│──▶  /auth  /mentors  /bookings    │   │
│   └──────────┘  │  /forum  /dashboard             │   │
│                 └──────────────┬───────────────────┘   │
│                                │                       │
│                    ┌───────────▼──────────┐            │
│                    │   SQLAlchemy ORM     │            │
│                    └───────────┬──────────┘            │
│                                │                       │
│                    ┌───────────▼──────────┐            │
│                    │     SQLite (.db)     │            │
│                    └─────────────────────-┘            │
└────────────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Why |
|----------|-----|
| No frontend build step | Tailwind via CDN, vanilla JS — zero tooling |
| SQLite + `create_all()` | No migration tool needed, DB resets cleanly |
| JWT in localStorage | Simpler than httpOnly cookies for a demo (avoids CORS cookie issues) |
| Single-level replies | Avoids recursive queries; still shows threading concept |
| 2 roles only | Student + Alumni — keeps auth logic minimal |

---

## 3. Data Models (ERD & SQLAlchemy)

### 3.1 Entity-Relationship Diagram

```
┌──────────────────┐
│      User        │
│──────────────────│
│ id (PK)          │
│ email (unique)   │        1:1 (optional)
│ password_hash    │───────────────────┐
│ full_name        │                   │
│ role (enum:      │          ┌────────▼─────────┐
│   student/alumni)│          │  MentorProfile   │
│ created_at       │          │──────────────────│
└──────┬───────────┘          │ id (PK)          │
       │                      │ user_id (FK,uniq)│
       │                      │ domain           │
       │                      │ years_experience │
       │                      │ bio (max 200w)   │
       │                      │ availability     │
       │                      │   (text, e.g.    │
       │                      │   "Mon-Fri 9-5") │
       │                      │ tags (text, CSV) │
       │                      └──────────────────┘
       │
       │ 1:N (as student)        1:N (as mentor)
       ├─────────────────┬──────────────┐
       │        ┌────────▼──────────────▼──┐
       │        │    BookingRequest         │
       │        │──────────────────────────│
       │        │ id (PK)                   │
       │        │ student_id (FK→User)      │
       │        │ mentor_id (FK→User)       │
       │        │ preferred_datetime        │
       │        │ topic                     │
       │        │ message                   │
       │        │ status (enum: pending/    │
       │        │   accepted/declined)      │
       │        │ created_at                │
       │        └───────────────────────────┘
       │
       │ 1:N
       ├──────────────┐
       │     ┌────────▼────────────┐
       │     │    ForumPost        │
       │     │─────────────────────│
       │     │ id (PK)             │
       │     │ author_id (FK→User) │
       │     │ title               │
       │     │ body                │
       │     │ upvotes (int)       │
       │     │ created_at          │
       │     └──────┬──────────────┘
       │            │ 1:N
       │     ┌──────▼──────────────┐
       │     │   ForumReply        │
       │     │─────────────────────│
       │     │ id (PK)             │
       │     │ post_id (FK→Post)   │
       │     │ author_id (FK→User) │
       │     │ body                │
       │     │ upvotes (int)       │
       │     │ created_at          │
       │     └─────────────────────┘
       │
       │ 1:N (upvote tracking)
       └──────────────┐
              ┌───────▼──────────────┐
              │      Upvote          │
              │──────────────────────│
              │ id (PK)              │
              │ user_id (FK→User)    │
              │ target_type (enum:   │
              │   post / reply)      │
              │ target_id            │
              │ (unique: user_id +   │
              │  target_type +       │
              │  target_id)          │
              └──────────────────────┘
```

> **5 tables total**: User, MentorProfile, BookingRequest, ForumPost, ForumReply, Upvote (6 including Upvote tracking).

### 3.2 SQLAlchemy Models

```python
# app/models.py  — all models in a single file for simplicity
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Enum, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


# ── Enums ──────────────────────────────────────────────

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ALUMNI = "alumni"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class TargetType(str, enum.Enum):
    POST = "post"
    REPLY = "reply"


# ── User ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name     = Column(String(150), nullable=False)
    role          = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    created_at    = Column(DateTime, default=datetime.utcnow)

    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)
    bookings_as_student = relationship(
        "BookingRequest", foreign_keys="BookingRequest.student_id", back_populates="student"
    )
    bookings_as_mentor = relationship(
        "BookingRequest", foreign_keys="BookingRequest.mentor_id", back_populates="mentor"
    )
    posts   = relationship("ForumPost", back_populates="author")
    replies = relationship("ForumReply", back_populates="author")


# ── Mentor Profile ─────────────────────────────────────

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    domain           = Column(String(100), nullable=False)
    years_experience = Column(Integer, nullable=False)
    bio              = Column(Text, nullable=False)         # max 200 words (validated in schema)
    availability     = Column(String(200), nullable=True)   # free-text, e.g. "Mon-Fri, 6-9 PM IST"
    tags             = Column(String(500), nullable=True)   # comma-separated, e.g. "Python,ML,Resume"
    created_at       = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="mentor_profile")


# ── Booking Request ────────────────────────────────────

class BookingRequest(Base):
    __tablename__ = "booking_requests"

    id                 = Column(Integer, primary_key=True, index=True)
    student_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    preferred_datetime = Column(String(50), nullable=False)   # ISO string for simplicity
    topic              = Column(String(200), nullable=False)
    message            = Column(Text, nullable=True)
    status             = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    created_at         = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id], back_populates="bookings_as_student")
    mentor  = relationship("User", foreign_keys=[mentor_id], back_populates="bookings_as_mentor")


# ── Forum ──────────────────────────────────────────────

class ForumPost(Base):
    __tablename__ = "forum_posts"

    id         = Column(Integer, primary_key=True, index=True)
    author_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    title      = Column(String(200), nullable=False)
    body       = Column(Text, nullable=False)
    upvotes    = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    author  = relationship("User", back_populates="posts")
    replies = relationship("ForumReply", back_populates="post", cascade="all, delete-orphan")


class ForumReply(Base):
    __tablename__ = "forum_replies"

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    author_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    body       = Column(Text, nullable=False)
    upvotes    = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    post   = relationship("ForumPost", back_populates="replies")
    author = relationship("User", back_populates="replies")


# ── Upvote (prevents double-voting) ───────────────────

class Upvote(Base):
    __tablename__ = "upvotes"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(Enum(TargetType), nullable=False)
    target_id   = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_user_vote"),
    )
```

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base

DATABASE_URL = "sqlite:///./mentorconnect.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 4. API Endpoints

### 4.1 Auth (`/api/auth`) — 3 endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Register (email, password, full_name, role) | No |
| `POST` | `/api/auth/login` | Login → returns JWT | No |
| `GET`  | `/api/auth/me` | Get current user from token | Yes |

### 4.2 Mentors (`/api/mentors`) — 4 endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`    | `/api/mentors` | List mentors (with `?q=`, `?domain=`, `?min_exp=`) | No |
| `GET`    | `/api/mentors/{id}` | Get single mentor profile | No |
| `POST`   | `/api/mentors/profile` | Create profile (alumni only) | Yes |
| `PUT`    | `/api/mentors/profile` | Update own profile | Yes |

**Query params for `GET /api/mentors`:**

| Param | Example | Notes |
|-------|---------|-------|
| `q` | `"machine learning"` | Searches name, bio, domain, tags |
| `domain` | `"Computer Science"` | Exact match |
| `min_exp` | `3` | Minimum years |
| `page` | `1` | Pagination (10 per page) |

### 4.3 Bookings (`/api/bookings`) — 4 endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST`  | `/api/bookings` | Student creates a request | Yes (student) |
| `GET`   | `/api/bookings` | List own bookings (both roles) | Yes |
| `PATCH` | `/api/bookings/{id}/accept` | Mentor accepts | Yes (mentor) |
| `PATCH` | `/api/bookings/{id}/decline` | Mentor declines | Yes (mentor) |

### 4.4 Forum (`/api/forum`) — 5 endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`   | `/api/forum/posts` | List posts (`?q=`, `?sort=recent|popular`) | No |
| `GET`   | `/api/forum/posts/{id}` | Get post + its replies | No |
| `POST`  | `/api/forum/posts` | Create a post | Yes |
| `POST`  | `/api/forum/posts/{id}/replies` | Reply to a post | Yes |
| `POST`  | `/api/forum/upvote` | Toggle upvote `{target_type, target_id}` | Yes |

### 4.5 Dashboard (`/api/dashboard`) — 1 endpoint

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/dashboard` | Returns role-appropriate summary | Yes |

**Response shape:**
```json
// Alumni
{
  "role": "alumni",
  "pending_bookings": [ ... ],
  "accepted_bookings": [ ... ],
  "my_posts": [ ... ]
}
// Student
{
  "role": "student",
  "my_bookings": [ ... ],
  "my_posts": [ ... ],
  "my_replies": [ ... ]
}
```

### Total: ~17 endpoints (vs. 35+ in the full plan)

---

## 5. Data Flow Diagrams

### 5.1 Login

```
Browser                    FastAPI                  SQLite
   │                          │                        │
   │  POST /api/auth/login    │                        │
   │  {email, password}       │                        │
   │─────────────────────────▶│                        │
   │                          │  SELECT * FROM users   │
   │                          │  WHERE email = ?       │
   │                          │───────────────────────▶│
   │                          │  user row              │
   │                          │◀───────────────────────│
   │                          │                        │
   │                          │  bcrypt.verify(password)
   │                          │  jwt.encode({sub: id,  │
   │                          │    role: "student"})   │
   │                          │                        │
   │  {access_token, user}    │                        │
   │◀─────────────────────────│                        │
   │                          │                        │
   │  localStorage.setItem(   │                        │
   │    "token", token)       │                        │
```

### 5.2 Mentor Search

```
Browser                    FastAPI                  SQLite
   │                          │                        │
   │  GET /api/mentors        │                        │
   │  ?q=ML&domain=CS         │                        │
   │  &min_exp=2&page=1       │                        │
   │─────────────────────────▶│                        │
   │                          │  query = select(       │
   │                          │    MentorProfile)      │
   │                          │    .join(User)         │
   │                          │                        │
   │                          │  if domain:            │
   │                          │    .filter(domain==?)  │
   │                          │  if min_exp:           │
   │                          │    .filter(exp >= ?)   │
   │                          │  if q:                 │
   │                          │    .filter(LIKE %q%)   │
   │                          │                        │
   │                          │  execute query         │
   │                          │───────────────────────▶│
   │                          │  results               │
   │                          │◀───────────────────────│
   │                          │                        │
   │  {mentors: [...],        │                        │
   │   total: 24, page: 1}   │                        │
   │◀─────────────────────────│                        │
   │                          │                        │
   │  render mentor cards     │                        │
```

### 5.3 Booking Request

```
Student                    FastAPI                  SQLite
   │                          │                        │
   │  POST /api/bookings      │                        │
   │  Authorization: Bearer   │                        │
   │  {mentor_id, datetime,   │                        │
   │   topic, message}        │                        │
   │─────────────────────────▶│                        │
   │                          │  verify JWT            │
   │                          │  check mentor exists   │
   │                          │───────────────────────▶│
   │                          │  ✓                     │
   │                          │◀───────────────────────│
   │                          │                        │
   │                          │  INSERT booking        │
   │                          │  (status = PENDING)    │
   │                          │───────────────────────▶│
   │                          │                        │
   │  201 {booking}           │                        │
   │◀─────────────────────────│                        │
   │                          │                        │

          ─── Later, mentor views dashboard ───

Mentor                     FastAPI                  SQLite
   │                          │                        │
   │  PATCH /bookings/5/accept│                        │
   │─────────────────────────▶│                        │
   │                          │  UPDATE status =       │
   │                          │    ACCEPTED            │
   │                          │  WHERE id=5 AND        │
   │                          │    mentor_id=current   │
   │                          │───────────────────────▶│
   │                          │                        │
   │  200 {booking}           │                        │
   │◀─────────────────────────│                        │
```

### 5.4 Forum Post + Reply + Upvote

```
User                       FastAPI                  SQLite
   │                          │                        │
   │  POST /api/forum/posts   │                        │
   │  {title, body}           │                        │
   │─────────────────────────▶│                        │
   │                          │  INSERT forum_post     │
   │                          │───────────────────────▶│
   │  201 {post}              │                        │
   │◀─────────────────────────│                        │
   │                          │                        │
   │  POST /forum/posts/3/    │                        │
   │  replies  {body}         │                        │
   │─────────────────────────▶│                        │
   │                          │  INSERT forum_reply    │
   │                          │  (post_id = 3)         │
   │                          │───────────────────────▶│
   │  201 {reply}             │                        │
   │◀─────────────────────────│                        │
   │                          │                        │
   │  POST /api/forum/upvote  │                        │
   │  {target_type: "post",   │                        │
   │   target_id: 3}          │                        │
   │─────────────────────────▶│                        │
   │                          │  Check if upvote       │
   │                          │  exists for this user  │
   │                          │───────────────────────▶│
   │                          │                        │
   │                          │  If exists → DELETE    │
   │                          │    (toggle off)        │
   │                          │  If not → INSERT       │
   │                          │    (toggle on)         │
   │                          │  UPDATE upvotes count  │
   │                          │───────────────────────▶│
   │                          │                        │
   │  200 {upvoted: true,     │                        │
   │       upvotes: 5}        │                        │
   │◀─────────────────────────│                        │
```

---

## 6. 3-Day Implementation Schedule

### Day 1 — Backend Foundation + Auth + Mentors

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 2h | **Project setup** | FastAPI app, SQLAlchemy engine, `models.py`, `database.py`, CORS config, `.env` with `SECRET_KEY` |
| Morning | 1.5h | **Auth endpoints** | `POST /register`, `POST /login`, `GET /me`. Password hashing with `passlib[bcrypt]`, JWT with `python-jose`. Pydantic schemas for request/response validation. |
| Afternoon | 2h | **Mentor CRUD** | `GET /mentors` (with `q`, `domain`, `min_exp` filters + pagination), `GET /mentors/{id}`, `POST /mentors/profile`, `PUT /mentors/profile`. Dynamic SQLAlchemy query builder for search. |
| Evening | 1.5h | **Booking endpoints** | `POST /bookings`, `GET /bookings`, `PATCH /bookings/{id}/accept`, `PATCH /bookings/{id}/decline`. Auth guards (student-only create, mentor-only accept/decline). |
| Evening | 0.5h | **Seed data script** | `seed.py` — create 3-4 sample mentors, 2 students, a few bookings for demo. |

**Day 1 check**: All backend endpoints work via FastAPI Swagger UI (`/docs`).

---

### Day 2 — Forum Backend + Full Frontend

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 1.5h | **Forum endpoints** | `GET /posts`, `GET /posts/{id}`, `POST /posts`, `POST /posts/{id}/replies`, `POST /upvote`. Upvote toggle logic. Search + sort (recent/popular). |
| Morning | 1h | **Dashboard endpoint** | `GET /dashboard` — role-conditional query returning bookings + posts for the current user. |
| Afternoon | 1h | **Frontend: shared layer** | `api.js` (fetch wrapper with token injection), `utils.js` (date formatting, toast, debounce), base HTML template with Tailwind CDN, navbar component. |
| Afternoon | 1.5h | **Frontend: Auth + Landing** | `index.html` (landing page with hero section), `login.html`, `register.html`. Form submission, token storage, redirect logic. |
| Evening | 2h | **Frontend: Mentors** | `mentors.html` — search bar, domain dropdown, experience filter, mentor card grid, pagination. `mentor-detail.html` — full profile view + booking request modal. |
| Evening | 0.5h | **Test integration** | Verify: register → login → browse mentors → book a session. |

**Day 2 check**: Auth flow and mentor browsing + booking work end-to-end in the browser.

---

### Day 3 — Forum Frontend + Dashboard + Deploy

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 1.5h | **Frontend: Forum** | `forum.html` — post list with search + sort toggle (recent/popular). Create post form. `forum-post.html` — single post with reply list, reply form, upvote buttons. |
| Morning | 1.5h | **Frontend: Dashboard** | `dashboard.html` — tab or section layout. Mentor view: pending requests with accept/decline buttons, accepted sessions list. Student view: sent requests with status badges, recent forum activity. |
| Afternoon | 1h | **UI polish** | Responsive layout check, loading states, error messages, empty states ("No mentors found"), consistent spacing/colors. |
| Afternoon | 1h | **Deploy backend (Render)** | Push backend to GitHub. Create Render Web Service. Set env vars (`SECRET_KEY`, `CORS_ORIGINS`). Verify `/docs` is live. |
| Evening | 0.5h | **Deploy frontend (GitHub Pages)** | Update `API_BASE_URL` in `api.js`. Push to GitHub. Enable Pages. Test cross-origin requests. |
| Evening | 0.5h | **Final smoke test** | Full flow on live URLs: register → login → search mentor → book → forum post → dashboard. |

**Day 3 check**: Both frontend and backend are live and all 4 features work.

---

### Daily Summary

```
Day 1                    Day 2                    Day 3
─────────────────       ─────────────────       ─────────────────
 FastAPI setup           Forum backend           Forum frontend
 Auth (register/login)   Dashboard endpoint      Dashboard frontend
 Mentor CRUD + search    Frontend shared layer   UI polish
 Booking endpoints       Auth + Landing pages    Deploy to Render
 Seed data               Mentor pages + booking  Deploy to GitHub Pages
                                                 Final testing
─────────────────       ─────────────────       ─────────────────
 ~7.5 hrs                ~7.5 hrs                ~6 hrs
```

---

## 7. Deployment

### 7.1 Production Layout

```
┌────────────────────┐         ┌─────────────────────┐
│  GitHub Pages      │  HTTPS  │   Render (Free)     │
│  (Static Frontend) │────────▶│   (FastAPI + SQLite) │
│                    │         │                     │
│  HTML / CSS / JS   │  CORS   │   uvicorn           │
│  Tailwind CDN      │◀────────│   /api/*            │
│                    │         │   /docs (Swagger)   │
└────────────────────┘         └─────────────────────┘
```

### 7.2 Backend on Render

**Start command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Environment variables:**
```
SECRET_KEY=<random-256-bit-string>
CORS_ORIGINS=https://<username>.github.io
```

> ⚠️ **SQLite on Render free tier**: The DB file is ephemeral (lost on redeploy). For a recruitment demo this is acceptable — just re-run the seed script after each deploy. For persistence, use Render's free PostgreSQL.

### 7.3 Frontend on GitHub Pages

Update one line in `api.js`:
```javascript
const API_BASE = "https://your-app.onrender.com";
```

Enable Pages: repo Settings → Pages → Source: `main` / `root`.

### 7.4 CORS Setup

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db

app = FastAPI(title="NALUM Mentorship API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://<username>.github.io",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()
```

---

## 8. Component & File Structure

### Frontend

```
frontend/
├── index.html              ← Landing page
├── login.html              ← Login form
├── register.html           ← Registration form
├── mentors.html            ← Mentor search + list
├── mentor-detail.html      ← Single mentor + booking modal
├── forum.html              ← Post list + create
├── forum-post.html         ← Post detail + replies
├── dashboard.html          ← Role-based dashboard
│
├── css/
│   └── styles.css          ← Custom styles (Tailwind via CDN)
│
├── js/
│   ├── api.js              ← fetch wrapper, token management
│   ├── auth.js             ← login, register, logout
│   ├── mentors.js          ← search, filter, render cards
│   ├── mentor-detail.js    ← profile view, booking form
│   ├── forum.js            ← post list, create post
│   ├── forum-post.js       ← replies, upvoting
│   ├── dashboard.js        ← tabbed dashboard
│   └── utils.js            ← date format, toast, debounce
│
└── assets/
    └── logo.svg
```

### Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py             ← FastAPI app, CORS, startup
│   ├── database.py         ← Engine, SessionLocal, init_db
│   ├── models.py           ← All SQLAlchemy models (single file)
│   ├── schemas.py          ← All Pydantic schemas (single file)
│   ├── auth.py             ← JWT helpers, get_current_user dependency
│   │
│   └── routers/
│       ├── __init__.py
│       ├── auth.py         ← /api/auth/*
│       ├── mentors.py      ← /api/mentors/*
│       ├── bookings.py     ← /api/bookings/*
│       ├── forum.py        ← /api/forum/*
│       └── dashboard.py    ← /api/dashboard
│
├── seed.py                 ← Populate demo data
├── requirements.txt
├── .env
└── .gitignore
```

### Dependencies (`requirements.txt`)

```
fastapi
uvicorn[standard]
sqlalchemy
pydantic
python-jose[cryptography]
passlib[bcrypt]
python-multipart
python-dotenv
```

---

> **Total effort**: ~21 hours across 3 days  
> **Result**: A fully functional mentorship platform with 4 core features, deployed on free infrastructure, demonstrating CRUD, auth, search/filter, and forum capabilities.

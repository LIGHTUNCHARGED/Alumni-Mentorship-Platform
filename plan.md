# NALUM Alumni Mentorship Platform — 4-Day Implementation Plan

> **Context**: Junior Developer Recruitment Task  
> **Tech Stack**: HTML / Tailwind CSS / Vanilla JS · Python / FastAPI · SQLite / SQLAlchemy  
> **Timeline**: 4 days  
> **Deployment**: GitHub Pages (frontend) + Render (backend)

---

## Table of Contents

1. [Scope & Simplifications](#1-scope--simplifications)
2. [Architecture](#2-architecture)
3. [Data Models (ERD & SQLAlchemy)](#3-data-models-erd--sqlalchemy)
4. [API Endpoints](#4-api-endpoints)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [4-Day Implementation Schedule](#6-4-day-implementation-schedule)
7. [Deployment](#7-deployment)
8. [Component & File Structure](#8-component--file-structure)

---

## 1. Scope & Features

### Core Features (must-have)

| Feature | What to Build |
|---------|---------------|
| **Mentor Profiles** | Display name, domain, experience, bio, availability. Search/filter by domain & experience. |
| **Booking Requests** | Students send requests (name, date/time, topic, message). Mentors accept or decline. |
| **Discussion Forum** | Create posts, nested reply threading (replies-to-replies via `parent_id`), upvote. Search by keyword. |
| **Dashboard** | Mentors: pending requests + upcoming sessions. Students: sent requests + forum activity. |
| **3-Role JWT Auth** | Three roles: `Student`, `Alumni` (mentor), and `Admin`. Role embedded in JWT payload and enforced via `require_role()` dependency. |
| **Admin Panel & Moderation** | Admin-only panel: ban/unban users, soft-delete forum posts/replies, view all platform bookings. |

### Scope Decisions & Trade-offs

| Kept Simple | Reason |
|-------------|--------|
| Email / SMTP notifications | Replaced with in-app notifications only |
| Alembic migrations | Use `Base.metadata.create_all()` — sufficient for a demo |
| Availability slots model | Free-text field on the mentor profile (e.g. "Mon-Fri 9-5") |
| Downvotes | Upvote-only (simpler, still demonstrates the concept) |
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
| Self-referential replies | `parent_id` FK on `ForumReply` enables arbitrary-depth nested threading |
| 3 roles (Student/Alumni/Admin) | Covers all use cases; Admin guards are a single `require_role(UserRole.ADMIN)` decorator |

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
│   student/       │          │  MentorProfile   │
│   alumni/admin)  │          │──────────────────│
│ is_banned        │          │ (admin can set)  │
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
       │     │ is_deleted (bool)   │ ← soft-delete by admin
       │     │ created_at          │
       │     └──────┬──────────────┘
       │            │ 1:N
       │     ┌──────▼──────────────────────────────┐
       │     │   ForumReply                        │
       │     │─────────────────────────────────────│
       │     │ id (PK)                             │
       │     │ post_id (FK→ForumPost)              │
       │     │ parent_id (FK→ForumReply, nullable) │ ← nested threading
       │     │ author_id (FK→User)                 │
       │     │ body                                │
       │     │ upvotes (int)                       │
       │     │ is_deleted (bool)                   │ ← soft-delete by admin
       │     │ created_at                          │
       │     └─────────────────────────────────────┘
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

> **6 tables total**: User, MentorProfile, BookingRequest, ForumPost, ForumReply, Upvote.
> Key additions vs. simplified plan: `User.role` gains `admin` value; `User.is_banned` enables banning; `ForumReply.parent_id` enables nested threading; `is_deleted` on posts/replies enables admin soft-deletion.

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
    ADMIN = "admin"           # New: platform moderator role


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
    is_banned     = Column(Boolean, default=False)           # Admin can ban users
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
    is_deleted = Column(Boolean, default=False)              # Soft-delete by admin
    created_at = Column(DateTime, default=datetime.utcnow)

    author  = relationship("User", back_populates="posts")
    replies = relationship("ForumReply", back_populates="post", cascade="all, delete-orphan")


class ForumReply(Base):
    __tablename__ = "forum_replies"

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    parent_id  = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)  # Nested threading
    author_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    body       = Column(Text, nullable=False)
    upvotes    = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)              # Soft-delete by admin
    created_at = Column(DateTime, default=datetime.utcnow)

    post     = relationship("ForumPost", back_populates="replies")
    author   = relationship("User", back_populates="replies")
    parent   = relationship("ForumReply", remote_side=[id], back_populates="children")
    children = relationship("ForumReply", back_populates="parent", cascade="all, delete-orphan")


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
| `POST` | `/api/auth/login` | Login → returns JWT with embedded `role` claim | No |
| `GET`  | `/api/auth/me` | Get current user from token | Yes |

**JWT Payload (3-role):**
```json
{
  "sub": "42",
  "role": "alumni",
  "exp": 1720000000
}
```
The `role` claim is enforced server-side by `require_role()`. Valid values: `"student"`, `"alumni"`, `"admin"`.

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

### 4.3 Bookings (`/api/bookings`) — 5 endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST`   | `/api/bookings` | Student creates a request | Yes (student) |
| `GET`    | `/api/bookings` | List own bookings (both roles) | Yes |
| `PATCH`  | `/api/bookings/{id}/accept` | Mentor accepts | Yes (alumni) |
| `PATCH`  | `/api/bookings/{id}/decline` | Mentor declines | Yes (alumni) |
| `DELETE` | `/api/bookings/{id}` | Student cancels a pending request | Yes (student) |

### 4.4 Forum (`/api/forum`) — 7 endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`    | `/api/forum/posts` | List posts (`?q=`, `?sort=recent\|popular`) | No |
| `GET`    | `/api/forum/posts/{id}` | Get post + **nested reply tree** | No |
| `POST`   | `/api/forum/posts` | Create a post | Yes |
| `POST`   | `/api/forum/posts/{id}/replies` | Reply to a post or reply (`?parent_id=`) | Yes |
| `POST`   | `/api/forum/upvote` | Toggle upvote `{target_type, target_id}` | Yes |
| `DELETE` | `/api/forum/posts/{id}` | Author deletes their own post | Yes |

**Nested Reply Note:** Replies accept an optional `parent_id` query param. `GET /posts/{id}` returns replies as a tree where each node has a `children` list.

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

### 4.6 Admin Panel (`/api/admin`) — 6 endpoints  ⭐ New

> All endpoints in this group require `role == admin` in the JWT.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`    | `/api/admin/users` | List all users with role and ban status | Yes (admin) |
| `PATCH`  | `/api/admin/users/{id}/ban` | Ban a user (`is_banned = True`) | Yes (admin) |
| `PATCH`  | `/api/admin/users/{id}/unban` | Unban a user | Yes (admin) |
| `DELETE` | `/api/admin/posts/{id}` | Soft-delete any forum post | Yes (admin) |
| `DELETE` | `/api/admin/replies/{id}` | Soft-delete any forum reply | Yes (admin) |
| `GET`    | `/api/admin/bookings` | View all platform bookings | Yes (admin) |

### Total: ~26 endpoints

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

## 6. 4-Day Implementation Schedule

### Day 1 — Backend Foundation + Auth (3 Roles) + Mentors + Bookings

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 2h | **Project setup** | FastAPI app, SQLAlchemy engine, `models.py` (with `is_banned`, `parent_id`, `is_deleted`), `database.py`, CORS, `.env` |
| Morning | 1.5h | **Auth endpoints (3-role)** | `POST /register`, `POST /login`, `GET /me`. Native `bcrypt` hashing, JWT embedding `role` claim (`student`/`alumni`/`admin`). `require_role()` dependency factory. |
| Afternoon | 2h | **Mentor CRUD** | `GET /mentors` (filters: `q`, `domain`, `min_exp`, pagination), `GET /mentors/{id}`, `POST /mentors/profile`, `PUT /mentors/profile`. Alumni-only guards. |
| Evening | 1.5h | **Booking endpoints** | `POST`, `GET`, `PATCH /accept`, `PATCH /decline`, `DELETE` (student cancel). Role guards. |
| Evening | 0.5h | **Seed data script** | `seed.py` — 1 admin, 3 mentors, 2 students, bookings, threaded forum posts for demo. |

**Day 1 check**: All backend endpoints pass in FastAPI Swagger UI (`/docs`).

---

### Day 2 — Forum (Nested Replies) + Admin Panel + Frontend Shared Layer

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 2h | **Forum endpoints + nested threading** | `GET /posts`, `GET /posts/{id}` (reply tree), `POST /posts`, `POST /posts/{id}/replies` (`?parent_id=`), `POST /upvote`, `DELETE /posts/{id}`. Recursive `parent_id`-based reply tree builder. |
| Morning | 1h | **Dashboard endpoint** | `GET /dashboard` — role-conditional query (bookings + posts for the current user). |
| Morning | 1.5h | **Admin router** ⭐ | `GET /admin/users`, `PATCH /users/{id}/ban`, `PATCH /users/{id}/unban`, `DELETE /admin/posts/{id}` (soft-delete `is_deleted=True`), `DELETE /admin/replies/{id}`, `GET /admin/bookings`. Guarded by `require_role(UserRole.ADMIN)`. |
| Afternoon | 1h | **Frontend: shared layer** | `api.js` (fetch + token + 401 redirect), `utils.js` (toast, debounce, role-aware navbar). |
| Afternoon | 1.5h | **Frontend: Auth + Landing** | `index.html`, `login.html`, `register.html`. Token + user JSON in `localStorage`. Redirect on login. |
| Evening | 0.5h | **Test integration** | Register → login → browse mentors → book. Admin token verified in `/docs`. |

**Day 2 check**: All backend routes tested. Admin endpoints verified with seeded admin token.

---

### Day 3 — Mentor, Forum, Dashboard, Admin Frontend

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 2h | **Frontend: Mentors** | `mentors.html` (search, filter, card grid), `mentor-detail.html` (full profile + booking modal). |
| Morning | 1.5h | **Frontend: Forum** | `forum.html` (post list, search, sort). `forum-post.html` — recursive nested reply rendering, reply-to-reply toggle, upvote. |
| Afternoon | 2h | **Frontend: Dashboard** | `dashboard.html` — mentor (accept/decline), student (cancel sessions, delete posts). Role-conditional rendering. |
| Evening | 1h | **Frontend: Admin Panel** ⭐ | `admin.html` — user list with ban/unban buttons, soft-delete posts/replies, all bookings table. Accessible only if `role === "admin"`. |
| Evening | 0.5h | **Test integration** | Nested replies, admin moderation actions, ban flow. |

**Day 3 check**: All 6 features work end-to-end in the browser.

---

### Day 4 — UI Polish + Deploy

| Block | Hours | Task | Deliverable |
|-------|-------|------|-------------|
| Morning | 1h | **UI polish** | Responsive layout, loading states, empty states, nested reply visual indentation. |
| Morning | 1h | **Deploy backend (Render)** | Push to GitHub. Render Web Service. Set `SECRET_KEY`, `CORS_ORIGINS`. Verify `/docs` live. |
| Afternoon | 0.5h | **Deploy frontend (GitHub Pages)** | Update `API_BASE_URL` in `api.js`. Enable Pages. Test CORS. |
| Afternoon | 0.5h | **Final smoke test** | Full flow on live URLs: register → login → book mentor → nested forum replies → admin panel → dashboard. |

**Day 4 check**: Both services live. All 6 features verified on production URLs.

---

### Daily Summary

```
Day 1                    Day 2                         Day 3                    Day 4
─────────────────       ───────────────────────       ─────────────────       ─────────────────
 FastAPI setup           Forum (nested replies)        Mentor frontend         UI polish
 Auth (3-role JWT)       Dashboard endpoint            Forum frontend          Deploy backend
 Mentor CRUD + search    Admin router ⭐               Dashboard frontend      Deploy frontend
 Booking endpoints       Frontend shared layer         Admin panel ⭐          Final testing
 Seed data               Auth + Landing pages
─────────────────       ───────────────────────       ─────────────────       ─────────────────
 ~7.5 hrs                ~7.5 hrs                      ~7 hrs                  ~3 hrs
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
├── forum-post.html         ← Post detail + nested replies
├── dashboard.html          ← Role-based dashboard
├── admin.html              ← Admin panel (moderation) ⭐
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
│   ├── forum-post.js       ← nested replies, upvoting
│   ├── dashboard.js        ← tabbed dashboard, cancel/delete actions
│   ├── admin.js            ← user ban/unban, post soft-delete ⭐
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
│       ├── auth.py         ← /api/auth/* (3-role JWT)
│       ├── mentors.py      ← /api/mentors/*
│       ├── bookings.py     ← /api/bookings/* (incl. student cancel)
│       ├── forum.py        ← /api/forum/* (nested replies via parent_id)
│       ├── dashboard.py    ← /api/dashboard
│       └── admin.py        ← /api/admin/* (ban, soft-delete, all-bookings) ⭐
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

> **Total effort**: ~25 hours across 4 days  
> **Result**: A fully functional mentorship platform with 6 core features — including 3-role JWT auth, admin moderation panel, and nested reply threading — deployed on free infrastructure.

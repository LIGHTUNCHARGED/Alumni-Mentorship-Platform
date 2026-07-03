# AlumniConnect — Technical Documentation

> **Target Audience**: Future developers and Agentic AI coders working on this project.  
> **Project Scope**: 3-Day Simplified Alumni Mentorship Platform (recruitment assignment).

---

## 1. High-Level Design & System Architecture

AlumniConnect follows a clean **decoupled SPA architecture**:
1. **Frontend**: Static client served via any standard web server (e.g. Live Server, GitHub Pages). It uses vanilla ES6 JavaScript to make asynchronous `fetch` calls to the backend and renders UI components dynamically using **Tailwind CSS**.
2. **Backend**: A RESTful **FastAPI** web service exposing structured JSON endpoints, protected by standard OAuth2 Bearer token authentication.
3. **Database**: **SQLite** database (`mentorconnect.db`) with **SQLAlchemy 2.x** ORM mapping.

---

## 2. Directory Structure Walkthrough

```
/
├── README.md               ← End-user deployment and running instructions
├── documentation.md        ← This system design documentation
├── plan.md                 ← Original implementation schedule and design specs
├── .gitignore              ← Excludes virtual environments, SQLite DBs, and log files
│
├── backend/                ← FastAPI python service
│   ├── requirements.txt    ← Python packages (with loose bounds for Python 3.13)
│   ├── seed.py             ← Clear and seed mock data script
│   └── app/
│       ├── __init__.py     ← Makes backend/app a package
│       ├── main.py         ← FastAPI application factories, CORS, startup handlers
│       ├── database.py     ← SQLAlchemy connection engine and SessionLocal yields
│       ├── models.py       ← Database tables (SQLAlchemy ORM models)
│       ├── schemas.py      ← Request/Response validation schemas (Pydantic)
│       ├── auth.py         ← JWT helpers and native bcrypt hashing functions
│       └── routers/        ← Request controllers / route groups
│           ├── __init__.py
│           ├── auth.py     ← Registration, login, current user profile
│           ├── mentors.py  ← Mentor lists, details, profile edit
│           ├── bookings.py ← Session booking lifecycle (create, list, accept, decline, cancel)
│           ├── forum.py    ← Post list, thread view, reply submit, vote toggle, post delete
│           └── dashboard.py← Role-specific dashboard aggregates
│
└── frontend/               ← Vanilla JS static web client
    ├── index.html          ← Platform landing page
    ├── login.html          ← Sign in page
    ├── register.html       ← Sign up page
    ├── mentors.html        ← Filterable mentor list grid
    ├── mentor-detail.html  ← Deep profile detail and session booking modal
    ├── forum.html          ← Community board list
    ├── forum-post.html     ← Nested thread replies and upvoting UI
    ├── dashboard.html      ← Student and Mentor dashboard control panel
    ├── css/
    │   └── styles.css      ← Custom transitions and scrollbar overrides
    └── js/
        ├── api.js          ← Global fetch client with authentication header injection
        ├── utils.js        ← Global toast alerts, debouncers, and dynamic navbar
        ├── auth.js         ← Login/registration submit handlers
        ├── mentors.js      ← Mentor list filter and search handlers
        ├── mentor-detail.js← Booking requests submit handlers
        ├── forum.js        ← Post list filters and upvote trigger handlers
        ├── forum-post.js   ← Comment replies and upvote toggles
        └── dashboard.js    ← Dashboard widgets, cancellations, and profile edit handlers
```

---

## 3. Database Entity Relationship (ERD)

The database schema consists of **6 primary tables**:

| Table | Purpose | Keys | Important Fields / Relationships |
|---|---|---|---|
| **`users`** | Core accounts | `id` (PK) | `email` (unique), `password_hash`, `role` (`student` or `alumni`) |
| **`mentor_profiles`** | Professional data | `id` (PK) | `user_id` (FK → `users.id`, unique), `domain`, `years_experience`, `bio` (max 200 words), `availability`, `tags` |
| **`booking_requests`** | Session bookings | `id` (PK) | `student_id` (FK → `users.id`), `mentor_id` (FK → `users.id`), `preferred_datetime` (string), `topic`, `message`, `status` (`pending`, `accepted`, `declined`) |
| **`forum_posts`** | Forum topics | `id` (PK) | `author_id` (FK → `users.id`), `title` (max 200), `body`, `upvotes` |
| **`forum_replies`** | Post replies | `id` (PK) | `post_id` (FK → `forum_posts.id`), `author_id` (FK → `users.id`), `body`, `upvotes` |
| **`upvotes`** | Tracks upvoting | `id` (PK) | `user_id` (FK → `users.id`), `target_type` (`post` or `reply`), `target_id`. Has a unique constraint on `(user_id, target_type, target_id)`. |

---

## 4. Key Implementation details for AI Agents & Developers

### 4.1 Native `bcrypt` Hashing
To bypass legacy `passlib` version compilation conflicts under **Python 3.13** on Windows, password hashing has been switched to native `bcrypt` calls inside **`backend/app/auth.py`**:
```python
import bcrypt

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False
```

### 4.2 Role-Based Auth Guards
Use the `require_role` dependency in FastAPI routers to restrict access to specific user classes:
```python
from app.auth import require_role
from app.models import UserRole

# Example: Alumni only
@router.put("/profile")
def edit_profile(current_user: User = Depends(require_role(UserRole.ALUMNI))):
    ...
```

### 4.3 Pydantic Serialization & Eager Relationships
To avoid empty/undefined relations when serializing models with nested relationships (such as `BookingRequest.mentor`), you **MUST** configure a Pydantic `response_model` on route decorators. This enforces ORM property resolution:
- **Good**: `@router.get("", response_model=DashboardSummaryOut)`
- **Bad**: `@router.get("")` (returns raw SQLAlchemy models, causing relations to be omitted during JSON encoding).

### 4.4 Upvote Toggle Algorithm
Upvotes are toggled via a unified endpoint `POST /api/forum/upvote`:
1. Check if a row exists in the `upvotes` table matching the current `user_id`, `target_type`, and `target_id`.
2. If it exists: **Delete** the upvote row and **decrement** the `upvotes` count on the target post/reply.
3. If it doesn't exist: **Insert** a new upvote row and **increment** the `upvotes` count on the target.
4. Returns: `{"upvoted": bool, "upvotes": int}`.

---

## 5. REST API Specifications

### 5.1 Auth (`/api/auth`)
- `POST /register`: Registers user. Returns `UserOut`.
- `POST /login`: Receives `{email, password}`. Returns `{access_token, token_type, user}`.
- `GET /me`: Returns logged-in `UserOut`.

### 5.2 Mentors (`/api/mentors`)
- `GET /`: Returns list of `MentorProfileOut[]`. Accepts query parameters `q`, `domain`, `min_exp`, `page`, `limit`.
- `GET /{mentor_id}`: Returns a single mentor profile.
- `POST /profile`: Creates profile for Alumni.
- `PUT /profile`: Updates profile for Alumni.

### 5.3 Bookings (`/api/bookings`)
- `POST /`: Student creates a request.
- `GET /`: Lists user bookings.
- `PATCH /{id}/accept`: Mentor accepts booking.
- `PATCH /{id}/decline`: Mentor declines booking.
- `DELETE /{id}`: Student cancels their requested session.

### 5.4 Forum (`/api/forum`)
- `GET /posts`: Lists posts. Accepts `q`, `sort` (`recent`, `popular`), `page`, `limit`.
- `GET /posts/{id}`: Returns post detail and replies list.
- `POST /posts`: Authenticated user publishes a topic.
- `POST /posts/{id}/replies`: Authenticated user replies to a post.
- `POST /upvote`: Toggles post/reply upvote.
- `DELETE /posts/{id}`: Authenticated user deletes their own topic.

### 5.5 Dashboard (`/api/dashboard`)
- `GET /`: Returns `DashboardSummaryOut`. Returns role-specific summaries (student lists or alumni requests).

---

## 6. Frontend Token Passing
The token returned on login is stored in `localStorage` under `token`. The user info is stored under `user`.
The global fetch HTTP client in **`frontend/js/api.js`** automatically intercepts requests, injecting the token if available:
```javascript
const token = localStorage.getItem('token');
if (token) {
    headers['Authorization'] = `Bearer ${token}`;
}
```
If a `401 Unauthorized` response is received, `api.js` clears local storage and redirects the browser to `login.html`.

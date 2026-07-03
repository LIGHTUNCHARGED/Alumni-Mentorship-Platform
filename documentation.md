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

---

## 7. July 2026 Feature Expansion Notes

### What Changed
- Added 3-role authentication support (`student`, `alumni`, `admin`) with role claims in JWTs, banned-account checks in login/current-user resolution, and admin-only route guards.
- Added admin database/moderation APIs under `/api/admin`: platform stats, user listing, ban/unban, all bookings, all forum posts/replies, and soft-delete actions for posts and replies.
- Added `is_banned` to users, `is_deleted` to forum posts/replies, and `parent_id` to forum replies. `init_db()` includes a small SQLite column shim for existing demo databases, while `seed.py` recreates the full schema cleanly.
- Implemented nested forum replies with arbitrary-depth `parent_id` trees returned from `GET /api/forum/posts/{id}` and reply creation via body `parent_id` or query `parent_id`.
- Added public user profile support through `/api/users/{user_id}` and frontend `profile.html`; forum author names link to those profiles.
- Added `admin.html` and `frontend/js/admin.js` for database monitoring, ban/unban, soft-delete moderation, and booking review.
- Replaced the forum question popup with a full-screen editor using Markdown-style toolbar insertions for bold, italic, headings, lists, and code blocks plus live preview.
- Added light/dark theme toggling in the shared navbar, persistent `localStorage` theme state, and CSS overrides in `frontend/css/styles.css`.
- Added subtle homepage fade/slide-up animation classes to the landing hero content and mockup panel.

### Why It Changed
- Admin moderation and bans match the role-based architecture already described in `plan.md` and make the platform manageable beyond ordinary student/alumni flows.
- Soft deletion preserves forum auditability for admin review while hiding removed content from public forum endpoints.
- Nested replies make forum conversations easier to follow and align the implementation with the self-referential reply model in the plan.
- Public profiles give forum interactions useful context without exposing sensitive data beyond the demo account fields already present.
- The full-screen editor gives longer questions room to breathe and supports richer technical posts without adding a frontend build step or heavy editor dependency.
- Theme switching and landing animation improve polish while staying compatible with the existing Tailwind CDN + vanilla JS stack.

### Color Scheme Suggestions
| Scheme | Hex Codes | Reasoning |
|---|---|---|
| Professional Indigo | `#4F46E5`, `#0F172A`, `#F8FAFC`, `#10B981` | Keeps the current trusted education/SaaS feel, with emerald reserved for success and status indicators. |
| High Contrast Academic | `#111827`, `#F9FAFB`, `#F59E0B`, `#2563EB` | Strong readability for dashboards and admin tables; amber can highlight moderation or pending actions. |
| Calm Pastel Mentorship | `#6366F1`, `#ECFEFF`, `#FCE7F3`, `#475569` | Softer and more community-oriented while keeping enough slate contrast for long forum reading. |

### Notes For Future Agents
- `apply_patch` was unavailable in this desktop session because the filesystem sandbox helper failed to spawn; edits were made with escalated PowerShell writes instead.
- The project currently has a dependency environment under `backend/app/venv`; the root `venv` did not have FastAPI installed during verification.
- Public forum endpoints filter out soft-deleted posts/replies. Admin endpoints intentionally show both visible and deleted content.
- `seed.py` includes `admin@example.com` with password `password123`. Public registration rejects `admin` role creation.
- The rich-text editor stores Markdown-like text in the existing `body` field and renders it client-side with a small sanitizer/renderer in `utils.js`; no Markdown package is required.
- For production, replace the SQLite compatibility shim with Alembic migrations before adding more schema changes.

# AlumniConnect — Mentorship Platform

A simple, feature-rich Alumni Mentorship Platform built as a junior developer recruitment task for NALUM.

## Tech Stack
- **Frontend**: HTML5, Tailwind CSS (via CDN), Vanilla JavaScript (ES6+)
- **Backend**: Python 3.10+, FastAPI, SQLite (database), SQLAlchemy (ORM)
- **Deployment**: Render (Backend) and GitHub Pages (Frontend)

---

## Core Features
1. **Mentor Profiles**: Alumni can create and edit their mentorship profiles (Domain, Experience, Bio, Availability, Tags). Students can search and filter mentors.
2. **Session Bookings**: Students can submit booking requests. Mentors manage requests (Accept/Decline) from their dashboard.
3. **Discussion Forum**: Open board for students and alumni to post topics, reply to threads, and upvote helpful answers.
4. **Role-Based Dashboards**: Customized summary views for students (sent requests, forum activity) and alumni (pending requests, upcoming approved sessions, profile management).

---

## File Structure

```
task1/
├── plan.md                 ← 3-Day Implementation Plan & Design Specs
├── README.md               ← This instruction guide
│
├── backend/                ← FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         ← FastAPI application setup
│   │   ├── database.py     ← Database connection & session
│   │   ├── models.py       ← SQLAlchemy models (User, MentorProfile, Bookings, Forum, Upvotes)
│   │   ├── schemas.py      ← Pydantic validation schemas
│   │   ├── auth.py         ← JWT helper dependencies & password hashing
│   │   └── routers/        ← Route controllers (auth, mentors, bookings, forum, dashboard)
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── mentors.py
│   │       ├── bookings.py
│   │       ├── forum.py
│   │       └── dashboard.py
│   ├── seed.py             ← Database seeding script
│   └── requirements.txt    ← Python dependencies
│
└── frontend/               ← Vanilla JS static client
    ├── index.html          ← Landing page
    ├── login.html          ← Sign in
    ├── register.html       ← Sign up / register
    ├── mentors.html        ← Browse & search mentors
    ├── mentor-detail.html  ← Mentor detailed profile & session booking
    ├── forum.html          ← Discussion board
    ├── forum-post.html     ← Discussion thread & replies
    ├── dashboard.html      ← Role-based control panel
    ├── css/
    │   └── styles.css      ← Custom overrides
    └── js/
        ├── api.js          ← Global fetch HTTP client
        ├── utils.js        ← Dynamic navbar, toasts, debouncer
        ├── auth.js         ← Login & register logic
        ├── mentors.js      ← Mentor search/filter logic
        ├── mentor-detail.js← Booking requests logic
        ├── forum.js        ← Forum lists & upvote logic
        ├── forum-post.js   ← Thread replies logic
        └── dashboard.js    ← Dashboard widgets & profile forms
```

---

## Getting Started

### 1. Set Up and Run Backend
Navigate to the `backend/` folder:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
venv\Scripts\activate       # On Windows
# source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt
```

Seed the database with test accounts and discussions:
```bash
python seed.py
```
*Note: This will create a local SQLite database named `mentorconnect.db` and populate it with initial mock data.*

Start the development server:
```bash
uvicorn app.main:app --reload
```
The API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Run Frontend
Since the frontend is built using static files and communicates with the backend via REST, you can run it using any simple local server:
- Open `frontend/index.html` using **Live Server** extension in VS Code.
- Or run in the `frontend/` folder:
  ```bash
  python -m http.server 5500
  ```
Visit [http://127.0.0.1:5500](http://127.0.0.1:5500) to view the client.

---

## Seed Accounts (Password: `password123`)

| Email | Role | Name | Focus |
|-------|------|------|-------|
| `jane.doe@example.com` | Alumni (Mentor) | Jane Doe | Computer Science |
| `john.smith@example.com` | Alumni (Mentor) | John Smith | Finance |
| `alice.j@example.com` | Alumni (Mentor) | Alice Johnson | Computer Science |
| `bob.m@example.com` | Student | Bob Miller | — |
| `charlie.b@example.com` | Student | Charlie Brown | — |

# Code Review Report: Alumni Mentorship Platform

## 1. Overview
The **AlumniConnect Mentorship Platform** is a web application designed to connect students with alumni mentors. The architecture is split between a robust RESTful API built with Python/FastAPI on the backend, and a lightweight Vanilla JavaScript application on the frontend styled with Tailwind CSS.

## 2. Backend Architecture

The backend follows a modular, feature-based directory structure using FastAPI and SQLAlchemy.

### 2.1 Core Modules
- **`app/main.py`**: The application's entry point. It initializes the FastAPI application instance, configures CORS middleware, includes feature-specific routers, and triggers database initialization on startup.
- **`app/database.py`**: Manages the SQLite database connection using SQLAlchemy. It configures the `engine` and exports a `get_db` generator to provide database sessions for requests. It also includes an `_ensure_sqlite_columns` helper for basic schema migrations and evolution.
- **`app/auth.py`**: Contains security utilities and dependencies. It handles password hashing via `bcrypt` and JWT token creation/verification using `jose`. It defines the `get_current_user` and `require_role` dependency injection functions, which are critical for route protection and Role-Based Access Control (RBAC).

### 2.2 ORM Models (`app/models.py`)
This file defines the SQLAlchemy declarative models that map to database tables:
- **`User`**: The central entity managing authentication (email, hashed password) and roles (`STUDENT`, `ALUMNI`, `ADMIN`). It establishes relationships with all user-generated content.
- **`MentorProfile`**: A one-to-one extension of the `User` model specifically for alumni, storing domain expertise, years of experience, a bio, and availability.
- **`BookingRequest`**: Facilitates the mentorship sessions, linking a student (`student_id`) to a mentor (`mentor_id`). It tracks preferred times and request status (`PENDING`, `ACCEPTED`, `DECLINED`).
- **`ForumPost` & `ForumReply`**: Implements a threaded discussion board structure. `ForumReply` supports self-referential relationships (via `parent_id`) to allow nested replies.
- **`Upvote`**: A polymorphic model allowing users to upvote both posts and replies using an `Enum` (`TargetType`).

### 2.3 Pydantic Schemas (`app/schemas.py`)
This file defines the data validation and serialization structures. By separating schemas from ORM models, the application ensures that sensitive data (like password hashes) is never leaked in API responses. Key components include:
- Base models (e.g., `UserBase`, `MentorProfileBase`).
- Input models (e.g., `UserRegister`, `BookingRequestCreate`).
- Output models with `from_attributes = True` for ORM compatibility (e.g., `UserOut`, `BookingRequestOut`).

### 2.4 Routers (`app/routers/`)
The API endpoints are logically grouped into separate files for maintainability:
- **`auth.py`**: Handles user registration, authentication (login returning a JWT), and fetching the current authenticated user's profile.
- **`mentors.py`**: Provides endpoints to list all mentors (with filtering and search capabilities), view a specific mentor's profile, and allows alumni to create or update their profiles.
- **`bookings.py`**: Manages the lifecycle of a mentorship session. Students can create or cancel requests, while mentors can accept or decline them.
- **`forum.py`**: Endpoints to manage the community discussion board, including fetching threads, posting queries, adding nested replies, and toggling upvotes.
- **`dashboard.py`**: A specialized router that aggregates personalized data (recent bookings, forum activity) based on the current user's role to power the frontend dashboard efficiently.

## 3. Frontend Architecture

The frontend is a static, Single Page Application (SPA)-like client utilizing Vanilla JavaScript (ES6+) and Tailwind CSS via CDN.

### 3.1 Views (HTML files)
- **`index.html`**, **`login.html`**, **`register.html`**: Public-facing pages for landing and authentication.
- **`dashboard.html`**: A role-based control panel displaying relevant summaries.
- **`mentors.html` & `mentor-detail.html`**: Interface for discovering and booking mentors.
- **`forum.html` & `forum-post.html`**: Interfaces for the community discussion board.

### 3.2 JavaScript Logic (`frontend/js/`)
- **`api.js`**: A centralized HTTP client using the native `fetch` API. It likely intercepts requests to inject the JWT Bearer token into headers and handles global API errors.
- **`utils.js`**: Shared utility functions for common UI operations such as dynamic navbar rendering, toast notifications, and debouncing search inputs.
- **Feature Scripts (e.g., `auth.js`, `mentors.js`, `bookings.js`)**: Each script is responsible for binding event listeners to the DOM elements of its respective page, fetching data using `api.js`, and dynamically updating the UI.

## 4. Notable Implementation Details & Feedback

- **Dependency Injection**: The backend makes excellent use of FastAPI's dependency injection system (e.g., `Depends(get_db)`, `Depends(get_current_user)`). This keeps route handlers clean and highly testable.
- **Security**: Passwords are securely hashed using `bcrypt`, and stateless JWT tokens provide a scalable authentication mechanism. The RBAC is tightly integrated into route dependencies.
- **Database Modularity**: The models are well-structured with clear foreign key relationships and cascade deletion rules, ensuring referential integrity (e.g., deleting a user deletes their posts and bookings).
- **Search Functionality**: The mentor search implementation uses SQLAlchemy's `or_` and `ilike` operators to provide a flexible, case-insensitive search across multiple profile fields.
- **Schema Evolution**: The custom `_ensure_sqlite_columns` function in `database.py` acts as a lightweight migration tool. While clever for a small assignment, moving to a robust migration framework like **Alembic** is recommended for production environments.

## 5. Summary
The codebase is clean, well-structured, and strictly adheres to modern Python and FastAPI best practices. The separation of concerns between database models, validation schemas, and route controllers ensures that the application is easy to navigate, scale, and maintain.

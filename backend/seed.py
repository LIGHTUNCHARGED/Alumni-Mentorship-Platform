from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import Base, User, MentorProfile, BookingRequest, ForumPost, ForumReply, UserRole, BookingStatus
from app.auth import get_password_hash

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        print("Seeding database...")
        pass_hash = get_password_hash("password123")

        admin = User(email="admin@example.com", password_hash=pass_hash, full_name="Admin User", role=UserRole.ADMIN)
        mentor1 = User(email="jane.doe@example.com", password_hash=pass_hash, full_name="Jane Doe", role=UserRole.ALUMNI)
        mentor2 = User(email="john.smith@example.com", password_hash=pass_hash, full_name="John Smith", role=UserRole.ALUMNI)
        mentor3 = User(email="alice.j@example.com", password_hash=pass_hash, full_name="Alice Johnson", role=UserRole.ALUMNI)
        student1 = User(email="bob.m@example.com", password_hash=pass_hash, full_name="Bob Miller", role=UserRole.STUDENT)
        student2 = User(email="charlie.b@example.com", password_hash=pass_hash, full_name="Charlie Brown", role=UserRole.STUDENT)

        db.add_all([admin, mentor1, mentor2, mentor3, student1, student2])
        db.commit()
        for user in [admin, mentor1, mentor2, mentor3, student1, student2]:
            db.refresh(user)

        profiles = [
            MentorProfile(
                user_id=mentor1.id,
                domain="Computer Science",
                years_experience=5,
                bio="Senior Software Engineer at Google. Passionate about helping students break into tech, optimize their resumes, and master system design interviews. Feel free to book a session!",
                availability="Mon/Wed 6:00 PM - 8:00 PM EST",
                tags="Software Engineering, Resume Review, System Design, Career Growth"
            ),
            MentorProfile(
                user_id=mentor2.id,
                domain="Finance",
                years_experience=8,
                bio="Investment Banking VP with over 8 years of experience. Experienced in corporate finance, merger models, and financial valuation. I love helping students with interview preparation and case studies.",
                availability="Tue/Thu 5:00 PM - 7:00 PM EST",
                tags="Investment Banking, Mock Interview, Valuation, Case Prep"
            ),
            MentorProfile(
                user_id=mentor3.id,
                domain="Computer Science",
                years_experience=3,
                bio="Frontend Developer specialized in React, TypeScript, and modern web architectures. Former bootcamp graduate who understands the career transition process. Let's do portfolio reviews!",
                availability="Friday 9:00 AM - 12:00 PM EST",
                tags="Frontend development, React, Portfolio Review, Bootcamp Path"
            ),
        ]
        db.add_all(profiles)
        db.commit()

        bookings = [
            BookingRequest(
                student_id=student1.id,
                mentor_id=mentor1.id,
                preferred_datetime="2026-07-06T18:00",
                topic="Resume Review & FAANG Prep",
                message="Hi Jane, I am a junior CS student preparing for summer internships. I would appreciate feedback on my resume and some tips for technical coding prep. Thanks!",
                status=BookingStatus.PENDING
            ),
            BookingRequest(
                student_id=student1.id,
                mentor_id=mentor2.id,
                preferred_datetime="2026-07-07T17:00",
                topic="Mock Interview",
                message="Hi John, looking forward to a mock interview session for investment banking positions.",
                status=BookingStatus.ACCEPTED
            ),
            BookingRequest(
                student_id=student2.id,
                mentor_id=mentor3.id,
                preferred_datetime="2026-07-10T10:00",
                topic="React Portfolio Review",
                message="Hi Alice, I built a personal project in React and would like some feedback on structure and state management. Thank you!",
                status=BookingStatus.PENDING
            ),
        ]
        db.add_all(bookings)
        db.commit()

        post1 = ForumPost(
            author_id=student1.id,
            title="How to balance coding practice with university classes?",
            body="Hey everyone, I am struggling to find enough time to practice LeetCode and work on personal projects while maintaining a high GPA. How do alumni manage their time during college?",
            upvotes=5
        )
        post2 = ForumPost(
            author_id=mentor1.id,
            title="Tips for Writing a Standout Software Engineering Resume",
            body="Here are my top 3 tips as a recruiter-facing engineer:\n1. Focus on impact, not just responsibilities (e.g., 'saved $5k' or 'speed up load time by 20%').\n2. Keep it to one page.\n3. Put your most impressive projects at the top.\nAsk me anything in the replies!",
            upvotes=12
        )
        db.add_all([post1, post2])
        db.commit()
        db.refresh(post1)
        db.refresh(post2)

        reply1 = ForumReply(
            post_id=post1.id,
            author_id=mentor3.id,
            body="I highly recommend setting aside just 1 hour every morning before classes to code. Consistency is far more important than weekend cramming sessions. Block it on your calendar!",
            upvotes=4
        )
        reply2 = ForumReply(
            post_id=post1.id,
            parent=reply1,
            author_id=student2.id,
            body="I am struggling with this too! Good question.",
            upvotes=1
        )
        reply3 = ForumReply(
            post_id=post2.id,
            author_id=student1.id,
            body="Should I include school coursework projects on my resume if I don't have internship experience yet?",
            upvotes=2
        )
        reply4 = ForumReply(
            post_id=post2.id,
            parent=reply3,
            author_id=mentor1.id,
            body="Yes, absolutely! Coursework projects are great if they showcase unique challenges (not just basic class assignments).",
            upvotes=3
        )
        db.add_all([reply1, reply2, reply3, reply4])
        db.commit()

        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

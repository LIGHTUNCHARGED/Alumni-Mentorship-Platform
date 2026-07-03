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

        # 1. Create Users
        admin = User(email="admin@example.com", password_hash=pass_hash, full_name="Admin User", role=UserRole.ADMIN)
        db.add(admin)

        # 5 Students
        students = [
            User(email="student1@example.com", password_hash=pass_hash, full_name="Bobby Miller", role=UserRole.STUDENT),
            User(email="student2@example.com", password_hash=pass_hash, full_name="Charlie Brown", role=UserRole.STUDENT),
            User(email="student3@example.com", password_hash=pass_hash, full_name="Diana Prince", role=UserRole.STUDENT),
            User(email="student4@example.com", password_hash=pass_hash, full_name="Evan Wright", role=UserRole.STUDENT),
            User(email="student5@example.com", password_hash=pass_hash, full_name="Fiona Gallagher", role=UserRole.STUDENT),
        ]
        db.add_all(students)

        # 15 Mentors (Alumni)
        mentors_data = [
            ("Jane Doe", "jane.doe@example.com", "Computer Science", 5, "Senior Software Engineer at Google. Passionate about helping students break into tech, optimize resumes, and master system design.", "Mon/Wed 6:00 PM - 8:00 PM EST", "Software Engineering, Resume Review, System Design"),
            ("John Smith", "john.smith@example.com", "Finance", 8, "Investment Banking VP. Experienced in corporate finance, merger models, and financial valuation. I love helping students with interview prep.", "Tue/Thu 5:00 PM - 7:00 PM EST", "Investment Banking, Mock Interview, Valuation"),
            ("Alice Johnson", "alice.j@example.com", "Computer Science", 3, "Frontend Developer specialized in React, TypeScript, and modern web architectures. Let's do portfolio reviews!", "Friday 9:00 AM - 12:00 PM EST", "Frontend, React, Portfolio Review"),
            ("David Lee", "david.lee@example.com", "Computer Science", 10, "Engineering Manager at Meta. Ex-Netflix, Ex-Amazon. Expert in system architectures, career planning, and mock interviews.", "Saturdays 10:00 AM - 1:00 PM EST", "Engineering Management, Mock Interview, Career Prep"),
            ("Sarah Connor", "sarah.c@example.com", "Data Science", 6, "Senior Data Scientist at Tesla. Deep learning expert. Can help guide your journey into Machine Learning, statistics, and Python.", "Mon/Thu 7:00 PM - 9:00 PM EST", "Data Science, Machine Learning, Python"),
            ("Michael Scott", "michael.s@example.com", "Management", 12, "Regional Manager in Sales & Operations. Happy to teach leadership, negotiation, soft skills, and client relationship management.", "Tuesdays 2:00 PM - 4:00 PM EST", "Leadership, Sales, Management"),
            ("Emily Watson", "emily.w@example.com", "Finance", 4, "Consultant at McKinsey. Specialized in strategy, McKinsey case interview prep, and corporate strategy frameworks.", "Wednesdays 6:00 PM - 8:00 PM EST", "Management Consulting, Case Prep, Strategy"),
            ("Robert Chen", "robert.c@example.com", "Computer Science", 7, "Security Architect at CrowdStrike. Specialized in cloud security, cryptography, and low-level C/C++ development.", "Fridays 3:00 PM - 5:00 PM EST", "Cybersecurity, C++, Cloud Security"),
            ("Jessica Taylor", "jessica.t@example.com", "Product Management", 6, "Senior Product Manager at Airbnb. Let's review product case studies, design metrics, and strategy interviews.", "Thursdays 6:00 PM - 8:00 PM EST", "Product Management, Metrics, Mock Interview"),
            ("James Bond", "james.b@example.com", "Data Science", 9, "Data Analytics Team Lead. Specialized in SQL, Tableau, data modeling, and business intelligence strategy.", "Mon/Fri 4:00 PM - 6:00 PM EST", "SQL, Tableau, Business Intelligence"),
            ("Rachel Green", "rachel.g@example.com", "Marketing", 5, "Brand Specialist at Ralph Lauren. Specialized in digital marketing, fashion brand building, and social media campaigns.", "Wednesdays 1:00 PM - 3:00 PM EST", "Marketing, Brand Strategy, Digital Marketing"),
            ("Thomas Shelby", "thomas.s@example.com", "Finance", 15, "Private Equity Partner. Specialized in asset management, venture capital, and early-stage startup pitching.", "Mondays 9:00 AM - 11:00 AM EST", "Venture Capital, Private Equity, Startup Pitching"),
            ("Bruce Wayne", "bruce.w@example.com", "Management", 20, "Chairman at Wayne Enterprises. Corporate governance, global operations, angel investing, and strategic leadership.", "Sundays 8:00 PM - 10:00 PM EST", "Corporate Governance, Angel Investing, Leadership"),
            ("Clark Kent", "clark.k@example.com", "Media", 8, "Senior Investigative Journalist at Daily Planet. Specialized in communications, editing, writing, and networking.", "Thursdays 10:00 AM - 12:00 PM EST", "Journalism, Editing, Communication"),
            ("Peter Parker", "peter.p@example.com", "Computer Science", 2, "Software Engineer at Daily Bugle. Self-taught programmer. Can help with portfolio building and entry-level SWE searches.", "Tuesdays 6:00 PM - 8:00 PM EST", "Portfolio, Web Development, Entry Level")
        ]

        mentors = []
        for name, email, domain, exp, bio, availability, tags in mentors_data:
            mentor_user = User(email=email, password_hash=pass_hash, full_name=name, role=UserRole.ALUMNI)
            db.add(mentor_user)
            mentors.append((mentor_user, domain, exp, bio, availability, tags))

        db.commit()

        # Refresh all users to get IDs
        db.refresh(admin)
        for s in students:
            db.refresh(s)
        
        # Create profiles
        profiles = []
        for mentor_user, domain, exp, bio, availability, tags in mentors:
            db.refresh(mentor_user)
            profiles.append(
                MentorProfile(
                    user_id=mentor_user.id,
                    domain=domain,
                    years_experience=exp,
                    bio=bio,
                    availability=availability,
                    tags=tags
                )
            )
        db.add_all(profiles)
        db.commit()

        # 2. Seed Bookings
        bookings = [
            BookingRequest(student_id=students[0].id, mentor_id=mentors[0][0].id, preferred_datetime="2026-07-06T18:00", topic="Resume Review & FAANG Prep", message="Help with Google SWE applications.", status=BookingStatus.PENDING),
            BookingRequest(student_id=students[1].id, mentor_id=mentors[1][0].id, preferred_datetime="2026-07-07T17:00", topic="Mock Case Interview", message="Prep for corporate finance valuation round.", status=BookingStatus.ACCEPTED),
            BookingRequest(student_id=students[2].id, mentor_id=mentors[2][0].id, preferred_datetime="2026-07-10T10:00", topic="React Architecture", message="Reviewing structure of my final project.", status=BookingStatus.PENDING),
            BookingRequest(student_id=students[3].id, mentor_id=mentors[3][0].id, preferred_datetime="2026-07-11T11:00", topic="System Design Discussion", message="Mock design session on distributed systems.", status=BookingStatus.PENDING),
            BookingRequest(student_id=students[4].id, mentor_id=mentors[4][0].id, preferred_datetime="2026-07-12T15:00", topic="Data Science Portfolio", message="Getting feedback on deep learning models.", status=BookingStatus.ACCEPTED),
        ]
        db.add_all(bookings)
        db.commit()

        # 3. Seed 8 Forum Posts
        posts = [
            ForumPost(author_id=students[0].id, title="How to balance coding practice with university classes?", body="Hey everyone, I am struggling to find enough time to practice LeetCode and work on personal projects while maintaining a high GPA. How do alumni manage their time during college?", upvotes=8),
            ForumPost(author_id=mentors[0][0].id, title="Tips for Writing a Standout Software Engineering Resume", body="Here are my top 3 tips as a recruiter-facing engineer:\n1. Focus on impact, not just responsibilities.\n2. Keep it to one page.\n3. Put your most impressive projects at the top.\nAsk me anything in the replies!", upvotes=15),
            ForumPost(author_id=students[1].id, title="Are management consulting case guides (like Case In Point) still relevant?", body="I am preparing for consulting rounds at BCG and McKinsey. Is Case In Point still the best resource, or are there newer platforms/strategies that work better now?", upvotes=4),
            ForumPost(author_id=mentors[4][0].id, title="Transitioning from Software Engineering to Data Science: My Journey", body="Many engineers ask me if they need a Master's degree to do Data Science. The short answer is: no! Practical experience with data pipelines, modeling, and business problem-solving counts for much more.", upvotes=11),
            ForumPost(author_id=students[2].id, title="What is the daily schedule like for an entry-level Product Manager?", body="Just received an offer for an APM role! What should I expect for the first 90 days? How much of the day is coding vs. meetings?", upvotes=7),
            ForumPost(author_id=mentors[7][0].id, title="Why you should learn C++ and Memory Management even in 2026", body="High-level languages are great, but understanding pointers, memory allocation, and OS-level interactions will make you a far better software architect regardless of what language you end up writing.", upvotes=14),
            ForumPost(author_id=students[3].id, title="How do I get my first investment banking internship without family connections?", body="I am at a non-target school. What is the cold-emailing strategy that actually converts to first-round interviews? Any templates or numbers to share?", upvotes=9),
            ForumPost(author_id=students[4].id, title="Is it better to build 3 small projects or 1 massive complex project?", body="For portfolio presentation, do recruiters prefer seeing multiple smaller web applications or one highly polished, full-stack microservices app?", upvotes=5),
        ]
        db.add_all(posts)
        db.commit()

        for p in posts:
            db.refresh(p)

        # 4. Seed Nested Replies
        # Post 1 Replies (Time management)
        p1_r1 = ForumReply(post_id=posts[0].id, author_id=mentors[2][0].id, body="Set aside 1 hour every morning before classes to code. Consistency is key!", upvotes=5)
        p1_r2 = ForumReply(post_id=posts[0].id, author_id=mentors[3][0].id, body="Agreed. I also recommend building projects that count towards class credit so you hit two birds with one stone.", upvotes=3)
        db.add_all([p1_r1, p1_r2])
        db.commit()
        db.refresh(p1_r1)
        db.refresh(p1_r2)

        p1_r1_c1 = ForumReply(post_id=posts[0].id, parent_id=p1_r1.id, author_id=students[1].id, body="Do you recommend doing LeetCode daily or focusing on portfolio projects?", upvotes=2)
        db.add(p1_r1_c1)
        db.commit()
        db.refresh(p1_r1_c1)

        p1_r1_c1_cc1 = ForumReply(post_id=posts[0].id, parent_id=p1_r1_c1.id, author_id=mentors[2][0].id, body="Split it: 30% LeetCode (just to keep problem-solving fresh) and 70% projects. Recruiters love talking about real, deployed apps.", upvotes=4)
        db.add(p1_r1_c1_cc1)

        # Post 2 Replies (Resume tips)
        p2_r1 = ForumReply(post_id=posts[1].id, author_id=students[0].id, body="Should I include school projects if I have no internships yet?", upvotes=6)
        db.add(p2_r1)
        db.commit()
        db.refresh(p2_r1)

        p2_r1_c1 = ForumReply(post_id=posts[1].id, parent_id=p2_r1.id, author_id=mentors[0][0].id, body="Yes, but make sure they aren't generic class assignments (like a basic calculator). Highlight unique APIs, architecture choices, and challenges you overcame.", upvotes=4)
        p2_r1_c2 = ForumReply(post_id=posts[1].id, parent_id=p2_r1.id, author_id=mentors[14][0].id, body="Absolutely, coursework projects are essential. Treat them like real jobs in terms of bullet formatting.", upvotes=2)
        db.add_all([p2_r1_c1, p2_r1_c2])
        db.commit()
        db.refresh(p2_r1_c1)

        p2_r1_c1_cc1 = ForumReply(post_id=posts[1].id, parent_id=p2_r1_c1.id, author_id=students[0].id, body="Thank you Jane, that is very encouraging. I will rewrite my project descriptions tonight!", upvotes=3)
        db.add(p2_r1_c1_cc1)

        # Post 3 Replies (Consulting case guides)
        p3_r1 = ForumReply(post_id=posts[2].id, author_id=mentors[6][0].id, body="Case In Point is good for structure, but it can make you sound formulaic. Use 'Crafting Cases' or practice live with peers to sound more natural.", upvotes=7)
        db.add(p3_r1)
        db.commit()
        db.refresh(p3_r1)

        p3_r1_c1 = ForumReply(post_id=posts[2].id, parent_id=p3_r1.id, author_id=students[1].id, body="Where can I find peer groups for live case studies?", upvotes=1)
        db.add(p3_r1_c1)
        db.commit()
        db.refresh(p3_r1_c1)

        p3_r1_c1_cc1 = ForumReply(post_id=posts[2].id, parent_id=p3_r1_c1.id, author_id=mentors[6][0].id, body="Try your university consulting club, or platforms like Case Interview Partner. Doing at least 15-20 live cases is crucial.", upvotes=3)
        db.add(p3_r1_c1_cc1)

        # Post 6 Replies (C++)
        p6_r1 = ForumReply(post_id=posts[5].id, author_id=students[3].id, body="Isn't Rust replacing C++ in modern systems development?", upvotes=4)
        db.add(p6_r1)
        db.commit()
        db.refresh(p6_r1)

        p6_r1_c1 = ForumReply(post_id=posts[5].id, parent_id=p6_r1.id, author_id=mentors[7][0].id, body="Rust is growing rapidly, but the legacy C++ codebases are massive and won't disappear for decades. Also, the core principles of memory management and system structures carry over perfectly between both.", upvotes=6)
        db.add(p6_r1_c1)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

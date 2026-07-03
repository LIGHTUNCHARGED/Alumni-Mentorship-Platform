import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, Text, Enum, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ALUMNI = "alumni"
    ADMIN = "admin"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class TargetType(str, enum.Enum):
    POST = "post"
    REPLY = "reply"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_banned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_student = relationship(
        "BookingRequest", foreign_keys="BookingRequest.student_id", back_populates="student", cascade="all, delete-orphan"
    )
    bookings_as_mentor = relationship(
        "BookingRequest", foreign_keys="BookingRequest.mentor_id", back_populates="mentor", cascade="all, delete-orphan"
    )
    posts = relationship("ForumPost", back_populates="author", cascade="all, delete-orphan")
    replies = relationship("ForumReply", back_populates="author", cascade="all, delete-orphan")
    upvotes = relationship("Upvote", back_populates="user", cascade="all, delete-orphan")

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    domain = Column(String(100), nullable=False)
    years_experience = Column(Integer, nullable=False)
    bio = Column(Text, nullable=False)
    availability = Column(String(200), nullable=True)
    tags = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="mentor_profile")

class BookingRequest(Base):
    __tablename__ = "booking_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    preferred_datetime = Column(String(50), nullable=False)
    topic = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id], back_populates="bookings_as_student")
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="bookings_as_mentor")

class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="posts")
    replies = relationship("ForumReply", back_populates="post", cascade="all, delete-orphan")

class ForumReply(Base):
    __tablename__ = "forum_replies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("ForumPost", back_populates="replies")
    author = relationship("User", back_populates="replies")
    parent = relationship("ForumReply", remote_side=[id], back_populates="children")
    children = relationship("ForumReply", back_populates="parent", cascade="all, delete-orphan")

class Upvote(Base):
    __tablename__ = "upvotes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(Enum(TargetType), nullable=False)
    target_id = Column(Integer, nullable=False)

    user = relationship("User", back_populates="upvotes")

    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_user_upvote"),
    )

from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, BookingStatus, TargetType

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.STUDENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    role: UserRole
    is_banned: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class PublicProfileOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_banned: bool
    created_at: datetime
    mentor_profile: Optional["MentorProfileBase"] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class MentorProfileBase(BaseModel):
    domain: str
    years_experience: int = Field(..., ge=0)
    bio: str
    availability: Optional[str] = None
    tags: Optional[str] = None

    @field_validator("bio")
    @classmethod
    def validate_bio_word_count(cls, v: str) -> str:
        if len(v.split()) > 200:
            raise ValueError("Bio must be at most 200 words")
        return v

class MentorProfileCreate(MentorProfileBase):
    pass

class MentorProfileUpdate(MentorProfileBase):
    pass

class MentorProfileOut(MentorProfileBase):
    id: int
    user_id: int
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True

class BookingRequestCreate(BaseModel):
    mentor_id: int
    preferred_datetime: str
    topic: str = Field(..., max_length=200)
    message: Optional[str] = None

class BookingRequestOut(BaseModel):
    id: int
    student_id: int
    mentor_id: int
    preferred_datetime: str
    topic: str
    message: Optional[str]
    status: BookingStatus
    created_at: datetime
    student: UserOut
    mentor: UserOut

    class Config:
        from_attributes = True

class ForumReplyCreate(BaseModel):
    body: str
    parent_id: Optional[int] = None

class ForumReplyOut(BaseModel):
    id: int
    post_id: int
    parent_id: Optional[int] = None
    author_id: int
    body: str
    upvotes: int
    is_deleted: bool = False
    created_at: datetime
    author: UserOut
    children: List["ForumReplyOut"] = []

    class Config:
        from_attributes = True

class ForumPostCreate(BaseModel):
    title: str = Field(..., max_length=200)
    body: str

class ForumPostOut(BaseModel):
    id: int
    author_id: int
    title: str
    body: str
    upvotes: int
    is_deleted: bool = False
    created_at: datetime
    author: UserOut
    replies: List[ForumReplyOut] = []

    class Config:
        from_attributes = True

class UpvoteToggle(BaseModel):
    target_type: TargetType
    target_id: int

class UpvoteResponse(BaseModel):
    upvoted: bool
    upvotes: int

class AdminStatsOut(BaseModel):
    users: int
    mentors: int
    posts: int
    replies: int
    bookings: int

class AdminForumReplyOut(ForumReplyOut):
    pass

class DashboardSummaryOut(BaseModel):
    role: UserRole
    pending_bookings: Optional[List[BookingRequestOut]] = None
    accepted_bookings: Optional[List[BookingRequestOut]] = None
    my_bookings: Optional[List[BookingRequestOut]] = None
    my_replies: Optional[List[ForumReplyOut]] = None
    my_posts: Optional[List[ForumPostOut]] = None

    class Config:
        from_attributes = True

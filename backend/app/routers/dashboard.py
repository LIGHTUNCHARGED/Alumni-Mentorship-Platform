from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, BookingRequest, BookingStatus, ForumPost, ForumReply, UserRole
from app.auth import get_current_user
from app.schemas import DashboardSummaryOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ALUMNI:
        pending_bookings = db.query(BookingRequest).filter(
            BookingRequest.mentor_id == current_user.id,
            BookingRequest.status == BookingStatus.PENDING
        ).all()
        
        accepted_bookings = db.query(BookingRequest).filter(
            BookingRequest.mentor_id == current_user.id,
            BookingRequest.status == BookingStatus.ACCEPTED
        ).all()
        
        my_posts = db.query(ForumPost).filter(ForumPost.author_id == current_user.id).all()
        
        return {
            "role": current_user.role,
            "pending_bookings": pending_bookings,
            "accepted_bookings": accepted_bookings,
            "my_posts": my_posts
        }
    else:
        my_bookings = db.query(BookingRequest).filter(BookingRequest.student_id == current_user.id).all()
        my_posts = db.query(ForumPost).filter(ForumPost.author_id == current_user.id).all()
        my_replies = db.query(ForumReply).filter(ForumReply.author_id == current_user.id).all()
        
        return {
            "role": current_user.role,
            "my_bookings": my_bookings,
            "my_posts": my_posts,
            "my_replies": my_replies
        }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import User, UserRole, MentorProfile, BookingRequest, ForumPost, ForumReply
from app.schemas import AdminStatsOut, BookingRequestOut, ForumPostOut, ForumReplyOut, UserOut
from app.auth import require_role

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats", response_model=AdminStatsOut)
def get_stats(_: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    return {
        "users": db.query(User).count(),
        "mentors": db.query(MentorProfile).count(),
        "posts": db.query(ForumPost).count(),
        "replies": db.query(ForumReply).count(),
        "bookings": db.query(BookingRequest).count(),
    }

@router.get("/users", response_model=List[UserOut])
def list_users(_: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/users/{user_id}/ban", response_model=UserOut)
def ban_user(user_id: int, current_user: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot ban themselves")
    user.is_banned = True
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/unban", response_model=UserOut)
def unban_user(user_id: int, _: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_banned = False
    db.commit()
    db.refresh(user)
    return user

@router.get("/posts", response_model=List[ForumPostOut])
def list_all_posts(_: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    return db.query(ForumPost).options(joinedload(ForumPost.author), joinedload(ForumPost.replies)).order_by(ForumPost.created_at.desc()).all()

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_any_post(post_id: int, _: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post.is_deleted = True
    db.commit()
    return

@router.get("/replies", response_model=List[ForumReplyOut])
def list_all_replies(_: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    return db.query(ForumReply).options(joinedload(ForumReply.author)).order_by(ForumReply.created_at.desc()).all()

@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_any_reply(reply_id: int, _: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
    reply.is_deleted = True
    db.commit()
    return

@router.get("/bookings", response_model=List[BookingRequestOut])
def list_all_bookings(_: User = Depends(require_role(UserRole.ADMIN)), db: Session = Depends(get_db)):
    return db.query(BookingRequest).options(joinedload(BookingRequest.student), joinedload(BookingRequest.mentor)).order_by(BookingRequest.created_at.desc()).all()

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from app.database import get_db
from app.models import User, ForumPost, ForumReply, Upvote, TargetType
from app.schemas import ForumPostCreate, ForumPostOut, ForumReplyCreate, ForumReplyOut, UpvoteToggle, UpvoteResponse
from app.auth import get_current_user

router = APIRouter(prefix="/forum", tags=["forum"])

@router.get("/posts", response_model=List[ForumPostOut])
def list_posts(
    q: Optional[str] = Query(None),
    sort: str = Query("recent", pattern="^(recent|popular)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(ForumPost).join(User)
    
    if q:
        query = query.filter(
            or_(
                ForumPost.title.ilike(f"%{q}%"),
                ForumPost.body.ilike(f"%{q}%"),
                User.full_name.ilike(f"%{q}%")
            )
        )
        
    if sort == "popular":
        query = query.order_by(desc(ForumPost.upvotes))
    else:
        query = query.order_by(desc(ForumPost.created_at))
        
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()
    return results

@router.get("/posts/{post_id}", response_model=ForumPostOut)
def get_post_detail(post_id: int, db: Session = Depends(get_db)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forum post not found"
        )
    return post

@router.post("/posts", response_model=ForumPostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: ForumPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_post = ForumPost(
        author_id=current_user.id,
        title=post_in.title,
        body=post_in.body
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.post("/posts/{post_id}/replies", response_model=ForumReplyOut, status_code=status.HTTP_201_CREATED)
def create_reply(
    post_id: int,
    reply_in: ForumReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify post exists
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forum post not found"
        )
        
    new_reply = ForumReply(
        post_id=post_id,
        author_id=current_user.id,
        body=reply_in.body
    )
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    return new_reply

@router.post("/upvote", response_model=UpvoteResponse)
def toggle_upvote(
    vote_in: UpvoteToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify item exists
    if vote_in.target_type == TargetType.POST:
        target = db.query(ForumPost).filter(ForumPost.id == vote_in.target_id).first()
    else:
        target = db.query(ForumReply).filter(ForumReply.id == vote_in.target_id).first()
        
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{vote_in.target_type.value.capitalize()} not found"
        )
        
    # Check if upvote already exists
    upvote = db.query(Upvote).filter(
        Upvote.user_id == current_user.id,
        Upvote.target_type == vote_in.target_type,
        Upvote.target_id == vote_in.target_id
    ).first()
    
    if upvote:
        # Toggle off: delete upvote and decrement target upvotes
        db.delete(upvote)
        target.upvotes = max(0, target.upvotes - 1)
        upvoted = False
    else:
        # Toggle on: create upvote and increment target upvotes
        new_upvote = Upvote(
            user_id=current_user.id,
            target_type=vote_in.target_type,
            target_id=vote_in.target_id
        )
        db.add(new_upvote)
        target.upvotes += 1
        upvoted = True
        
    db.commit()
    db.refresh(target)
    return {"upvoted": upvoted, "upvotes": target.upvotes}

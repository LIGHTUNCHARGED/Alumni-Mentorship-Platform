from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from typing import List, Optional
from app.database import get_db
from app.models import User, ForumPost, ForumReply, Upvote, TargetType
from app.schemas import ForumPostCreate, ForumPostOut, ForumReplyCreate, ForumReplyOut, UpvoteToggle, UpvoteResponse
from app.auth import get_current_user

router = APIRouter(prefix="/forum", tags=["forum"])

def build_reply_tree(replies: List[ForumReply]) -> List[ForumReply]:
    by_parent = {}
    for reply in replies:
        reply.children = []
        by_parent.setdefault(reply.parent_id, []).append(reply)
    for reply in replies:
        reply.children = by_parent.get(reply.id, [])
    return by_parent.get(None, [])

@router.get("/posts", response_model=List[ForumPostOut])
def list_posts(
    q: Optional[str] = Query(None),
    sort: str = Query("recent", pattern="^(recent|popular)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(ForumPost).options(joinedload(ForumPost.author), joinedload(ForumPost.replies)).join(User).filter(ForumPost.is_deleted == False)

    if q:
        query = query.filter(
            or_(
                ForumPost.title.ilike(f"%{q}%"),
                ForumPost.body.ilike(f"%{q}%"),
                User.full_name.ilike(f"%{q}%")
            )
        )

    query = query.order_by(desc(ForumPost.upvotes) if sort == "popular" else desc(ForumPost.created_at))
    return query.offset((page - 1) * limit).limit(limit).all()

@router.get("/posts/{post_id}", response_model=ForumPostOut)
def get_post_detail(post_id: int, db: Session = Depends(get_db)):
    post = db.query(ForumPost).options(joinedload(ForumPost.author)).filter(ForumPost.id == post_id, ForumPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forum post not found")

    replies = db.query(ForumReply).options(joinedload(ForumReply.author)).filter(
        ForumReply.post_id == post_id,
        ForumReply.is_deleted == False
    ).order_by(ForumReply.created_at.asc()).all()
    post.replies = build_reply_tree(replies)
    return post

@router.post("/posts", response_model=ForumPostOut, status_code=status.HTTP_201_CREATED)
def create_post(post_in: ForumPostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_post = ForumPost(author_id=current_user.id, title=post_in.title, body=post_in.body)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.post("/posts/{post_id}/replies", response_model=ForumReplyOut, status_code=status.HTTP_201_CREATED)
def create_reply(
    post_id: int,
    reply_in: ForumReplyCreate,
    parent_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    selected_parent_id = reply_in.parent_id or parent_id
    post = db.query(ForumPost).filter(ForumPost.id == post_id, ForumPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forum post not found")

    if selected_parent_id:
        parent = db.query(ForumReply).filter(
            ForumReply.id == selected_parent_id,
            ForumReply.post_id == post_id,
            ForumReply.is_deleted == False
        ).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent reply not found")

    new_reply = ForumReply(post_id=post_id, parent_id=selected_parent_id, author_id=current_user.id, body=reply_in.body)
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    return new_reply

@router.post("/upvote", response_model=UpvoteResponse)
def toggle_upvote(vote_in: UpvoteToggle, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if vote_in.target_type == TargetType.POST:
        target = db.query(ForumPost).filter(ForumPost.id == vote_in.target_id, ForumPost.is_deleted == False).first()
    else:
        target = db.query(ForumReply).filter(ForumReply.id == vote_in.target_id, ForumReply.is_deleted == False).first()

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{vote_in.target_type.value.capitalize()} not found")

    upvote = db.query(Upvote).filter(
        Upvote.user_id == current_user.id,
        Upvote.target_type == vote_in.target_type,
        Upvote.target_id == vote_in.target_id
    ).first()

    if upvote:
        db.delete(upvote)
        target.upvotes = max(0, target.upvotes - 1)
        upvoted = False
    else:
        db.add(Upvote(user_id=current_user.id, target_type=vote_in.target_type, target_id=vote_in.target_id))
        target.upvotes += 1
        upvoted = True

    db.commit()
    db.refresh(target)
    return {"upvoted": upvoted, "upvotes": target.upvotes}

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id, ForumPost.is_deleted == False).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this post")
    post.is_deleted = True
    db.commit()
    return

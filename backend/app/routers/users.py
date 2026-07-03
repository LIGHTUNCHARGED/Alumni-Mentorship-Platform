from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import User
from app.schemas import PublicProfileOut

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=PublicProfileOut)
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).options(joinedload(User.mentor_profile)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

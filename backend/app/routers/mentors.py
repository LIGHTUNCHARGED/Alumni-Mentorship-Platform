from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models import User, MentorProfile, UserRole
from app.schemas import MentorProfileCreate, MentorProfileUpdate, MentorProfileOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/mentors", tags=["mentors"])

@router.get("", response_model=List[MentorProfileOut])
def list_mentors(
    q: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    min_exp: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(MentorProfile).join(User).filter(User.role == UserRole.ALUMNI)
    
    if domain:
        query = query.filter(MentorProfile.domain == domain)
        
    if min_exp is not None:
        query = query.filter(MentorProfile.years_experience >= min_exp)
        
    if q:
        search_filter = or_(
            User.full_name.ilike(f"%{q}%"),
            MentorProfile.domain.ilike(f"%{q}%"),
            MentorProfile.bio.ilike(f"%{q}%"),
            MentorProfile.tags.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)
        
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()
    return results

@router.get("/{mentor_id}", response_model=MentorProfileOut)
def get_mentor_detail(mentor_id: int, db: Session = Depends(get_db)):
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == mentor_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found"
        )
    return profile

@router.post("/profile", response_model=MentorProfileOut, status_code=status.HTTP_201_CREATED)
def create_mentor_profile(
    profile_in: MentorProfileCreate,
    current_user: User = Depends(require_role(UserRole.ALUMNI)),
    db: Session = Depends(get_db)
):
    # Check if profile already exists
    existing_profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mentor profile already exists"
        )
    
    # Create profile
    new_profile = MentorProfile(
        user_id=current_user.id,
        domain=profile_in.domain,
        years_experience=profile_in.years_experience,
        bio=profile_in.bio,
        availability=profile_in.availability,
        tags=profile_in.tags
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.put("/profile", response_model=MentorProfileOut)
def update_mentor_profile(
    profile_in: MentorProfileUpdate,
    current_user: User = Depends(require_role(UserRole.ALUMNI)),
    db: Session = Depends(get_db)
):
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found. Please create it first."
        )
    
    # Update fields
    profile.domain = profile_in.domain
    profile.years_experience = profile_in.years_experience
    profile.bio = profile_in.bio
    profile.availability = profile_in.availability
    profile.tags = profile_in.tags
    
    db.commit()
    db.refresh(profile)
    return profile

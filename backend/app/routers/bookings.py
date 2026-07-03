from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, MentorProfile, BookingRequest, BookingStatus, UserRole
from app.schemas import BookingRequestCreate, BookingRequestOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("", response_model=BookingRequestOut, status_code=status.HTTP_201_CREATED)
def create_booking_request(
    booking_in: BookingRequestCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    # Verify mentor exists and has a profile
    mentor_profile = db.query(MentorProfile).filter(MentorProfile.user_id == booking_in.mentor_id).first()
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found"
        )
    
    # Create booking request
    new_booking = BookingRequest(
        student_id=current_user.id,
        mentor_id=booking_in.mentor_id,
        preferred_datetime=booking_in.preferred_datetime,
        topic=booking_in.topic,
        message=booking_in.message,
        status=BookingStatus.PENDING
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@router.get("", response_model=List[BookingRequestOut])
def list_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.STUDENT:
        bookings = db.query(BookingRequest).filter(BookingRequest.student_id == current_user.id).all()
    else:
        bookings = db.query(BookingRequest).filter(BookingRequest.mentor_id == current_user.id).all()
    return bookings

@router.patch("/{booking_id}/accept", response_model=BookingRequestOut)
def accept_booking(
    booking_id: int,
    current_user: User = Depends(require_role(UserRole.ALUMNI)),
    db: Session = Depends(get_db)
):
    booking = db.query(BookingRequest).filter(
        BookingRequest.id == booking_id,
        BookingRequest.mentor_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
        
    booking.status = BookingStatus.ACCEPTED
    db.commit()
    db.refresh(booking)
    return booking

@router.patch("/{booking_id}/decline", response_model=BookingRequestOut)
def decline_booking(
    booking_id: int,
    current_user: User = Depends(require_role(UserRole.ALUMNI)),
    db: Session = Depends(get_db)
):
    booking = db.query(BookingRequest).filter(
        BookingRequest.id == booking_id,
        BookingRequest.mentor_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
        
    booking.status = BookingStatus.DECLINED
    db.commit()
    db.refresh(booking)
    return booking

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db)
):
    booking = db.query(BookingRequest).filter(
        BookingRequest.id == booking_id,
        BookingRequest.student_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
        
    db.delete(booking)
    db.commit()
    return

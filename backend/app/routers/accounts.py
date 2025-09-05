from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..database import get_db
from ..dependencies import get_current_user

# Type hints
from ..models import User


router = APIRouter()


@router.get('/', response_model=List[schemas.Account])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(models.Account)
        .filter(models.Account.user_id == current_user.id, models.Account.status == "active")
        .all()
    )


# New endpoint to fetch closed accounts
@router.get('/closed', response_model=List[schemas.Account])
def list_closed_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(models.Account)
        .filter(models.Account.user_id == current_user.id, models.Account.status == "closed")
        .all()
    )


@router.get('/{account_id}', response_model=schemas.Account)
def get_account(account_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(models.Account).get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail='Account not found')
    if account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return account


@router.post('/', response_model=schemas.Account, status_code=201)
def create_account(
    payload: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(models.Account).get(payload.id):
        raise HTTPException(status_code=409, detail='Account id already exists')
    account = models.Account(
        id=payload.id,
        name=payload.name,
        type=payload.type,
        stash_type=payload.stash_type,
        balance=payload.balance,
        goal_amount=payload.goal_amount,
        goal_date=payload.goal_date,
        goal_frequency=payload.goal_frequency,
        user_id=current_user.id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.patch('/{account_id}', response_model=schemas.Account)
def update_account(
    account_id: str,
    payload: schemas.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(models.Account).get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail='Account not found')
    if account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


@router.delete('/{account_id}', status_code=204)
def delete_account(account_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(models.Account).get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail='Account not found')
    if account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete all transactions referencing this account to avoid FK conflicts
    db.query(models.Transaction).filter(
        (models.Transaction.account_id == account_id) |
        (models.Transaction.from_account_id == account_id) |
        (models.Transaction.to_account_id == account_id)
    ).delete(synchronize_session=False)

    db.delete(account)
    db.commit()
    return None


# Endpoint to mark account as closed
@router.patch('/{account_id}/close', response_model=schemas.Account)
def close_account(
    account_id: str,
    payload: schemas.AccountClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(models.Account).get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail='Account not found')
    if account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if account.status == "closed":
        raise HTTPException(status_code=400, detail='Account already closed')
    account.status = "closed"
    account.closed_reason = payload.reason
    db.commit()
    db.refresh(account)
    return account

# Restore account endpoint
@router.patch('/{account_id}/restore', response_model=schemas.Account)
def restore_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(models.Account).get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail='Account not found')
    if account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail='Forbidden')
    if account.status == 'active':
        raise HTTPException(status_code=400, detail='Account already active')
    account.status = 'active'
    account.closed_reason = None
    db.commit()
    db.refresh(account)
    return account



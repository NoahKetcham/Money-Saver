from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import schemas, models
from decimal import Decimal
from ..database import get_db
from ..dependencies import get_current_user

# Type hints
from ..models import User


router = APIRouter()


@router.get('/', response_model=List[schemas.Transaction])
def list_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()


@router.get('/{tx_id}', response_model=schemas.Transaction)
def get_transaction(tx_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(models.Transaction).get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail='Transaction not found')
    if tx.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return tx


@router.post('/', response_model=schemas.Transaction, status_code=201)
def create_transaction(
    payload: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(models.Transaction).get(payload.id):
        raise HTTPException(status_code=409, detail='Transaction id exists')

    # Validate relationships
    if payload.type in ('deposit', 'withdrawal') and not payload.account_id:
        raise HTTPException(status_code=400, detail='account_id required for deposit/withdrawal')
    if payload.type == 'transfer' and not (payload.from_account_id and payload.to_account_id):
        raise HTTPException(status_code=400, detail='from_account_id and to_account_id required for transfer')

    tx = models.Transaction(
        id=payload.id,
        date=payload.date or datetime.utcnow(),
        type=payload.type,
        amount=payload.amount,
        description=payload.description,
        account_id=payload.account_id,
        from_account_id=payload.from_account_id,
        to_account_id=payload.to_account_id,
        user_id=current_user.id,
    )
    db.add(tx)

    amt = Decimal(str(tx.amount))

    zero = Decimal('0')

    # Adjust balances
    if tx.type == 'deposit' and tx.account_id:
        acc = db.query(models.Account).get(tx.account_id)
        acc.balance = (acc.balance or zero) + amt
        acc.last_tx_date = tx.date
    elif tx.type == 'withdrawal' and tx.account_id:
        acc = db.query(models.Account).get(tx.account_id)
        acc.balance = (acc.balance or zero) - amt
        acc.last_tx_date = tx.date
    elif tx.type == 'transfer' and tx.from_account_id and tx.to_account_id:
        from_acc = db.query(models.Account).get(tx.from_account_id)
        to_acc = db.query(models.Account).get(tx.to_account_id)
        from_acc.balance = (from_acc.balance or zero) - amt
        to_acc.balance = (to_acc.balance or zero) + amt
        from_acc.last_tx_date = tx.date
        to_acc.last_tx_date = tx.date

    db.commit()
    db.refresh(tx)
    return tx


@router.delete('/{tx_id}', status_code=204)
def delete_transaction(tx_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(models.Transaction).get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail='Transaction not found')
    if tx.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    amt = Decimal(str(tx.amount))
    zero = Decimal('0')

    # Reverse balances & recompute last_tx_date
    affected_ids = []
    if tx.type == 'deposit' and tx.account_id:
        acc = db.query(models.Account).get(tx.account_id)
        acc.balance = (acc.balance or zero) - amt
        affected_ids.append(acc.id)
    elif tx.type == 'withdrawal' and tx.account_id:
        acc = db.query(models.Account).get(tx.account_id)
        acc.balance = (acc.balance or zero) + amt
        affected_ids.append(acc.id)
    elif tx.type == 'transfer' and tx.from_account_id and tx.to_account_id:
        from_acc = db.query(models.Account).get(tx.from_account_id)
        to_acc = db.query(models.Account).get(tx.to_account_id)
        from_acc.balance = (from_acc.balance or zero) + amt
        to_acc.balance = (to_acc.balance or zero) - amt
        affected_ids.extend([from_acc.id, to_acc.id])

    # Delete and commit first to free row
    db.delete(tx)
    db.commit()

    # Recompute last_tx_date for affected accounts
    for acc_id in set(affected_ids):
        latest = db.query(models.Transaction.date).filter(
            (models.Transaction.account_id == acc_id) |
            (models.Transaction.from_account_id == acc_id) |
            (models.Transaction.to_account_id == acc_id)
        ).order_by(models.Transaction.date.desc()).first()
        acc = db.query(models.Account).get(acc_id)
        acc.last_tx_date = latest[0] if latest else None

    db.commit()
    return None



from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime, date


class AccountBase(BaseModel):
    name: str
    type: Literal['Checking','Savings','Credit Card','Cash','Investment','Other']
    balance: float
    stash_type: Literal['Cash','Bank','Crypto Wallet','Investment'] = 'Bank'
    goal_amount: Optional[float] = None
    goal_date: Optional[date] = None


class AccountCreate(AccountBase):
    id: str


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None
    goal_amount: Optional[float] = None
    goal_date: Optional[date] = None
    stash_type: Optional[str] = None


class Account(AccountBase):
    id: str
    last_tx_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    date: Optional[datetime] = None
    type: Literal['deposit','withdrawal','transfer']
    amount: float
    description: str
    account_id: Optional[str] = None
    from_account_id: Optional[str] = None
    to_account_id: Optional[str] = None


class TransactionCreate(TransactionBase):
    id: str


class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    account_id: Optional[str] = None
    from_account_id: Optional[str] = None
    to_account_id: Optional[str] = None


class Transaction(TransactionBase):
    id: str

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(UserBase):
    id: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"



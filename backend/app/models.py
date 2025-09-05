from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from passlib.hash import bcrypt

from .database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    balance = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="active", index=True)  # active | closed
    closed_reason = Column(String, nullable=True)
    stash_type = Column(String, nullable=False, default="Bank")
    goal_amount = Column(Numeric(12, 2), nullable=True)
    goal_date = Column(Date, nullable=True)
    goal_frequency = Column(String, nullable=True)  # daily, weekly, monthly
    last_tx_date = Column(DateTime, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Only link transactions where this account_id matches the Transaction.account_id (deposits/withdrawals)
    transactions = relationship(
        "Transaction",
        back_populates="account",
        cascade="all, delete-orphan",
        primaryjoin="Account.id == Transaction.account_id",
        foreign_keys="Transaction.account_id",
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    type = Column(String, nullable=False)  # deposit | withdrawal | transfer
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String, nullable=False)

    account_id = Column(String, ForeignKey("accounts.id"), nullable=True)
    from_account_id = Column(String, ForeignKey("accounts.id"), nullable=True)
    to_account_id = Column(String, ForeignKey("accounts.id"), nullable=True)
    # Owner of this transaction
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    from_account = relationship("Account", foreign_keys=[from_account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])

    __table_args__ = (
        CheckConstraint("(type in ('deposit','withdrawal') and account_id is not null) or (type = 'transfer' and from_account_id is not null and to_account_id is not null)",
                        name="transactions_type_accounts_check"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

    accounts = relationship("Account", backref="user")

    def set_password(self, password: str):
        self.password_hash = bcrypt.hash(password)

    def verify_password(self, password: str) -> bool:
        return bcrypt.verify(password, self.password_hash)



from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ChallengeBase(SQLModel):
    title: str
    description: str
    category: str
    prize_pool: float = Field(default=0, ge=0)
    duration_hours: int = Field(default=24, ge=1)
    allow_random_stop: bool = False
    image: Optional[str] = None
    treasury_address: str


class Challenge(ChallengeBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    creator_public_key: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    deadline: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=24))
    status: str = Field(default="active")


class ChallengeCreate(ChallengeBase):
    creator_public_key: str


class ChallengeRead(ChallengeBase):
    id: UUID
    creator_public_key: str
    created_at: datetime
    deadline: datetime
    status: str
    bet_count: int = 0
    total_bet_amount: float = 0
    yes_amount: float = 0
    no_amount: float = 0


class BetBase(SQLModel):
    challenge_id: UUID = Field(foreign_key="challenge.id")
    bettor_public_key: str
    amount: float = Field(ge=0)
    side: str = Field(regex="^(yes|no)$")
    signature: str
    destination: str


class Bet(BetBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="confirmed")


class BetCreate(BetBase):
    pass


class BetRead(BetBase):
    id: UUID
    recorded_at: datetime
    status: str


class ChallengeDetail(ChallengeRead):
    bets: list[BetRead] = []

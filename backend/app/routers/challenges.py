from datetime import datetime, timedelta
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Bet, BetRead, Challenge, ChallengeCreate, ChallengeDetail, ChallengeRead

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _map_challenge(challenge: Challenge, session: Session) -> ChallengeRead:
    bets = session.exec(select(Bet).where(Bet.challenge_id == challenge.id)).all()
    total_bet_amount = sum(bet.amount for bet in bets)
    yes_amount = sum(bet.amount for bet in bets if bet.side == "yes")
    no_amount = sum(bet.amount for bet in bets if bet.side == "no")

    return ChallengeRead(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        category=challenge.category,
        prize_pool=challenge.prize_pool,
        duration_hours=challenge.duration_hours,
        allow_random_stop=challenge.allow_random_stop,
        image=challenge.image,
        treasury_address=challenge.treasury_address,
        creator_public_key=challenge.creator_public_key,
        created_at=challenge.created_at,
        deadline=challenge.deadline,
        status=challenge.status,
        bet_count=len(bets),
        total_bet_amount=total_bet_amount,
        yes_amount=yes_amount,
        no_amount=no_amount,
    )


@router.get("/", response_model=List[ChallengeRead])
def list_challenges(session: Session = Depends(get_session)) -> List[ChallengeRead]:
    challenges = session.exec(select(Challenge).order_by(Challenge.created_at.desc())).all()
    return [_map_challenge(challenge, session) for challenge in challenges]


@router.post("/", response_model=ChallengeRead, status_code=201)
def create_challenge(payload: ChallengeCreate, session: Session = Depends(get_session)) -> ChallengeRead:
    now = datetime.utcnow()
    deadline = now + timedelta(hours=payload.duration_hours)

    challenge = Challenge(
        **payload.model_dump(),
        created_at=now,
        deadline=deadline,
    )

    session.add(challenge)
    session.commit()
    session.refresh(challenge)

    return _map_challenge(challenge, session)


@router.get("/{challenge_id}", response_model=ChallengeDetail)
def get_challenge(challenge_id: UUID, session: Session = Depends(get_session)) -> ChallengeDetail:
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    challenge_read = _map_challenge(challenge, session)
    bets = session.exec(select(Bet).where(Bet.challenge_id == challenge_id).order_by(Bet.recorded_at.desc())).all()
    bet_reads = [
        BetRead(
            id=bet.id,
            challenge_id=bet.challenge_id,
            bettor_public_key=bet.bettor_public_key,
            amount=bet.amount,
            side=bet.side,
            signature=bet.signature,
            destination=bet.destination,
            recorded_at=bet.recorded_at,
            status=bet.status,
        )
        for bet in bets
    ]

    return ChallengeDetail(**challenge_read.model_dump(), bets=bet_reads)

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Bet, BetCreate, BetRead, Challenge
from ..solana import solana_client

router = APIRouter(prefix="/challenges", tags=["bets"])


@router.post("/{challenge_id}/bets", response_model=BetRead, status_code=201)
def create_bet(challenge_id: UUID, payload: BetCreate, session: Session = Depends(get_session)) -> BetRead:
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if payload.destination != challenge.treasury_address:
        raise HTTPException(status_code=400, detail="Destination does not match challenge treasury")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    if not solana_client.verify_transfer(
        payload.signature,
        destination=payload.destination,
        min_amount=payload.amount,
    ):
        raise HTTPException(status_code=400, detail="Unable to verify transaction on Solana")

    bet = Bet(
        challenge_id=challenge_id,
        bettor_public_key=payload.bettor_public_key,
        amount=payload.amount,
        side=payload.side,
        signature=payload.signature,
        destination=payload.destination,
    )

    session.add(bet)
    session.commit()
    session.refresh(bet)

    return BetRead.model_validate(bet)


@router.get("/{challenge_id}/bets", response_model=List[BetRead])
def list_bets(challenge_id: UUID, session: Session = Depends(get_session)) -> List[BetRead]:
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    bets = session.exec(select(Bet).where(Bet.challenge_id == challenge_id).order_by(Bet.recorded_at.desc())).all()
    return [BetRead.model_validate(bet) for bet in bets]

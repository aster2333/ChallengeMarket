"""Utility helpers for seeding the local database with starter data."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable

from sqlmodel import Session, select

from .models import Bet, Challenge


def seed_initial_data(session: Session) -> None:
    """Populate the database with mock challenges and bets when empty."""

    has_existing_data = session.exec(select(Challenge.id).limit(1)).first()
    if has_existing_data:
        return

    now = datetime.utcnow()
    sample_challenges: Iterable[dict] = [
        {
            "title": "Solana Step Challenge",
            "description": "Complete 20,000 steps a day for three days and share your proof of activity on-chain.",
            "category": "fitness",
            "prize_pool": 12.5,
            "duration_hours": 72,
            "allow_random_stop": False,
            "image": "https://images.solanarpc.io/challenges/fitness.jpg",
            "treasury_address": "5E7PDc2zCiywqU8qR1s3LhCEr9B2SdS6uGX6NvJ3VtxP",
            "creator_public_key": "5E7PDc2zCiywqU8qR1s3LhCEr9B2SdS6uGX6NvJ3VtxP",
            "status": "active",
            "created_offset_hours": 18,
            "bets": [
                {
                    "bettor_public_key": "7tJ16tCrttzWcSPSXAd9k1BTBE6yEoZk6NMFNP5JjvJY",
                    "amount": 1.5,
                    "side": "yes",
                    "signature": "mock_signature_step_yes",
                    "destination": "Fdk5qP1s5vLYQJPuZd6kL5Gf7zYvGv1dHYdFDQnYv7xV",
                },
                {
                    "bettor_public_key": "4KJe1ZgNn1o1hYt2Xb2fTmG2o1C8j1Hyv1Y5R5J5LwQL",
                    "amount": 0.9,
                    "side": "no",
                    "signature": "mock_signature_step_no",
                    "destination": "8fHq4n6UEA6wM2y5UpFuTQjKb8SYpqgqE5zJG1U2kz7r",
                },
            ],
        },
        {
            "title": "On-Chain Buildathon Sprint",
            "description": "Ship a Solana DeFi proof-of-concept before Friday and demo it in a public video call.",
            "category": "business",
            "prize_pool": 25.0,
            "duration_hours": 120,
            "allow_random_stop": True,
            "image": "https://images.solanarpc.io/challenges/learning.jpg",
            "treasury_address": "9yoQ1L4kqL2vR5AjPZrXjVLVSDh3GrbVEdEEVd1hnRCx",
            "creator_public_key": "9yoQ1L4kqL2vR5AjPZrXjVLVSDh3GrbVEdEEVd1hnRCx",
            "status": "voting",
            "created_offset_hours": 54,
            "bets": [
                {
                    "bettor_public_key": "3Gx8x1wXb4Xz6s13jCPs3JgXKm2P4dGQdL6wX7HsQm9L",
                    "amount": 3.2,
                    "side": "yes",
                    "signature": "mock_signature_build_yes",
                    "destination": "6Lt1xA2Ew2U5dL3pWrZV9yRg3SdJkqJLcvLxS5YVTjcg",
                },
                {
                    "bettor_public_key": "7PsVnyL4FX5J3w2Hr9PDv1RJ5oGx2Yp3F1kN5cQ7Qy4C",
                    "amount": 2.1,
                    "side": "yes",
                    "signature": "mock_signature_build_yes_2",
                    "destination": "2kTYbFbS2Rf9f9xHYjd4xpp5fNJf3uS5fDD2h51ifLP4",
                },
            ],
        },
        {
            "title": "Daily NFT Sketch Marathon",
            "description": "Mint a new hand-drawn NFT every evening for a week and share the metadata with the group.",
            "category": "creative",
            "prize_pool": 6.5,
            "duration_hours": 48,
            "allow_random_stop": False,
            "image": "https://images.solanarpc.io/challenges/creative.jpg",
            "treasury_address": "6Q3G6jzP3p7dN6xD3z4f5c67YZq3B5v1h2Jw6cFs5nGk",
            "creator_public_key": "6Q3G6jzP3p7dN6xD3z4f5c67YZq3B5v1h2Jw6cFs5nGk",
            "status": "completed",
            "created_offset_hours": 96,
            "bets": [
                {
                    "bettor_public_key": "5b6Qn8Mc4Lp9wq7cB2fR1vTg8dL2zJx6kN4mH7sK0pVr",
                    "amount": 0.75,
                    "side": "yes",
                    "signature": "mock_signature_nft_yes",
                    "destination": "F6d3xZq4Vb8jMn2Qp5Rt6Ly7Wj8Cv9Bv1Nm2Qw3Er4Ty",
                },
                {
                    "bettor_public_key": "2xN4qJ5h8Fr6Ts3Bw1Ld7Vs9Hk3Gp5Qw7Ey9Vt1Qm6Lp",
                    "amount": 1.1,
                    "side": "no",
                    "signature": "mock_signature_nft_no",
                    "destination": "H3kL5pO7sJ9dFg1Hj3Kl5Pn7Sd9Fg1Hj3Kl5Pn7Sd9Fg",
                },
            ],
        },
    ]

    for entry in sample_challenges:
        created_at = now - timedelta(hours=entry.get("created_offset_hours", 0))
        duration_hours = entry["duration_hours"]

        challenge = Challenge(
            title=entry["title"],
            description=entry["description"],
            category=entry["category"],
            prize_pool=entry["prize_pool"],
            duration_hours=duration_hours,
            allow_random_stop=entry["allow_random_stop"],
            image=entry.get("image"),
            treasury_address=entry["treasury_address"],
            creator_public_key=entry["creator_public_key"],
            status=entry.get("status", "active"),
            created_at=created_at,
            deadline=created_at + timedelta(hours=duration_hours),
        )

        session.add(challenge)
        session.flush()

        for bet_data in entry.get("bets", []):
            bet = Bet(
                challenge_id=challenge.id,
                bettor_public_key=bet_data["bettor_public_key"],
                amount=bet_data["amount"],
                side=bet_data["side"],
                signature=bet_data["signature"],
                destination=bet_data["destination"],
            )
            session.add(bet)

    session.commit()

import os
from functools import lru_cache
from typing import List


class Settings:
    """Application configuration with environment fallbacks."""

    api_prefix: str = "/api"

    def __init__(self) -> None:
        self.database_url: str = os.getenv("CHALLENGE_MARKET_DATABASE_URL", "sqlite:///./challenge_market.db")
        self.solana_rpc_url: str = os.getenv("CHALLENGE_MARKET_SOLANA_RPC", "https://api.devnet.solana.com")
        self.allowed_origins: List[str] = (
            os.getenv("CHALLENGE_MARKET_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
            .split(",")
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

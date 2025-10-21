from __future__ import annotations

from typing import Optional

from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed

from .config import settings


class SolanaClient:
    """Lightweight wrapper around the Solana JSON RPC client."""

    def __init__(self, endpoint: Optional[str] = None) -> None:
        self.endpoint = endpoint or settings.solana_rpc_url
        self._client = Client(self.endpoint)

    def verify_transfer(self, signature: str, *, destination: Optional[str] = None, min_amount: Optional[float] = None) -> bool:
        """Verify that a transfer transaction reached the destination with at least the specified amount of SOL."""
        response = self._client.get_transaction(signature, commitment=Confirmed, encoding="jsonParsed")

        result = response.get("result")
        if not result:
            return False

        meta = result.get("meta")
        if not meta or meta.get("err"):
            return False

        transaction = result.get("transaction")
        if not transaction:
            return False

        message = transaction.get("message", {})
        instructions = message.get("instructions", [])

        found_transfer = False
        lamports = 0
        dest = None

        for instruction in instructions:
            parsed = instruction.get("parsed")
            if not parsed:
                continue

            if parsed.get("type") != "transfer":
                continue

            info = parsed.get("info", {})
            dest = info.get("destination")
            lamports = int(info.get("lamports", 0))
            found_transfer = True
            break

        if not found_transfer:
            return False

        if destination and dest != destination:
            return False

        if min_amount is not None and lamports < int(min_amount * 1_000_000_000):
            return False

        return True


solana_client = SolanaClient()

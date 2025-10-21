# Challenge Market Backend

FastAPI service that persists challenge metadata, records Solana bet transactions, and verifies transfer signatures on Devnet.

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API listens on `http://127.0.0.1:8000` by default. Configure the base URL on the frontend with `VITE_API_BASE_URL`.

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `CHALLENGE_MARKET_DATABASE_URL` | SQL database URL | `sqlite:///./challenge_market.db` |
| `CHALLENGE_MARKET_SOLANA_RPC` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `CHALLENGE_MARKET_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |

## API overview

- `GET /health` – Healthcheck with Solana RPC status.
- `GET /api/challenges` – List all challenges with aggregated bet totals.
- `POST /api/challenges` – Create a new challenge.
- `GET /api/challenges/{id}` – Retrieve a single challenge and its bets.
- `POST /api/challenges/{id}/bets` – Record a bet after verifying the on-chain transfer.
- `GET /api/challenges/{id}/bets` – List bets for a challenge.

All bet submissions are verified against the configured Solana RPC to ensure the transfer signature exists and matches the treasury address.

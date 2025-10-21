# Challenge Market

Solana-native challenge market with a Vite + React frontend and FastAPI backend. Users can create challenges, back them with SOL on Devnet, and record verified bet transactions.

## Project structure

```
.
├── backend/               # FastAPI application and SQLite persistence
├── src/                   # React application source code
├── public/
└── types/                 # Shared TypeScript DTOs
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- Solana wallet (Phantom, Solflare, Backpack…) funded on Devnet

## Environment variables

Create a `.env` file (or export environment variables) with:

```bash
# Frontend
VITE_API_BASE_URL=http://localhost:8000
VITE_TREASURY_ADDRESS=<SOLANA_PUBLIC_KEY_FOR_CHALLENGE_TREASURY>
```

Optional backend overrides can be found in [`backend/README.md`](backend/README.md).

## Running locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will start on `http://127.0.0.1:8000`.

### Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and connect a Solana wallet on Devnet. Challenge creation calls the backend API, and placing a bet sends a SOL transfer via the connected wallet. The backend verifies the signature before recording the bet.

## Testing bets on Devnet

1. Request Devnet SOL from the [Solana faucet](https://faucet.solana.com/).
2. Create a challenge with a treasury address you control.
3. Use the “Buy YES/NO” buttons to send SOL. The signature is verified against the configured RPC before it is saved.

## Production considerations

- Configure a persistent database (e.g., Postgres) instead of SQLite.
- Securely manage escrow keypairs if the backend is responsible for challenge treasuries.
- Add rate limiting and authentication to the API before mainnet deployment.

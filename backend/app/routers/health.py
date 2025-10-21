from fastapi import APIRouter

from ..solana import solana_client

router = APIRouter(tags=["health"])


@router.get("/health")
def healthcheck() -> dict[str, str]:
    try:
        # Lightweight ping to ensure RPC reachable
        version = solana_client._client.get_version()
        rpc_status = "ok" if version.get("result") else "degraded"
    except Exception:
        rpc_status = "unreachable"

    return {"status": "ok", "solanaRpc": rpc_status}

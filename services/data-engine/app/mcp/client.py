"""Async HTTP client that invokes the FastAPI app in-process (via ASGI, no network socket).

MCP tools call this instead of the OpenF1 service functions directly so that they reuse the
same request validation, response contracts and error handling as the public REST API.
"""
from __future__ import annotations

from typing import Any

import httpx

BASE_URL = "http://data-engine.internal/api/v1"


class ApiError(Exception):
    """Raised when the wrapped API call returns an HTTP error status."""

    def __init__(self, status_code: int, detail: Any):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"API request failed with status {status_code}: {detail}")


def describe_detail(detail: Any) -> str:
    """Turn an API error body into a sentence an LLM (or a person) can act on."""
    if isinstance(detail, str):
        return detail
    if isinstance(detail, dict):
        return str(detail.get("message") or detail.get("code") or detail)
    if isinstance(detail, list):
        # FastAPI validation errors: [{"loc": ["query", "year"], "msg": "...", ...}]
        parts = []
        for item in detail:
            if isinstance(item, dict) and "msg" in item:
                where = ".".join(str(p) for p in item.get("loc", []) if p not in ("query", "path", "body"))
                parts.append(f"{where}: {item['msg']}" if where else str(item["msg"]))
            else:
                parts.append(str(item))
        return "Invalid arguments - " + "; ".join(parts)
    return str(detail)


def _transport_client() -> httpx.AsyncClient:
    # Imported lazily: app.main imports the chat route, which imports the MCP server, which imports this module.
    from app.main import app

    # ASGITransport drives the FastAPI app directly, so no server process needs to be running.
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=BASE_URL)


def _clean(params: dict[str, Any] | None) -> dict[str, Any]:
    return {k: v for k, v in (params or {}).items() if v is not None}


async def get(path: str, params: dict[str, Any] | None = None) -> dict:
    async with _transport_client() as client:
        response = await client.get(path, params=_clean(params))
    return _unwrap(response)


async def post(path: str, json: dict[str, Any] | None = None, params: dict[str, Any] | None = None) -> dict:
    async with _transport_client() as client:
        response = await client.post(path, json=json, params=_clean(params))
    return _unwrap(response)


def _unwrap(response: httpx.Response) -> dict:
    if response.status_code >= 400:
        try:
            detail = response.json().get("detail", response.text)
        except ValueError:
            detail = response.text
        raise ApiError(response.status_code, detail)
    return response.json()

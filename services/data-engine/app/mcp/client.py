"""Async HTTP client that invokes the FastAPI app in-process (via ASGI, no network socket).

MCP tools call this instead of the OpenF1 service functions directly so that they reuse the
same request validation, response contracts and error handling as the public REST API.
"""
from __future__ import annotations

from typing import Any

import httpx

from app.main import app

BASE_URL = "http://data-engine.internal/api/v1"


class ApiError(Exception):
    """Raised when the wrapped API call returns an HTTP error status."""

    def __init__(self, status_code: int, detail: Any):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"API request failed with status {status_code}: {detail}")


def _transport_client() -> httpx.AsyncClient:
    # ASGITransport drives the FastAPI app directly, so no server process needs to be running.
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url=BASE_URL)


async def get(path: str, params: dict[str, Any] | None = None) -> dict:
    clean_params = {k: v for k, v in (params or {}).items() if v is not None}
    async with _transport_client() as client:
        response = await client.get(path, params=clean_params)
    return _unwrap(response)


async def post(path: str, json: dict[str, Any] | None = None, params: dict[str, Any] | None = None) -> dict:
    clean_params = {k: v for k, v in (params or {}).items() if v is not None}
    async with _transport_client() as client:
        response = await client.post(path, json=json, params=clean_params)
    return _unwrap(response)


def _unwrap(response: httpx.Response) -> dict:
    if response.status_code >= 400:
        try:
            detail = response.json().get("detail", response.text)
        except ValueError:
            detail = response.text
        raise ApiError(response.status_code, detail)
    return response.json()

"""WebSocket connection manager (replaces Socket.io / sockets/index.js).

Messages are JSON objects: {"event": <str>, "data": <any>}.
Clients join a per-call room ("call:<id>") to receive that call's updates.
"""
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: set[WebSocket] = set()
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.active.discard(ws)
        for members in self.rooms.values():
            members.discard(ws)

    def join(self, room: str, ws: WebSocket) -> None:
        self.rooms.setdefault(room, set()).add(ws)

    async def broadcast(self, event: str, data: Any) -> None:
        await self._send_many(self.active, event, data)

    async def send_to_room(self, room: str, event: str, data: Any) -> None:
        await self._send_many(self.rooms.get(room, set()), event, data)

    async def _send_many(self, conns: set[WebSocket], event: str, data: Any) -> None:
        message = {"event": event, "data": data}
        dead: list[WebSocket] = []
        for ws in list(conns):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


# Single shared instance imported by routers and the /ws endpoint.
manager = ConnectionManager()

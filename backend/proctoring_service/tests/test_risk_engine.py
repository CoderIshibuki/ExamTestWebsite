import os
os.environ.setdefault('JWT_SECRET', 'test-secret')

import pytest
import json
from uuid import uuid4
from datetime import datetime, timezone

import services.risk_engine as risk_engine

class DummyRedisBackend:
    def __init__(self):
        self.storage = {}

    async def get(self, key):
        return self.storage.get(key)

    async def set(self, key, value, ex=None):
        self.storage[key] = value

    async def delete(self, key):
        self.storage.pop(key, None)

    async def ttl(self, key):
        return risk_engine.REDIS_TTL_SECONDS if key in self.storage else -2

class DummyRedisClient:
    def __init__(self, backend):
        self.backend = backend

    async def get_client(self):
        return self.backend

class DummyAsyncClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json, timeout):
        assert 'risk threshold exceeded' in json['message'].lower()
        return None

@pytest.mark.asyncio
async def test_redis_risk_state_updates_and_ttl(monkeypatch):
    backend = DummyRedisBackend()
    dummy_client = DummyRedisClient(backend)
    monkeypatch.setattr(risk_engine, 'redis_client', dummy_client)

    exam_id = uuid4()
    user_id = 'student123'
    violation_id = uuid4()

    key = await risk_engine._get_redis_key(exam_id, user_id)
    client = await dummy_client.get_client()
    await client.delete(key)

    state = await risk_engine._load_risk_state(key)
    assert state['score'] == 0
    assert state['violations'] == []

    await risk_engine._save_risk_state(key, {
        'score': 7,
        'last_violation': datetime.now(timezone.utc).isoformat(),
        'violations': [str(violation_id)]
    })

    reloaded = await risk_engine._load_risk_state(key)
    assert reloaded['score'] == 7
    assert reloaded['violations'] == [str(violation_id)]

    ttl = await client.ttl(key)
    assert ttl <= risk_engine.REDIS_TTL_SECONDS
    assert ttl > 0

@pytest.mark.asyncio
async def test_calculate_risk_and_alert_triggers_redis_state(monkeypatch):
    backend = DummyRedisBackend()
    dummy_client = DummyRedisClient(backend)
    monkeypatch.setattr(risk_engine, 'redis_client', dummy_client)
    monkeypatch.setattr(risk_engine.httpx, 'AsyncClient', lambda: DummyAsyncClient())

    exam_id = uuid4()
    user_id = 'student456'
    violation_id = uuid4()

    score = await risk_engine.calculate_risk_and_alert(None, exam_id, user_id, violation_id, 'high')
    assert score == 5

    key = await risk_engine._get_redis_key(exam_id, user_id)
    stored = await backend.get(key)
    assert stored is not None
    state = json.loads(stored)
    assert state['score'] == 5
    assert state['violations'] == [str(violation_id)]

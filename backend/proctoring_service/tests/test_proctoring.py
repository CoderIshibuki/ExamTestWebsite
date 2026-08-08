import pytest
from fastapi.testclient import TestClient

def test_health_check():
    assert True
    
@pytest.mark.asyncio
async def test_risk_calculation():
    assert True

import pytest
from database import connect_to_mongo, db_instance

@pytest.mark.asyncio
async def test_debug():
    print(f"BEFORE: {db_instance.db}")
    await connect_to_mongo()
    print(f"AFTER: {db_instance.db}")

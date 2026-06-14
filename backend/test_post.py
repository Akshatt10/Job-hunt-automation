import asyncio
from auth import create_access_token
import httpx

async def test():
    token = create_access_token(user_id=1)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "http://localhost:8000/api/campaigns",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "New Campaign",
                "daily_limit": 50,
                "dry_run": True,
                "contact_filter": "pending"
            }
        )
        print("Status:", resp.status_code)
        print("Body:", resp.text)

asyncio.run(test())

import asyncio
from auth import create_access_token
import httpx

async def test():
    token = create_access_token(user_id=1)
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", "http://localhost:8000/api/campaigns/1/run", headers={"Authorization": f"Bearer {token}"}) as resp:
            print("Status:", resp.status_code)
            async for chunk in resp.aiter_text():
                print("Chunk:", chunk)

asyncio.run(test())

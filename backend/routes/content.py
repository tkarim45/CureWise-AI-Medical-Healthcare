from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException
from jose import jwt

router = APIRouter()
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        return payload["id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/blog")
async def get_blog(user_id: int = Depends(get_current_user)):
    return {
        "posts": [
            {
                "title": "AI in Healthcare",
                "content": "Exploring how AI can transform patient care...",
            }
        ]
    }

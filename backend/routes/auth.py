from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
import logging
import psycopg2
from config.settings import settings
from models.schemas import UserCreate, Token, LoginRequest, UserResponse
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Retrieve the current user from a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise HTTPException(status_code=401, detail="Invalid token")
        logger.info(f"Authenticated user: {user_id}, role: {role}")
        return {"user_id": user_id, "role": role}
    except JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(role: str):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return current_user

    return role_checker


@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    """Register a new user."""
    logger.info(f"Attempting signup for username: {user.username}")
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        "SELECT username, email FROM users WHERE username = %s OR email = %s",
        (user.username, user.email),
    )
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = pwd_context.hash(user.password)
    user_id = str(uuid.uuid4())
    created_at = datetime.utcnow()  # Use TIMESTAMP directly
    role = "user"  # Restrict to 'user' role
    try:
        c.execute(
            """
            INSERT INTO users (id, username, email, password, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, user.username, user.email, hashed_password, role, created_at),
        )
        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="Error creating user")

    conn.close()

    access_token = create_access_token(
        data={"sub": user_id, "role": role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    logger.info(f"User signed up: {user.username}")
    return {
        "token": access_token,
        "user": UserResponse(
            id=user_id, username=user.username, email=user.email, role=role
        ),
    }


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Authenticate a user and return a JWT token."""
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        "SELECT id, username, email, password, role FROM users WHERE username = %s",
        (login_data.username,),
    )
    user = c.fetchone()
    conn.close()

    if not user or not pwd_context.verify(
        login_data.password, user[3]
    ):  # user[3] is password
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    user_id, username, email, _, role = user
    access_token = create_access_token(
        data={"sub": user_id, "role": role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    logger.info(f"User logged in: {username}, role: {role}")
    response = {
        "token": access_token,
        "user": UserResponse(id=user_id, username=username, email=email, role=role),
    }
    conn.close()
    logger.debug(f"Login response: {response}")
    return response

from datetime import datetime
from typing import Optional, List
import os

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import binascii
import uuid
from sqlmodel import SQLModel, Field, create_engine, Session, select

# Development-mode backend (no JWT) with workflow, notifications (polling) and audit

SALT_BYTES = 16
PBKDF2_ITERATIONS = 200_000

app = FastAPI(title="Key Harmony Sync API - DEV MODE")

# CORS for local dev
# In development allow the frontend on variable ports (Vite may fall back to 8081 or network addresses).
# For local development it's fine to allow all origins; DO NOT use this in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Database models ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    is_admin: bool = False


class Secret(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int
    name: str
    value: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SecretRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    requester_id: int
    secret_name: str
    reason: Optional[str] = None
    status: str = Field(default="pending")  # pending / in_review / awaiting_admin / ready / denied
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    admin_comment: Optional[str] = None
    secret_id: Optional[int] = None
    notifications: Optional[str] = None


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = None
    action: str = Field(index=True)
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Pydantic-compatible models for API
class LoginRequest(SQLModel):
    username: str
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class RequestCreate(SQLModel):
    secret_name: str
    reason: Optional[str] = None


class RequestOut(SQLModel):
    id: int
    requester_id: int
    requester_username: Optional[str] = None
    secret_name: str
    reason: Optional[str]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    admin_comment: Optional[str]
    secret_id: Optional[int]


# Database setup (support DATABASE_URL env for Postgres; fallback to sqlite file)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite")
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def get_password_hash(password: str) -> str:
    salt = os.urandom(SALT_BYTES)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${binascii.hexlify(salt).decode()}${binascii.hexlify(dk).decode()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        scheme, iter_str, salt_hex, hash_hex = stored_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iterations = int(iter_str)
        salt = binascii.unhexlify(salt_hex)
        dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return binascii.hexlify(dk).decode() == hash_hex
    except Exception:
        return False


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()


# Simple in-memory notifications cache (per user id)
notifications_cache: dict[int, list[str]] = {}

# In-memory session tokens for dev auth: token -> user_id
sessions: dict[str, int] = {}


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Ensure default admin exists
    with Session(engine) as session:
        admin = get_user_by_username(session, "admin")
        if not admin:
            admin_user = User(username="admin", hashed_password=get_password_hash("password"), is_admin=True)
            session.add(admin_user)
            session.commit()


@app.post("/api/login")
def login_for_access_token(form_data: LoginRequest, session: Session = Depends(get_session)):
    user = get_user_by_username(session, form_data.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # DEV MODE: create a random in-memory token
    token = str(uuid.uuid4())
    sessions[token] = user.id
    return {"access_token": token, "token_type": "bearer", "id": user.id, "username": user.username, "is_admin": user.is_admin}


def get_current_user(authorization: str = Header(None), session: Session = Depends(get_session)) -> User:
    """Resolve Bearer token from Authorization header to a DB User object (dev authenticator)."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    token = authorization.split(" ", 1)[1]
    user_id = sessions.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/register")
def register_user(payload: LoginRequest, session: Session = Depends(get_session)):
    """Development helper: create a user (username/password). Not protected.
    Use only in local development. Creates or updates user in the database.
    """
    existing = get_user_by_username(session, payload.username)
    if existing:
        existing.hashed_password = get_password_hash(payload.password)
        session.add(existing)
        session.commit()
        return {"ok": True, "updated": True}
    user = User(username=payload.username, hashed_password=get_password_hash(payload.password), is_admin=False)
    session.add(user)
    session.commit()
    return {"ok": True, "created": True}


@app.post("/api/requests", response_model=RequestOut)
def create_request(payload: RequestCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    req = SecretRequest(requester_id=current_user.id, secret_name=payload.secret_name, reason=payload.reason, status="pending")
    session.add(req)
    session.commit()
    session.refresh(req)
    # Audit log
    session.add(AuditLog(user_id=current_user.id, action="create_request", details=f"secret: {payload.secret_name}"))
    session.commit()
    # Notification
    notifications_cache.setdefault(current_user.id, []).append(f"Заявка создана: {payload.secret_name}")
    # enrich response with username for frontend convenience
    return {
        "id": req.id,
        "requester_id": req.requester_id,
        "requester_username": current_user.username,
        "secret_name": req.secret_name,
        "reason": req.reason,
        "status": req.status,
        "created_at": req.created_at,
        "resolved_at": req.resolved_at,
        "admin_comment": req.admin_comment,
        "secret_id": req.secret_id,
    }


@app.get("/api/requests", response_model=List[RequestOut])
def list_requests(all: bool = False, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if all and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    if current_user.is_admin and all:
        statement = select(SecretRequest)
    else:
        statement = select(SecretRequest).where(SecretRequest.requester_id == current_user.id)
    results = session.exec(statement).all()
    # enrich each request with requester_username
    out = []
    for r in results:
        requester = session.get(User, r.requester_id)
        out.append({
            "id": r.id,
            "requester_id": r.requester_id,
            "requester_username": requester.username if requester else None,
            "secret_name": r.secret_name,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at,
            "resolved_at": r.resolved_at,
            "admin_comment": r.admin_comment,
            "secret_id": r.secret_id,
        })
    return out


@app.post("/api/requests/{request_id}/review")
def review_request(request_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    req = session.get(SecretRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    req.status = "in_review"
    session.add(req)
    session.commit()
    # Audit log
    session.add(AuditLog(user_id=current_user.id, action="review_request", details=f"request_id: {request_id}"))
    session.commit()
    notifications_cache.setdefault(req.requester_id, []).append(f"Заявка {request_id} на рассмотрении")
    return {"ok": True}


@app.post("/api/requests/{request_id}/awaiting_admin")
def awaiting_admin_request(request_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    req = session.get(SecretRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "in_review":
        raise HTTPException(status_code=400, detail="Request not in review")
    req.status = "awaiting_admin"
    session.add(req)
    session.commit()
    session.add(AuditLog(user_id=current_user.id, action="awaiting_admin", details=f"request_id: {request_id}"))
    session.commit()
    notifications_cache.setdefault(req.requester_id, []).append(f"Заявка {request_id} ожидает действий администратора")
    return {"ok": True}


@app.post("/api/requests/{request_id}/approve")
def approve_request(request_id: int, payload: dict, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # only admin can approve
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    req = session.get(SecretRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in ["pending", "in_review", "awaiting_admin"]:
        raise HTTPException(status_code=400, detail="Request already processed")
    secret_value = payload.get("secret_value") if isinstance(payload, dict) else None
    comment = payload.get("comment") if isinstance(payload, dict) else None
    if not secret_value:
        raise HTTPException(status_code=400, detail="secret_value is required")
    secret = Secret(owner_id=req.requester_id, name=req.secret_name, value=secret_value)
    session.add(secret)
    session.commit()
    session.refresh(secret)
    # mark as approved to match frontend expectations
    req.status = "approved"
    req.resolved_at = datetime.utcnow()
    req.admin_comment = comment
    req.secret_id = secret.id
    session.add(req)
    session.commit()
    session.add(AuditLog(user_id=current_user.id, action="approve_request", details=f"request_id: {request_id}, secret_id: {secret.id}"))
    session.commit()
    notifications_cache.setdefault(req.requester_id, []).append(f"Заявка {request_id} одобрена — секрет готов к просмотру")
    return {"ok": True, "secret_id": secret.id}
@app.get("/api/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "is_admin": current_user.is_admin}


@app.post("/api/requests/{request_id}/deny")
def deny_request(request_id: int, payload: dict, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # only admin can deny
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    req = session.get(SecretRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in ["pending", "in_review", "awaiting_admin"]:
        raise HTTPException(status_code=400, detail="Request already processed")
    comment = payload.get("comment") if isinstance(payload, dict) else None
    req.status = "denied"
    req.resolved_at = datetime.utcnow()
    req.admin_comment = comment
    session.add(req)
    session.commit()
    session.add(AuditLog(user_id=current_user.id, action="deny_request", details=f"request_id: {request_id}"))
    session.commit()
    notifications_cache.setdefault(req.requester_id, []).append(f"Заявка {request_id} отклонена")
    return {"ok": True}


@app.get("/api/notifications")
def get_notifications(current_user: User = Depends(get_current_user)):
    return {"notifications": notifications_cache.get(current_user.id, [])}


@app.get("/api/audit")
def get_audit(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    logs = session.exec(select(AuditLog).order_by(AuditLog.created_at.desc())).all()
    return logs


@app.get("/api/secrets")
def list_secrets(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.is_admin:
        statement = select(Secret)
    else:
        statement = select(Secret).where(Secret.owner_id == current_user.id)
    results = session.exec(statement).all()
    return results


@app.get("/api/requests/{request_id}/secret")
def get_request_secret(request_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    req = session.get(SecretRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "approved":
        raise HTTPException(status_code=400, detail="Secret not available yet")
    # only requester or admin can view the secret
    if not (current_user.is_admin or current_user.id == req.requester_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this secret")
    if not req.secret_id:
        raise HTTPException(status_code=404, detail="Secret not found")
    secret = session.get(Secret, req.secret_id)
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    # Audit the view
    session.add(AuditLog(user_id=current_user.id, action="view_secret", details=f"request_id: {request_id}, secret_id: {secret.id}"))
    session.commit()
    return {"secret": secret.value}

import os
import argparse
from typing import Optional

from sqlmodel import SQLModel, Field, create_engine, Session, select
import hashlib
import binascii

SALT_BYTES = 16
PBKDF2_ITERATIONS = 200_000


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    hashed_password: str
    is_admin: bool = False


def get_password_hash(password: str) -> str:
    salt = os.urandom(SALT_BYTES)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${binascii.hexlify(salt).decode()}${binascii.hexlify(dk).decode()}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--username', required=True)
    parser.add_argument('--password', required=True)
    parser.add_argument('--admin', action='store_true')
    args = parser.parse_args()

    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./db.sqlite')
    if DATABASE_URL.startswith('sqlite'):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL)

    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        statement = select(User).where(User.username == args.username)
        existing = session.exec(statement).first()
        if existing:
            print('User exists, updating password and admin flag')
            existing.hashed_password = get_password_hash(args.password)
            existing.is_admin = args.admin
            session.add(existing)
            session.commit()
            print('Updated user', args.username)
            return

        user = User(username=args.username, hashed_password=get_password_hash(args.password), is_admin=args.admin)
        session.add(user)
        session.commit()
        print('Created user', args.username)


if __name__ == '__main__':
    main()

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# For development and testing without spinning up Postgres immediately, we will default to SQLite.
# When you're ready for production, we will set DATABASE_URL="postgresql://user:password@localhost/joymart"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./joymart.db")

# SQLite requires "check_same_thread": False, Postgres doesn't
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

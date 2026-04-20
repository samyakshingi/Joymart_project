import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Production Database Configuration
# NOTE: When deploying to Neon, use the connection string with '-pool' for efficient connection pooling.
# Example: DATABASE_URL="postgresql://user:password@ep-cool-pool-123456-pool.us-east-2.aws.neon.tech/joymart"
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

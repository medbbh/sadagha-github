from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration - Direct PostgreSQL connection to Supabase
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL environment variable is required")

# SQLAlchemy setup with UTF-8 encoding for Arabic text support
engine = create_engine(
    DATABASE_URL,
    # Ensure proper UTF-8 encoding for Arabic text
    connect_args={
        "options": "-c client_encoding=utf8"
    },
    # Connection pool settings
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False  # Set to True for SQL debugging
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load env variables from backend/.env relative to this file's location
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def check_and_upgrade_db():
    import sqlalchemy as sa
    try:
        inspector = sa.inspect(engine)
        if 'orders' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('orders')]
            with engine.begin() as conn:
                if 'assigned_drone_id' not in columns:
                    conn.execute(sa.text("ALTER TABLE orders ADD COLUMN assigned_drone_id INT NULL"))
                    print("Database Schema: Added assigned_drone_id column to orders table")
                if 'eta_minutes' not in columns:
                    conn.execute(sa.text("ALTER TABLE orders ADD COLUMN eta_minutes INT NULL"))
                    print("Database Schema: Added eta_minutes column to orders table")
                if 'timeline' not in columns:
                    conn.execute(sa.text("ALTER TABLE orders ADD COLUMN timeline JSON NULL"))
                    print("Database Schema: Added timeline column to orders table")
    except Exception as e:
        print(f"Database schema auto-check failed or skipped: {e}")

check_and_upgrade_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
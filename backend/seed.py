import os
import sys
from dotenv import load_dotenv

# Ensure the workspace directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine
from backend.models.drone import DroneModel
from sqlalchemy import text

def seed():
    # Load environment variables relative to this file
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(env_path)
    
    db = SessionLocal()
    try:
        # Clear existing drones
        db.query(DroneModel).delete()
        
        # Add new drones matching the frontend expectations
        drones = [
            DroneModel(id=1, name="Northwind-01", status="idle", battery_capacity=94),
            DroneModel(id=2, name="Northwind-02", status="busy", battery_capacity=68),
            DroneModel(id=3, name="Northwind-03", status="charging", battery_capacity=41),
            DroneModel(id=4, name="Northwind-04", status="maintenance", battery_capacity=22)
        ]
        db.add_all(drones)
        db.commit()
        print("Database seeded successfully with 4 drones!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

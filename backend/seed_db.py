import asyncio
import uuid
import json
import csv
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from passlib.context import CryptContext

# Configuration (same as backend)
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/venue_mapping"
CSV_PATH = "../properties_rows.csv" # Adjusted path based on dir structure

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. Create or update default user
        email = "test@qed.com"
        password = "testpassword123"
        password_hash = get_password_hash(password)
        
        result = await session.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
        user = result.fetchone()
        
        if not user:
            user_id = uuid.uuid4()
            await session.execute(
                text("""
                    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
                    VALUES (:id, :name, :email, :password_hash, 'event_manager', true, now(), now())
                """),
                {
                    "id": user_id,
                    "name": "Test Manager",
                    "email": email,
                    "password_hash": password_hash
                }
            )
            print(f"User {email} created.")
        else:
            # Update password for existing user
            await session.execute(
                text("UPDATE users SET password_hash = :password_hash, updated_at = now() WHERE email = :email"),
                {"password_hash": password_hash, "email": email}
            )
            print(f"User {email} password updated.")

        # 2. Seed Brussels Venues
        brussels_venues = [
            {
                "id": uuid.uuid4(),
                "name": "Hotel Amigo",
                "city": "Brussels",
                "capacity": 200,
                "facilities": ["Wi-Fi", "AV equipment", "Luxury", "Catering"],
                "event_types": ["Gala dinners", "Board meetings"],
                "description": "Historic luxury hotel next to the Grand Place with elegant meeting spaces."
            },
            {
                "id": uuid.uuid4(),
                "name": "The Egg Brussels",
                "city": "Brussels",
                "capacity": 999,
                "facilities": ["Wi-Fi", "Ample Space", "Industrial", "Modular"],
                "event_types": ["Conferences", "Product launches"],
                "description": "Unique modular venue with an industrial vibe, perfect for large-scale creative events."
            },
            {
                "id": uuid.uuid4(),
                "name": "Square Brussels Convention Centre",
                "city": "Brussels",
                "capacity": 1200,
                "facilities": ["Wi-Fi", "State-of-the-art AV", "Central", "Terrace"],
                "event_types": ["Conferences", "Exhibitions"],
                "description": "High-tech convention centre in the heart of Brussels with stunning geometric architecture."
            }
        ]

        for v in brussels_venues:
            result = await session.execute(text("SELECT id FROM venues WHERE name = :name"), {"name": v["name"]})
            if not result.fetchone():
                await session.execute(
                    text("""
                        INSERT INTO venues (id, name, city, capacity, facilities, event_types, description_template, is_deleted, created_at, updated_at)
                        VALUES (:id, :name, :city, :capacity, :facilities, :event_types, :description, false, now(), now())
                    """),
                    {
                        "id": v["id"],
                        "name": v["name"],
                        "city": v["city"],
                        "capacity": v["capacity"],
                        "facilities": v["facilities"],
                        "event_types": v["event_types"],
                        "description": v["description"]
                    }
                )
                print(f"Venue {v['name']} created.")

        # 3. Seed Venues from CSV
        if os.path.exists(CSV_PATH):
            with open(CSV_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row['name']
                    # Check if already exists
                    result = await session.execute(text("SELECT id FROM venues WHERE name = :name"), {"name": name})
                    if result.fetchone():
                        continue
                    
                    # Parse city from location
                    city = row['location'].split(',')[0].strip()
                    capacity = int(row['max_guests'])
                    facilities = json.loads(row['amenities'])
                    
                    await session.execute(
                        text("""
                            INSERT INTO venues (id, name, city, capacity, facilities, event_types, description_template, is_deleted, created_at, updated_at)
                            VALUES (:id, :name, :city, :capacity, :facilities, '{"Corporate events"}', :description, false, now(), now())
                        """),
                        {
                            "id": uuid.uuid4(),
                            "name": name,
                            "city": city,
                            "capacity": capacity,
                            "facilities": facilities,
                            "description": row['description']
                        }
                    )
                    print(f"Venue {name} (from CSV) created.")
        else:
            print(f"CSV files not found at {CSV_PATH}")

        await session.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())

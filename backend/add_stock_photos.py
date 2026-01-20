"""
Add stock photos to venues in the database
"""
import asyncio
from sqlalchemy import select
from app.database import get_db
from app.models.venue import Venue
from app.models.photo import Photo

# Unsplash stock photos for venues (conference/event spaces)
VENUE_PHOTOS = [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",  # Modern conference room
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",  # Event space
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",  # Auditorium
    "https://images.unsplash.com/photo-1519167758481-83f29da8c9b7?w=800",  # Meeting room
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800",  # Conference hall
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",  # Modern office space
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",  # Open workspace
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800",  # Banquet hall
    "https://images.unsplash.com/photo-1519167758481-83f29da8c9b7?w=800",  # Theater
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",  # Ballroom
]

async def add_stock_photos():
    """Add stock photos to all venues that don't have photos"""
    async for db in get_db():
        try:
            # Get all venues
            result = await db.execute(select(Venue))
            venues = result.scalars().all()
            
            print(f"Found {len(venues)} venues")
            
            for i, venue in enumerate(venues):
                # Check if venue already has photos with a separate query
                photo_check = await db.execute(
                    select(Photo).where(Photo.venue_id == venue.id)
                )
                existing_photos = photo_check.scalars().all()
                
                if existing_photos:
                    print(f"  {venue.name}: Already has {len(existing_photos)} photo(s), skipping")
                    continue
                
                # Add a stock photo (cycle through the available photos)
                photo_url = VENUE_PHOTOS[i % len(VENUE_PHOTOS)]
                
                # Create a Photo record
                photo = Photo(
                    venue_id=venue.id,
                    url=photo_url,
                    caption=f"{venue.name} - Main Space",
                    display_order=0
                )
                
                db.add(photo)
                print(f"  {venue.name}: Added stock photo")
            
            await db.commit()
            print("\n✅ Stock photos added successfully!")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(add_stock_photos())

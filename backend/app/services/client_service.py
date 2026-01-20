from uuid import UUID
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService:
    """Service for managing clients."""

    async def get_clients(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Client]:
        """Get all clients."""
        query = select(Client).order_by(Client.name).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_client(self, db: AsyncSession, client_id: UUID) -> Optional[Client]:
        """Get client by ID."""
        query = select(Client).where(Client.id == client_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def create_client(self, db: AsyncSession, client_in: ClientCreate) -> Client:
        """Create a new client."""
        client = Client(**client_in.model_dump())
        db.add(client)
        await db.commit()
        await db.refresh(client)
        return client

    async def update_client(
        self, 
        db: AsyncSession, 
        client_id: UUID, 
        client_in: ClientUpdate
    ) -> Optional[Client]:
        """Update a client."""
        client = await self.get_client(db, client_id)
        if not client:
            return None
            
        update_data = client_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(client, field, value)
            
        await db.commit()
        await db.refresh(client)
        return client
        
    async def delete_client(self, db: AsyncSession, client_id: UUID) -> bool:
        """Delete a client."""
        client = await self.get_client(db, client_id)
        if not client:
            return False
        
        await db.delete(client)
        await db.commit()
        return True


# Singleton instance
client_service = ClientService()

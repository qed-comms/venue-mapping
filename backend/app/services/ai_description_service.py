"""AI description generation service using OpenAI."""
from typing import Optional

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.project_venue import ProjectVenue
from app.models.venue import Venue


class AIDescriptionService:
    """Generate venue descriptions using OpenAI GPT-4."""
    
    def __init__(self):
        """Initialize OpenAI client."""
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            print("Warning: OPENAI_API_KEY not set. AI generation will fail.")
    
    async def generate_description(
        self,
        db: AsyncSession,
        project_venue: ProjectVenue,
    ) -> str:
        """Generate AI description from context.
        
        Args:
            db: Database session
            project_venue: ProjectVenue instance with ai_context
            
        Returns:
            Generated description text
            
        Raises:
            Exception: If OpenAI API call fails
        """
        if not self.api_key:
            raise Exception("OpenAI API key not configured")
        
        # Build prompt from ai_context
        context = project_venue.ai_context or {}
        venue = project_venue.venue
        project = project_venue.project
        
        prompt = self._build_prompt(venue, project, context)
        
        # Call OpenAI API
        try:
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",  # Cost-effective model for testing
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional event planner writing compelling venue descriptions for client proposals. Write in a professional yet engaging tone."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=600,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            description = response.choices[0].message.content.strip()
            
            # Save to database
            project_venue.ai_description = description
            await db.commit()
            await db.refresh(project_venue)
            
            return description
            
        except Exception as e:
            await db.rollback()
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def _build_prompt(self, venue: Venue, project, context: dict) -> str:
        """Build detailed prompt from venue info and context.
        
        Args:
            venue: Venue model instance
            project: Project model instance
            context: AI context dictionary
            
        Returns:
            Formatted prompt string
        """
        event_ctx = context.get("event_context", {})
        highlights = context.get("venue_highlights", {})
        practical = context.get("practical_details", {})
        client_ctx = context.get("client_context", {})
        
        # Build prompt sections
        prompt_parts = []
        
        # Header
        prompt_parts.append("Write a compelling venue description for a client proposal.\n")
        
        # Venue basics
        prompt_parts.append(f"VENUE INFORMATION:")
        prompt_parts.append(f"Name: {venue.name}")
        prompt_parts.append(f"Location: {venue.city}")
        if venue.address:
            prompt_parts.append(f"Address: {venue.address}")
        prompt_parts.append(f"Capacity: {venue.capacity} people")
        prompt_parts.append("")
        
        # Event context
        if event_ctx:
            prompt_parts.append("EVENT DETAILS:")
            if event_ctx.get("event_type"):
                prompt_parts.append(f"Type: {event_ctx['event_type']}")
            if event_ctx.get("purpose"):
                prompt_parts.append(f"Purpose: {event_ctx['purpose']}")
            if event_ctx.get("target_audience"):
                prompt_parts.append(f"Audience: {event_ctx['target_audience']}")
            if event_ctx.get("atmosphere"):
                atmospheres = event_ctx["atmosphere"]
                if isinstance(atmospheres, list):
                    prompt_parts.append(f"Desired Atmosphere: {', '.join(atmospheres)}")
                else:
                    prompt_parts.append(f"Desired Atmosphere: {atmospheres}")
            if event_ctx.get("special_requirements"):
                prompt_parts.append(f"Special Requirements: {event_ctx['special_requirements']}")
            prompt_parts.append("")
        
        # Venue highlights
        if highlights:
            prompt_parts.append("VENUE HIGHLIGHTS:")
            
            if highlights.get("unique_features"):
                features = highlights["unique_features"]
                if isinstance(features, list):
                    for feature in features:
                        prompt_parts.append(f"• {feature}")
                else:
                    prompt_parts.append(f"• {features}")
            
            if highlights.get("ambiance"):
                ambiance = highlights["ambiance"]
                if isinstance(ambiance, list):
                    prompt_parts.append(f"Ambiance: {', '.join(ambiance)}")
                else:
                    prompt_parts.append(f"Ambiance: {ambiance}")
            
            if highlights.get("technology"):
                prompt_parts.append(f"Technology/AV: {highlights['technology']}")
            
            if highlights.get("accessibility"):
                prompt_parts.append(f"Accessibility: {highlights['accessibility']}")
            
            if highlights.get("sustainability"):
                prompt_parts.append(f"Sustainability: {highlights['sustainability']}")
            
            prompt_parts.append("")
        
        # Practical details
        if practical:
            prompt_parts.append("PRACTICAL INFORMATION:")
            
            if practical.get("parking"):
                prompt_parts.append(f"Parking: {practical['parking']}")
            
            if practical.get("nearby"):
                prompt_parts.append(f"Nearby Amenities: {practical['nearby']}")
            
            if practical.get("restrictions"):
                prompt_parts.append(f"Restrictions: {practical['restrictions']}")
            
            if practical.get("setup_time"):
                prompt_parts.append(f"Setup Time: {practical['setup_time']}")
            
            prompt_parts.append("")
        
        # Global Client Entity Context
        if hasattr(project, 'client') and project.client:
            client = project.client
            prompt_parts.append("CLIENT BRANDING & GUIDELINES:")
            prompt_parts.append(f"Client: {client.name}")
            if client.brand_tone:
                prompt_parts.append(f"Brand Tone: {client.brand_tone}")
            if client.description_preferences:
                prompt_parts.append(f"Writing Requirements: {client.description_preferences}")
            prompt_parts.append("")
            
        # Client preferences (Manual Overrides)
        if client_ctx:
            prompt_parts.append("CLIENT PREFERENCES:")
            
            if client_ctx.get("budget_tier"):
                prompt_parts.append(f"Budget Tier: {client_ctx['budget_tier']}")
            
            if client_ctx.get("priorities"):
                priorities = client_ctx["priorities"]
                if isinstance(priorities, list):
                    prompt_parts.append(f"Priorities: {', '.join(priorities)}")
                else:
                    prompt_parts.append(f"Priorities: {priorities}")
            
            if client_ctx.get("brand_notes"):
                prompt_parts.append(f"Brand Alignment: {client_ctx['brand_notes']}")
            
            if client_ctx.get("previous_feedback"):
                prompt_parts.append(f"Previous Feedback: {client_ctx['previous_feedback']}")
            
            prompt_parts.append("")
        
        # Instructions
        prompt_parts.append("INSTRUCTIONS:")
        prompt_parts.append("Write a 2-3 paragraph description (200-300 words) that:")
        prompt_parts.append("1. Opens with what makes this venue special and perfect for this event")
        prompt_parts.append("2. Highlights key features that match the client's priorities")
        prompt_parts.append("3. Addresses practical considerations (location, capacity, amenities)")
        prompt_parts.append("4. Maintains a professional yet engaging tone")
        prompt_parts.append("5. Focuses on benefits and experience, not just features")
        prompt_parts.append("")
        prompt_parts.append("Do not include a title or heading. Start directly with the description.")
        
        return "\n".join(prompt_parts)


# Singleton instance
ai_description_service = AIDescriptionService()

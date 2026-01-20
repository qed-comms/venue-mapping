from typing import List, Optional
import openai
from app.config import settings

class AIContentService:
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

    async def generate_venue_inquiry(self, project_data: dict, venue_data: dict) -> str:
        """
        Generate a professional inquiry email for a venue using OpenAI GPT-4.
        """
        if not self.client:
            return "AI Service not configured. Please add OPENAI_API_KEY to .env"

        prompt = f"""
        You are a senior event manager at QED Event Management. 
        Write a professional, polite, and detailed inquiry email to a venue.

        EVENT DETAILS:
        - Project: {project_data.get('event_name')}
        - Client: {project_data.get('client_name')}
        - Dates: {project_data.get('event_date_start')} to {project_data.get('event_date_end')}
        - Attendees: {project_data.get('attendee_count')}
        - Special Requirements: {', '.join(project_data.get('requirements', []))}

        VENUE DETAILS:
        - Name: {venue_data.get('name')}
        - City: {venue_data.get('city')}
        - Capacity: {venue_data.get('capacity')}
        - Facilities: {', '.join(venue_data.get('facilities', []))}

        The email should:
        1. Introduce QED Event Management.
        2. Inquire about availability for the specified dates.
        3. Ask for a preliminary quote based on the attendee count.
        4. Mention specific requirements (e.g. AV, catering) if they match the venue's facilities.
        5. Request a site visit if available.
        
        Keep the tone premium, efficient, and professional.
        """

        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert event planning assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content

    async def generate_venue_summary(self, venue_data: dict) -> dict:
        """
        Generate a compelling summary, pros, and cons for a venue from its description.
        """
        if not self.client:
            return {"error": "AI Service not configured"}

        prompt = f"""
        Analyze this venue and provide a compelling 2-sentence marketing description and a list of 3 pros and 2 cons for an event proposal.

        VENUE:
        Name: {venue_data.get('name')}
        Description: {venue_data.get('description', 'No description provided')}
        Facilities: {', '.join(venue_data.get('facilities', []))}
        
        Format as JSON:
        {{
            "summary": "...",
            "pros": ["...", "...", "..."],
            "cons": ["...", "..."]
        }}
        """

        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.7
        )
        import json
        return json.loads(response.choices[0].message.content)

ai_content_service = AIContentService()

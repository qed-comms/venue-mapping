---
name: ai-content
description: "[PHASE 2 - NOT IN MVP] Generates AI-powered content using Claude API, including inquiry emails and venue descriptions. This feature is scheduled for Phase 2 implementation after MVP completion."
---

# AI Content Generation Skill

## Overview

The Venue Mapping AI uses Claude API to generate:
1. **Inquiry emails** — Professional emails to venues requesting availability and pricing
2. **Venue descriptions** — 2-3 paragraph descriptions for client proposals
3. **Pros/Cons suggestions** — Advantages and disadvantages based on venue data

## Service Architecture

```python
# backend/app/services/ai_content.py
from typing import Optional
from anthropic import AsyncAnthropic

from app.config import settings
from app.models.project import Project
from app.models.venue import Venue
from app.models.project_venue import ProjectVenue
from app.models.user import User


class AIContentService:
    """Generates AI content using Claude API."""
    
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"  # Fast, good quality
    
    async def generate_inquiry_email(
        self,
        project: Project,
        venue: Venue,
        user: User,
    ) -> str:
        """Generate a professional inquiry email to a venue."""
        prompt = self._build_inquiry_prompt(project, venue, user)
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        
        return response.content[0].text
    
    async def generate_venue_description(
        self,
        project: Project,
        venue: Venue,
        project_venue: ProjectVenue,
    ) -> str:
        """Generate a venue description for the client proposal."""
        prompt = self._build_description_prompt(project, venue, project_venue)
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        
        return response.content[0].text
    
    async def generate_pros_cons(
        self,
        project: Project,
        venue: Venue,
        project_venue: ProjectVenue,
    ) -> dict[str, str]:
        """Generate suggested pros and cons for a venue."""
        prompt = self._build_pros_cons_prompt(project, venue, project_venue)
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        
        return self._parse_pros_cons(response.content[0].text)
    
    def _build_inquiry_prompt(
        self,
        project: Project,
        venue: Venue,
        user: User,
    ) -> str:
        """Build the prompt for inquiry email generation."""
        return f"""Generate a professional inquiry email to a venue requesting availability and pricing for an event.

EVENT DETAILS:
- Client: {project.client_name}
- Event Name: {project.event_name}
- Dates: {project.event_date_start.strftime('%d %B %Y')} to {project.event_date_end.strftime('%d %B %Y')}
- Expected Attendees: {project.attendee_count}
- Requirements: {', '.join(project.requirements)}
- Location Preference: {project.location_preference}
{f'- Budget: €{project.budget:,.0f}' if project.budget else ''}

VENUE DETAILS:
- Venue Name: {venue.name}
- Contact: {venue.contact_name or 'Events Team'}
- Capacity: {venue.capacity}
- Facilities: {', '.join(venue.facilities) if venue.facilities else 'Not specified'}

SENDER:
- Name: {user.name}

INSTRUCTIONS:
1. Write a polite, professional email requesting:
   - Availability for the specified dates
   - Pricing/quote for the event
   - Information about room configurations that would suit the requirements
   - Catering options if available

2. Keep the tone professional but warm
3. Be concise (150-200 words)
4. Include specific questions about the requirements
5. Do NOT include a signature block (will be added separately)
6. Start with "Dear [Contact Name or Events Team],"

Generate only the email body, nothing else."""
    
    def _build_description_prompt(
        self,
        project: Project,
        venue: Venue,
        project_venue: ProjectVenue,
    ) -> str:
        """Build the prompt for venue description generation."""
        return f"""Write a professional venue description for a client proposal.

VENUE INFORMATION:
- Name: {venue.name}
- Location: {venue.address}, {venue.city}
- Capacity: {venue.capacity} attendees
- Facilities: {', '.join(venue.facilities) if venue.facilities else 'Various modern amenities'}
- Event Types: {', '.join(venue.event_types) if venue.event_types else 'Various corporate events'}
- Base Description: {venue.description_template or 'A professional event venue.'}
- Internal Notes: {venue.notes or 'No additional notes.'}

EVENT CONTEXT:
- Event: {project.event_name} for {project.client_name}
- Attendees: {project.attendee_count}
- Requirements: {', '.join(project.requirements)}

{f'ADDITIONAL CONTEXT:' if project_venue.room_allocation or project_venue.availability_dates else ''}
{f'- Room Setup: {project_venue.room_allocation}' if project_venue.room_allocation else ''}
{f'- Available Dates: {project_venue.availability_dates}' if project_venue.availability_dates else ''}

INSTRUCTIONS:
1. Write 2-3 paragraphs (100-150 words total)
2. Highlight features relevant to the client's requirements
3. Maintain a professional, balanced tone (not overly salesy)
4. Focus on practical benefits for the event
5. Do not mention pricing
6. Do not include headers or bullet points

Generate only the description paragraphs, nothing else."""
    
    def _build_pros_cons_prompt(
        self,
        project: Project,
        venue: Venue,
        project_venue: ProjectVenue,
    ) -> str:
        """Build the prompt for pros/cons generation."""
        return f"""Generate pros and cons for a venue being considered for an event.

VENUE:
- Name: {venue.name}
- Location: {venue.address}, {venue.city}
- Capacity: {venue.capacity} (Event needs: {project.attendee_count})
- Facilities: {', '.join(venue.facilities) if venue.facilities else 'Not specified'}
- Notes: {venue.notes or 'None'}

EVENT REQUIREMENTS:
- Requirements: {', '.join(project.requirements)}
- Budget: {f'€{project.budget:,.0f}' if project.budget else 'Not specified'}
- Location Preference: {project.location_preference}

{f'RESPONSE DATA:' if project_venue.quoted_price or project_venue.room_allocation else ''}
{f'- Quoted Price: €{project_venue.quoted_price:,.0f}' if project_venue.quoted_price else ''}
{f'- Room Allocation: {project_venue.room_allocation}' if project_venue.room_allocation else ''}
{f'- Catering: {project_venue.catering_description}' if project_venue.catering_description else ''}

INSTRUCTIONS:
1. List 2-4 pros (advantages for this specific event)
2. List 1-3 cons (potential drawbacks or considerations)
3. Be specific and relevant to the event requirements
4. Format as bullet points starting with "•"

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
PROS:
• [Pro 1]
• [Pro 2]
• [Pro 3]

CONS:
• [Con 1]
• [Con 2]"""
    
    def _parse_pros_cons(self, response: str) -> dict[str, str]:
        """Parse the pros/cons response into separate strings."""
        pros = ""
        cons = ""
        
        lines = response.strip().split("\n")
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.upper().startswith("PROS"):
                current_section = "pros"
            elif line.upper().startswith("CONS"):
                current_section = "cons"
            elif line.startswith("•") or line.startswith("-"):
                bullet = line.lstrip("•-").strip()
                if current_section == "pros":
                    pros += f"• {bullet}\n"
                elif current_section == "cons":
                    cons += f"• {bullet}\n"
        
        return {
            "pros": pros.strip(),
            "cons": cons.strip(),
        }


ai_content_service = AIContentService()
```

---

## API Endpoints

```python
# backend/app/api/ai.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.ai_content import ai_content_service
from app.services.project_service import project_service
from app.services.venue_service import venue_service
from app.services.project_venue_service import project_venue_service

router = APIRouter(prefix="/ai", tags=["ai"])


class InquiryEmailRequest(BaseModel):
    project_id: UUID
    venue_id: UUID


class InquiryEmailResponse(BaseModel):
    email_body: str
    subject: str


class DescriptionRequest(BaseModel):
    project_id: UUID
    venue_id: UUID


class DescriptionResponse(BaseModel):
    description: str


class ProsConsResponse(BaseModel):
    pros: str
    cons: str


@router.post("/inquiry-email", response_model=InquiryEmailResponse)
async def generate_inquiry_email(
    request: InquiryEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an inquiry email for a venue."""
    # Get project and venue
    project = await project_service.get_by_id(db, request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    venue = await venue_service.get_by_id(db, request.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Generate email
    email_body = await ai_content_service.generate_inquiry_email(
        project=project,
        venue=venue,
        user=current_user,
    )
    
    # Generate subject line
    subject = f"Inquiry: {project.event_name} - {project.event_date_start.strftime('%d/%m/%Y')}"
    
    return InquiryEmailResponse(email_body=email_body, subject=subject)


@router.post("/venue-description", response_model=DescriptionResponse)
async def generate_venue_description(
    request: DescriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a venue description for a proposal."""
    # Get project, venue, and project_venue
    project = await project_service.get_by_id(db, request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    venue = await venue_service.get_by_id(db, request.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    project_venue = await project_venue_service.get_by_project_and_venue(
        db, request.project_id, request.venue_id
    )
    if not project_venue:
        raise HTTPException(status_code=404, detail="Venue not in project")
    
    # Generate description
    description = await ai_content_service.generate_venue_description(
        project=project,
        venue=venue,
        project_venue=project_venue,
    )
    
    return DescriptionResponse(description=description)


@router.post("/pros-cons", response_model=ProsConsResponse)
async def generate_pros_cons(
    request: DescriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate pros and cons for a venue."""
    # Get project, venue, and project_venue
    project = await project_service.get_by_id(db, request.project_id)
    venue = await venue_service.get_by_id(db, request.venue_id)
    project_venue = await project_venue_service.get_by_project_and_venue(
        db, request.project_id, request.venue_id
    )
    
    if not all([project, venue, project_venue]):
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Generate pros/cons
    result = await ai_content_service.generate_pros_cons(
        project=project,
        venue=venue,
        project_venue=project_venue,
    )
    
    return ProsConsResponse(**result)
```

---

## Frontend Integration

### API Client

```typescript
// frontend/src/api/ai.ts
import { apiClient } from './client';

export interface InquiryEmailRequest {
  projectId: string;
  venueId: string;
}

export interface InquiryEmailResponse {
  emailBody: string;
  subject: string;
}

export interface DescriptionRequest {
  projectId: string;
  venueId: string;
}

export interface DescriptionResponse {
  description: string;
}

export interface ProsConsResponse {
  pros: string;
  cons: string;
}

export const aiApi = {
  generateInquiryEmail: async (
    request: InquiryEmailRequest
  ): Promise<InquiryEmailResponse> => {
    return apiClient.post('/ai/inquiry-email', {
      project_id: request.projectId,
      venue_id: request.venueId,
    });
  },

  generateVenueDescription: async (
    request: DescriptionRequest
  ): Promise<DescriptionResponse> => {
    return apiClient.post('/ai/venue-description', {
      project_id: request.projectId,
      venue_id: request.venueId,
    });
  },

  generateProsCons: async (
    request: DescriptionRequest
  ): Promise<ProsConsResponse> => {
    return apiClient.post('/ai/pros-cons', {
      project_id: request.projectId,
      venue_id: request.venueId,
    });
  },
};
```

### React Hooks

```typescript
// frontend/src/hooks/useAIContent.ts
import { useMutation } from '@tanstack/react-query';
import { aiApi, InquiryEmailRequest, DescriptionRequest } from '@/api/ai';

export function useGenerateInquiryEmail() {
  return useMutation({
    mutationFn: (request: InquiryEmailRequest) =>
      aiApi.generateInquiryEmail(request),
  });
}

export function useGenerateVenueDescription() {
  return useMutation({
    mutationFn: (request: DescriptionRequest) =>
      aiApi.generateVenueDescription(request),
  });
}

export function useGenerateProsCons() {
  return useMutation({
    mutationFn: (request: DescriptionRequest) =>
      aiApi.generateProsCons(request),
  });
}
```

### Component Example

```tsx
// frontend/src/components/projects/GenerateEmailButton.tsx
import { useState } from 'react';
import { Copy, Loader2, Mail, Sparkles } from 'lucide-react';
import { useGenerateInquiryEmail } from '@/hooks/useAIContent';
import toast from 'react-hot-toast';

interface GenerateEmailButtonProps {
  projectId: string;
  venueId: string;
  venueName: string;
  contactEmail?: string;
}

export function GenerateEmailButton({
  projectId,
  venueId,
  venueName,
  contactEmail,
}: GenerateEmailButtonProps) {
  const [emailContent, setEmailContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  
  const { mutate: generateEmail, isPending } = useGenerateInquiryEmail();

  const handleGenerate = () => {
    generateEmail(
      { projectId, venueId },
      {
        onSuccess: (data) => {
          setEmailContent({
            subject: data.subject,
            body: data.emailBody,
          });
          toast.success('Email generated!');
        },
        onError: () => {
          toast.error('Failed to generate email');
        },
      }
    );
  };

  const handleCopy = () => {
    if (!emailContent) return;
    
    const fullEmail = `Subject: ${emailContent.subject}\n\n${emailContent.body}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success('Copied to clipboard!');
  };

  const handleOpenMailClient = () => {
    if (!emailContent || !contactEmail) return;
    
    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(
      emailContent.subject
    )}&body=${encodeURIComponent(emailContent.body)}`;
    
    window.open(mailtoUrl);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-qed-green px-4 py-2 text-sm font-semibold text-white hover:bg-qed-green/90 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Generate Inquiry Email
      </button>

      {emailContent && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Generated Email for {venueName}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              {contactEmail && (
                <button
                  onClick={handleOpenMailClient}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Mail className="h-4 w-4" />
                  Open in Mail
                </button>
              )}
            </div>
          </div>
          
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-500">Subject:</span>
            <p className="text-gray-900">{emailContent.subject}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-500">Body:</span>
            <pre className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {emailContent.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Prompt Guidelines

### Best Practices for AI Content

1. **Be specific** — Include all relevant context (dates, requirements, capacity)
2. **Set clear expectations** — Specify format, length, and tone
3. **Avoid ambiguity** — Don't leave room for interpretation
4. **Include examples** — When format matters, show the expected output
5. **Guard against hallucination** — Only ask for information that can be derived from inputs

### Content Quality Checklist

| Aspect | Requirement |
|--------|-------------|
| **Tone** | Professional, warm, not salesy |
| **Length** | Inquiry: 150-200 words, Description: 100-150 words |
| **Accuracy** | Only reference provided data |
| **Relevance** | Highlight features that match requirements |
| **Formatting** | No headers in descriptions, bullet points in pros/cons |

---

## Error Handling

```python
# backend/app/services/ai_content.py (with error handling)
import logging
from anthropic import APIError, RateLimitError
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class AIContentService:
    async def generate_inquiry_email(self, ...):
        try:
            response = await self.client.messages.create(...)
            return response.content[0].text
        except RateLimitError:
            raise HTTPException(
                status_code=429,
                detail="AI service rate limit exceeded. Please try again later."
            )
        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI content generation temporarily unavailable."
            )
```

---

## Testing

```python
# backend/tests/unit/test_ai_content.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ai_content import ai_content_service


@pytest.fixture
def mock_anthropic_response():
    """Mock Claude API response."""
    response = MagicMock()
    response.content = [MagicMock(text="Generated content here")]
    return response


@pytest.mark.asyncio
async def test_generate_inquiry_email(mock_anthropic_response):
    with patch.object(
        ai_content_service.client.messages,
        'create',
        new_callable=AsyncMock,
        return_value=mock_anthropic_response
    ):
        project = MagicMock()
        project.client_name = "CEMA"
        project.event_name = "Annual Conference"
        # ... set other required attributes
        
        venue = MagicMock()
        venue.name = "Event Lounge"
        # ... set other required attributes
        
        user = MagicMock()
        user.name = "Sophie Martin"
        
        result = await ai_content_service.generate_inquiry_email(
            project, venue, user
        )
        
        assert isinstance(result, str)
        assert len(result) > 0


@pytest.mark.asyncio
async def test_parse_pros_cons():
    """Test pros/cons parsing."""
    response = """PROS:
• Central location near EU Quarter
• Modern AV equipment included
• Flexible room setup

CONS:
• Limited parking available
• Catering must be external"""
    
    result = ai_content_service._parse_pros_cons(response)
    
    assert "Central location" in result["pros"]
    assert "Limited parking" in result["cons"]
    assert result["pros"].count("•") == 3
    assert result["cons"].count("•") == 2
```

---

## Rate Limiting Considerations

Claude API has rate limits. For production:

1. **Cache generated content** — Store in `ai_description` field
2. **Implement retries** — Use exponential backoff for transient errors
3. **Queue requests** — Don't generate all descriptions at once
4. **User feedback** — Show loading states and progress indicators

```python
# Example retry logic
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def generate_with_retry(self, prompt: str) -> str:
    return await self._call_api(prompt)
```

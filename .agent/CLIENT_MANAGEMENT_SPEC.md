# 📋 Client Management & AI Context System

## 1. Executive Summary
Currently, `client_name` is just a text field in each Project. This leads to repetitive data entry and missed opportunities for AI personalization. 

By introducing a dedicated **Clients Panel**, we can store persistent client profiles containing their branding, tone of voice, and standard requirements. This enables the AI to automatically "know" the client when generating venue descriptions, proposals, and emails.

## 2. Core Features

### A. Centralized Client Database
- **Clients Panel**: A new main navigation tab to manage all clients.
- **Client Profiles**: Store "invariant" data about a client (Logo, Industry, Website).
- **Client Intelligence**: Store AI-driving data (Brand Tone, Key Priorities, "Do not show" list).

### B. Intelligent Project Creation
- **Select Client**: When creating a project, select from existing clients.
- **Auto-Population**: Project defaults (budget tier, typical audit count) populate automatically.
- **AI Context Injection**: The AI Description Generator automatically pulls the client's "Brand Tone" and "Priorities" without the user typing them for every venue.

### C. Client History
- View all past projects for a specific client.
- Track feedback trends (e.g., "Always complains about low ceilings").

---

## 3. Data Architecture Changes

### New Model: `Client`
```python
class Client(Base):
    __tablename__ = "clients"
    
    id = Column(UUID, primary_key=True)
    name = Column(String, nullable=False)
    industry = Column(String)
    website = Column(String)
    
    # AI & Branding Context
    brand_tone = Column(String)  # e.g. "Professional, Luxury, Minimalist"
    description_preferences = Column(Text) # e.g. "Focus on sustainability and high-tech"
    standard_requirements = Column(JSONB) # Default values for new projects
    
    # Relationships
    projects = relationship("Project", back_populates="client")
```

### Update Model: `Project`
```python
class Project(Base):
    # ...
    # Migrate from string to foreign key
    client_id = Column(UUID, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="projects")
```

---

## 4. AI Integration Logic

The `AIDescriptionService` will be upgraded to hierarchically build context:

1.  **Venue Context**: (Existing) Features, Location, Capacity.
2.  **Project Context**: (Existing) Event type, specific purpose.
3.  **Client Context**: (**New**)
    - *Tone of Voice*: "Write in a witty, energetic style" vs "Formal corporate tone".
    - *Priorities*: "Always mention sustainability certifications".
    - *Avoid*: "Never use the word 'cheap', use 'value-driven'".

**Result**: You fill in 3 fields for the venue, and the AI generates a perfect, on-brand description because it already knows the client's global preferences.

---

## 5. UI/UX Workflow

### Step 1: Client Onboarding (One time)
- Go to **Clients** tab.
- Click "Add Client".
- Fill in:
    - **Name**: "TechCorp EU"
    - **AI Instructions**: "We are an edgy tech startup. Use exciting language. Avoid corporate jargon."

### Step 2: Project Setup
- Create New Project.
- **Client**: Select "TechCorp EU".
- The system automatically links the project.

### Step 3: Venue Operation (The Magic Moment)
- Add a venue to the project.
- Click **AI Generate**.
- **The Panel**:
    - You only see the "Event Context" fields (simplified).
    - You *don't* see the confusing "Client Context" fields anymore because they are loaded from the backend.
- **Result**: The description is generated using TechCorp's "edgy" tone automatically.

---

## 6. Implementation Roadmap

### Phase 1: Database & Backend (1-2 Days)
1. Create `Client` model and migrations.
2. Backfill existing projects (create Clients from unique `client_name` strings).
3. Update `Project` API to accept `client_id`.

### Phase 2: Frontend Client Management (2 Days)
1. Create `ClientListView` and `ClientDetailView`.
2. Implement "Add/Edit Client" forms with AI preference fields.
3. Update `ProjectCreateModal` to use a client dropdown.

### Phase 3: AI Service Integration (1 Day)
1. Update `_build_prompt` in `ai_description_service.py` to fetch `project.client`.
2. Append client specific instructions to the system prompt.

---

## 7. Benefits

| Feature | Before | After |
| :--- | :--- | :--- |
| **Data Entry** | Type "Luxury tone" for every venue | Type it once per Client |
| **Consistency** | Tone varies by user mood | Tone is consistent across all projects |
| **Speed** | 5 mins per venue context setup | 30 secs (Context pre-filled) |
| **Organization** | Flat list of projects | Organized by Client relationships |

This architecture transforms the app from a simple "Project Manager" to a "Client Relationship Manager (CRM)" with AI superpowers.

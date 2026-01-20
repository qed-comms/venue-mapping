"""PDF and HTML proposal generator service."""
from pathlib import Path
from typing import Optional
from uuid import UUID
import io
import base64

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_venue import ProjectVenue


class ProposalGenerator:
    """Generates branded venue proposal documents (HTML and PDF)."""
    
    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates" / "proposal"
        template_dir.mkdir(parents=True, exist_ok=True)
        self.env = Environment(loader=FileSystemLoader(str(template_dir)))
        self.base_css_path = template_dir / "styles.css"
    
    def _load_base_css(self) -> str:
        """Load the base stylesheet."""
        if self.base_css_path.exists():
            return self.base_css_path.read_text()
        return ""
    
    def _get_qed_logo_base64(self) -> str:
        """Return QED logo as base64 data URI."""
        # Simple SVG logo for QED
        svg_logo = '''<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="35" fill="#2EC4A0"/>
            <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
                  fill="white" text-anchor="middle">QED</text>
        </svg>'''
        encoded = base64.b64encode(svg_logo.encode()).decode()
        return f"data:image/svg+xml;base64,{encoded}"
    
    async def generate_html_proposal(
        self,
        db: AsyncSession,
        project: Project,
    ) -> str:
        """Generate HTML proposal for a project.
        
        Args:
            db: Database session
            project: The project to generate proposal for
            
        Returns:
            HTML content as string
        """
        # Get venue data
        included_venues = [
            pv for pv in project.project_venues 
            if pv.include_in_proposal
        ]
        
        awaiting_venues = [
            pv for pv in project.project_venues
            if pv.outreach_status in ['sent', 'pending']
        ]
        
        declined_venues = [
            pv for pv in project.project_venues
            if pv.outreach_status == 'declined'
        ]
        
        # Format date range
        date_range = ""
        if project.event_date_start:
            start_str = project.event_date_start.strftime("%d/%m/%Y")
            if project.event_date_end:
                end_str = project.event_date_end.strftime("%d/%m/%Y")
                date_range = f"{start_str} - {end_str}"
            else:
                date_range = start_str
        
        # Render HTML
        template = self.env.get_template("proposal.html")
        html_content = template.render(
            project=project,
            included_venues=included_venues,
            awaiting_venues=awaiting_venues,
            declined_venues=declined_venues,
            date_range=date_range,
            logo_data_uri=self._get_qed_logo_base64(),
            base_css=self._load_base_css(),
        )
        
        return html_content
    
    async def generate_pdf_proposal(
        self,
        db: AsyncSession,
        project: Project,
    ) -> bytes:
        """Generate PDF proposal for a project.
        
        Args:
            db: Database session
            project: The project to generate proposal for
            
        Returns:
            PDF file as bytes
        """
        try:
            from weasyprint import HTML, CSS
        except ImportError:
            raise ImportError(
                "WeasyPrint is required for PDF generation. "
                "Install with: pip install weasyprint"
            )
        
        # Generate HTML first
        html_content = await self.generate_html_proposal(db, project)
        
        # Convert to PDF
        html = HTML(string=html_content)
        
        # Add CSS if available
        css = None
        if self.base_css_path.exists():
            css = CSS(string=self._load_base_css())
        
        pdf_buffer = io.BytesIO()
        if css:
            html.write_pdf(pdf_buffer, stylesheets=[css])
        else:
            html.write_pdf(pdf_buffer)
        
        return pdf_buffer.getvalue()


# Global instance
proposal_generator = ProposalGenerator()

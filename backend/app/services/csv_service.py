"""CSV processing service for venue uploads."""
import csv
import io
from typing import List, Tuple

from fastapi import UploadFile
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.venue import VenueCSVRow, VenueResponse, VenueUploadError, VenueUploadResult
from app.services.venue_service import venue_service


class CSVService:
    """Service for processing CSV file uploads."""
    
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_ROWS = 1000
    
    REQUIRED_HEADERS = ["name", "city", "capacity"]
    OPTIONAL_HEADERS = [
        "facilities",
        "event_types",
        "contact_email",
        "contact_phone",
        "website",
        "address",
        "description_template",
        "notes",
    ]
    ALL_HEADERS = REQUIRED_HEADERS + OPTIONAL_HEADERS
    
    async def process_venue_csv(
        self,
        db: AsyncSession,
        file: UploadFile,
    ) -> VenueUploadResult:
        """Process uploaded CSV file and create venues.
        
        Args:
            db: Database session
            file: Uploaded CSV file
            
        Returns:
            VenueUploadResult with success/error details
            
        Raises:
            ValueError: If file is invalid or too large
        """
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > self.MAX_FILE_SIZE:
            raise ValueError(f"File too large. Maximum size is {self.MAX_FILE_SIZE / 1024 / 1024}MB")
        
        # Decode content
        try:
            text_content = content.decode('utf-8')
        except UnicodeDecodeError:
            raise ValueError("File must be UTF-8 encoded")
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(text_content))
        
        # Validate headers
        if not csv_reader.fieldnames:
            raise ValueError("CSV file is empty or has no headers")
        
        self._validate_headers(csv_reader.fieldnames)
        
        # Process rows
        created_venues: List[VenueResponse] = []
        errors: List[VenueUploadError] = []
        row_number = 1  # Start at 1 (header is row 0)
        
        for row_data in csv_reader:
            row_number += 1
            
            # Check max rows
            if row_number > self.MAX_ROWS + 1:  # +1 for header
                errors.append(VenueUploadError(
                    row=row_number,
                    message=f"Maximum {self.MAX_ROWS} rows allowed. Remaining rows skipped."
                ))
                break
            
            # Skip empty rows
            if not any(row_data.values()):
                continue
            
            # Validate and create venue
            try:
                # Validate row data
                csv_row = VenueCSVRow(**row_data)
                
                # Convert to VenueCreate
                venue_create = csv_row.to_venue_create()
                
                # Create venue in database
                venue = await venue_service.create(db, venue_create)
                created_venues.append(VenueResponse.model_validate(venue))
                
            except ValidationError as e:
                # Pydantic validation error
                error_messages = []
                for error in e.errors():
                    field = error['loc'][0] if error['loc'] else None
                    message = error['msg']
                    error_messages.append(f"{field}: {message}" if field else message)
                
                errors.append(VenueUploadError(
                    row=row_number,
                    field=str(error['loc'][0]) if e.errors() and e.errors()[0]['loc'] else None,
                    message="; ".join(error_messages),
                    data=row_data
                ))
                
            except Exception as e:
                # Other errors (database, etc.)
                errors.append(VenueUploadError(
                    row=row_number,
                    message=f"Failed to create venue: {str(e)}",
                    data=row_data
                ))
        
        total_rows = row_number - 1  # Exclude header
        successful = len(created_venues)
        failed = len(errors)
        
        return VenueUploadResult(
            total_rows=total_rows,
            successful=successful,
            failed=failed,
            created_venues=created_venues,
            errors=errors,
        )
    
    def _validate_headers(self, headers: List[str]) -> None:
        """Validate CSV headers.
        
        Args:
            headers: List of header names from CSV
            
        Raises:
            ValueError: If required headers are missing or invalid headers present
        """
        headers_set = set(h.strip().lower() for h in headers if h)
        required_set = set(h.lower() for h in self.REQUIRED_HEADERS)
        all_headers_set = set(h.lower() for h in self.ALL_HEADERS)
        
        # Check for missing required headers
        missing = required_set - headers_set
        if missing:
            raise ValueError(
                f"Missing required headers: {', '.join(sorted(missing))}. "
                f"Required headers are: {', '.join(self.REQUIRED_HEADERS)}"
            )
        
        # Check for unknown headers (warning, not error)
        unknown = headers_set - all_headers_set
        if unknown:
            # We'll allow unknown headers but they'll be ignored
            pass
    
    def generate_template(self) -> str:
        """Generate CSV template with headers and example row.
        
        Returns:
            CSV template as string
        """
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=self.ALL_HEADERS)
        
        # Write header
        writer.writeheader()
        
        # Write example row
        example_row = {
            "name": "Example Venue",
            "city": "Brussels",
            "capacity": "200",
            "facilities": "WiFi, Projector, Catering, Parking",
            "event_types": "Conference, Workshop, Seminar",
            "contact_email": "contact@example-venue.com",
            "contact_phone": "+32 2 123 4567",
            "website": "https://www.example-venue.com",
            "address": "123 Example Street, 1000 Brussels, Belgium",
            "description_template": "A modern venue in the heart of Brussels, perfect for corporate events.",
            "notes": "Free parking available. Wheelchair accessible.",
        }
        writer.writerow(example_row)
        
        return output.getvalue()


csv_service = CSVService()

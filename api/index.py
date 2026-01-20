import os
import sys

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

# Import the FastAPI app
try:
    from app.main import app
except ImportError as e:
    # Diagnostic for logs if import fails
    print(f"Import Error: {e}")
    print(f"Current Path: {sys.path}")
    raise e

# Vercel expects a variable named 'app'

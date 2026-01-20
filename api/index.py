import os
import sys

# Add backend to python path
backend_path = os.path.join(os.path.dirname(__file__), '../backend')
sys.path.append(backend_path)

# Debug logging
print(f"Python Path: {sys.path}")
try:
    print(f"Contents of backend: {os.listdir(backend_path)}")
except:
    print("Could not list backend directory")

# Import the FastAPI app
try:
    from app.main import app
except Exception as e:
    import traceback
    trace = traceback.format_exc()
    print(f"Import Error: {e}")
    print(trace)
    
    # Fallback app to display error
    from fastapi import FastAPI, Response
    app = FastAPI()
    
    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    async def capture_all(full_path: str):
        import os
        cwd = os.getcwd()
        try:
            ls = os.listdir(cwd)
        except:
            ls = ["error listing dir"]
            
        return {
            "status": "Deployment Error (Import Failed)", 
            "error": str(e),
            "trace": trace.split('\n'),
            "cwd": cwd,
            "ls": ls,
            "python_path": sys.path
        }

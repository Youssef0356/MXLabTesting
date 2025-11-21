"""
Helper utilities for API endpoints
"""
import json
import os
import unicodedata
import re

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing special characters and replacing spaces.
    Example: "pièces de rechange.png" -> "pieces_de_rechange.png"
    """
    # Normalize unicode characters (e.g. é -> e)
    filename = unicodedata.normalize('NFKD', filename).encode('ASCII', 'ignore').decode('ASCII')
    
    # Replace spaces with underscores
    filename = filename.replace(' ', '_')
    
    # Remove any other non-alphanumeric characters except dots, underscores, and hyphens
    filename = re.sub(r'[^\w\.-]', '', filename)
    
    return filename


def resolve_model_urls(model_data: dict, base_url: str = "") -> dict:
    """
    Recursively resolves all relative paths in model data to full URLs.
    
    Adds:
    - imageUrl to each button (from imageFileName)
    - Processes nested parts recursively
    
    Args:
        model_data: Model dictionary with buttons and parts
        base_url: Base URL for assets (defaults to empty, paths are absolute)
    
    Returns:
        Modified model_data with resolved URLs
    """
    # Resolve button image URLs
    for button in model_data.get("buttons", []):
        filename = button.get("imageFileName")
        if not filename:
            continue
        if isinstance(filename, str) and filename.startswith("/"):
            plain_name = os.path.basename(filename)
            button["imageFileName"] = plain_name
            if base_url and filename.startswith(base_url):
                button["imageUrl"] = filename
            else:
                button["imageUrl"] = f"{base_url}{filename}"
        else:
            button["imageUrl"] = f"{base_url}/models/files/{filename}"
    
    # Recursively process parts
    for part in model_data.get("parts", []):
        resolve_model_urls(part, base_url)
    
    return model_data


def model_db_to_dict(model_db) -> dict:
    """
    Converts a ModelDB instance to a dictionary with parsed JSON fields.
    
    Args:
        model_db: ModelDB database instance
    
    Returns:
        Dictionary with id, description, video, datasheetUrl, buttons, parts, modelFileUrl
    """
    return {
        "id": model_db.name,
        "modelFileUrl": model_db.model_file_url,
        "description": json.loads(model_db.description_json) if model_db.description_json else [],
        "video": model_db.video,
        "datasheetUrl": model_db.datasheet_url,
        "buttons": json.loads(model_db.buttons_json) if model_db.buttons_json else [],
        "parts": json.loads(model_db.parts_json) if model_db.parts_json else []
    }

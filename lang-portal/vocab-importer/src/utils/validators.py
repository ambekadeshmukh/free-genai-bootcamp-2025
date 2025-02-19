from typing import Dict, List, Union
from pydantic import BaseModel, Field

class WordPart(BaseModel):
    type: str
    gender: str = None
    conjugation: str = None

class VocabularyItem(BaseModel):
    french: str
    pronunciation: str
    english: str
    parts: List[WordPart]

def validate_vocab_json(data: Union[List, Dict]) -> bool:
    """
    Validate the structure of vocabulary JSON data
    
    Args:
        data: Vocabulary data to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        if isinstance(data, dict):
            data = [data]
            
        for item in data:
            VocabularyItem(**item)
        return True
        
    except Exception:
        return False
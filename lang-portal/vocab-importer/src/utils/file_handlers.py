import json
from pathlib import Path
from typing import Dict, List, Union

def save_json(data: Union[List, Dict], filepath: Union[str, Path]) -> None:
    """
    Save data to a JSON file
    
    Args:
        data: Data to save
        filepath: Path to save the JSON file
    """
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_json(filepath: Union[str, Path]) -> Union[List, Dict]:
    """
    Load data from a JSON file
    
    Args:
        filepath: Path to the JSON file
        
    Returns:
        Loaded JSON data
    """
    filepath = Path(filepath)
    
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
        
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)
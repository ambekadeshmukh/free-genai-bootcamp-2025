import pytesseract
from PIL import Image
import cv2
import numpy as np
import os
from src.backend.ocr.preprocessor import preprocess_image
from src.utils.helpers import load_config

class OCRProcessor:
    def __init__(self):
        # Get configuration
        config = load_config()
        self.sensitivity = config.get("ocr_sensitivity", 5)
        
        # Configure Tesseract
        self.tesseract_config = f'--oem 3 --psm 6 -l fra'
        
        # Set custom path if specified in environment
        tesseract_path = os.getenv("OCR_ENGINE_PATH")
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
    
    def process(self, image):
        """Process image and extract text"""
        # Preprocess the image
        preprocessed_image = preprocess_image(image)
        
        # Perform OCR
        try:
            text = pytesseract.image_to_string(
                preprocessed_image,
                config=self.tesseract_config
            )
            
            # Clean up the text
            text = self._clean_text(text)
            
            return text
        except Exception as e:
            print(f"OCR Error: {str(e)}")
            return ""
    
    def _clean_text(self, text):
        """Clean and normalize OCR output"""
        # Remove newlines and extra spaces
        text = ' '.join(text.split())
        
        # Remove common OCR artifacts
        text = text.replace('|', 'l')
        text = text.replace('0', 'o')
        
        # Remove non-French characters that might be OCR errors
        text = ''.join(c for c in text if c.isalpha() or c.isspace() or c in "àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ-'")
        
        return text.strip()

def process_image(image):
    """Wrapper function for OCR processing"""
    processor = OCRProcessor()
    return processor.process(image)
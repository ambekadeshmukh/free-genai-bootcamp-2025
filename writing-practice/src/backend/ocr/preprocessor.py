import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

def preprocess_image(image):
    """
    Preprocess image for better OCR results
    
    Args:
        image: PIL Image object
    
    Returns:
        PIL Image object optimized for OCR
    """
    # Convert PIL Image to OpenCV format
    if isinstance(image, Image.Image):
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    else:
        img = image
    
    # Resize if image is too small or too large
    height, width = img.shape[:2]
    if width < 300:
        scale_factor = 300 / width
        img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
    elif width > 2000:
        scale_factor = 2000 / width
        img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_AREA)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Dilate to connect broken components
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    
    # Find contours
    contours, _ = cv2.findContours(
        dilated.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Filter out small noise contours
    filtered_contours = []
    for contour in contours:
        if cv2.contourArea(contour) > 100:  # Minimum area threshold
            filtered_contours.append(contour)
    
    # Create mask
    mask = np.zeros(img.shape[:2], dtype="uint8")
    cv2.drawContours(mask, filtered_contours, -1, 255, -1)
    
    # Apply mask to original grayscale image
    result = cv2.bitwise_and(gray, gray, mask=mask)
    
    # Invert back to black text on white background for OCR
    result = cv2.bitwise_not(result)
    
    # Convert back to PIL Image
    pil_image = Image.fromarray(result)
    
    # Additional PIL-based processing
    pil_image = pil_image.filter(ImageFilter.SHARPEN)
    enhancer = ImageEnhance.Contrast(pil_image)
    pil_image = enhancer.enhance(2.0)
    
    return pil_image

def enhance_image(image):
    """
    Enhance image quality (alternative method)
    
    Args:
        image: PIL Image object
    
    Returns:
        Enhanced PIL Image
    """
    # Convert to grayscale
    gray_image = image.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(gray_image)
    enhanced_image = enhancer.enhance(2.0)
    
    # Apply sharpening filter
    sharpened_image = enhanced_image.filter(ImageFilter.SHARPEN)
    
    # Apply unsharp mask for better edge definition
    unsharp_image = sharpened_image.filter(
        ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3)
    )
    
    return unsharp_image
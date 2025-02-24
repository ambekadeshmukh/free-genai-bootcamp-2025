import logging
import os
import datetime

def setup_logger(log_dir='logs', log_level=logging.INFO):
    """
    Set up and configure logger
    
    Args:
        log_dir: Directory to store log files
        log_level: Logging level
    
    Returns:
        Logger instance
    """
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    # Create a unique log file name based on date
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    log_file = os.path.join(log_dir, f'app_{today}.log')
    
    # Configure logger
    logger = logging.getLogger('french_writing_practice')
    logger.setLevel(log_level)
    
    # Clear existing handlers
    logger.handlers = []
    
    # Create file handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(log_level)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Create formatter and add to handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def log_error(logger, error, context=None):
    """
    Log an error with context information
    
    Args:
        logger: Logger instance
        error: Exception or error message
        context: Additional context information
    """
    if context:
        logger.error(f"{error} - Context: {context}")
    else:
        logger.error(f"{error}")

def log_user_action(logger, action, details=None):
    """
    Log a user action
    
    Args:
        logger: Logger instance
        action: Action name
        details: Additional details about the action
    """
    if details:
        logger.info(f"User Action: {action} - Details: {details}")
    else:
        logger.info(f"User Action: {action}")

def log_system_event(logger, event, details=None):
    """
    Log a system event
    
    Args:
        logger: Logger instance
        event: Event name
        details: Additional details about the event
    """
    if details:
        logger.info(f"System Event: {event} - Details: {details}")
    else:
        logger.info(f"System Event: {event}")

def log_performance(logger, component, duration_ms):
    """
    Log performance metrics
    
    Args:
        logger: Logger instance
        component: Component name
        duration_ms: Duration in milliseconds
    """
    logger.debug(f"Performance: {component} took {duration_ms}ms")
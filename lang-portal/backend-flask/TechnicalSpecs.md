# French Learning Portal - Technical Specifications

## Overview
A language learning portal designed to help users learn French vocabulary through various interactive activities. The system serves as both a vocabulary inventory and a learning progress tracker.

## System Architecture

### Backend Stack
- **Framework**: Flask (Python)
- **Database**: SQLite3
- **ORM**: SQLAlchemy
- **API Style**: RESTful
- **Testing**: pytest
- **Documentation**: OpenAPI/Swagger

### Key Components
1. **Core Application Server**
   - Flask application server
   - RESTful API endpoints
   - SQLAlchemy ORM integration
   - CORS support

2. **Database Layer**
   - SQLite3 database
   - Migration system
   - Seed data management
   - Automatic timestamps
   - Foreign key constraints

3. **Business Logic Layer**
   - Word management
   - Study session tracking
   - Progress analytics
   - Performance metrics

## Database Schema

### Tables
1. **words**
   - Primary key: id (INTEGER)
   - french (TEXT)
   - phonetic (TEXT)
   - english (TEXT)
   - parts (JSON)
   - created_at (TIMESTAMP)

2. **groups**
   - Primary key: id (INTEGER)
   - name (TEXT)
   - description (TEXT)
   - words_count (INTEGER)
   - created_at (TIMESTAMP)

3. **word_groups**
   - Composite key: (word_id, group_id)
   - word_id (INTEGER, FK)
   - group_id (INTEGER, FK)
   - created_at (TIMESTAMP)

4. **study_activities**
   - Primary key: id (INTEGER)
   - name (TEXT)
   - url (TEXT)
   - description (TEXT)
   - created_at (TIMESTAMP)

5. **study_sessions**
   - Primary key: id (INTEGER)
   - group_id (INTEGER, FK)
   - study_activity_id (INTEGER, FK)
   - created_at (TIMESTAMP)

6. **word_review_items**
   - Primary key: id (INTEGER)
   - word_id (INTEGER, FK)
   - study_session_id (INTEGER, FK)
   - correct (BOOLEAN)
   - created_at (TIMESTAMP)

### Relationships
- words ⟷ groups (Many-to-Many through word_groups)
- study_sessions → groups (Many-to-One)
- study_sessions → study_activities (Many-to-One)
- word_review_items → words (Many-to-One)
- word_review_items → study_sessions (Many-to-One)

## Performance Considerations

### Database Optimizations
1. **Indexes**
   - words(french, english)
   - groups(name)
   - study_sessions(created_at)
   - word_review_items(word_id, study_session_id)

2. **Counter Cache**
   - groups.words_count maintains count of words

3. **Pagination**
   - All list endpoints support pagination
   - Default page size: 50 items
   - Maximum page size: 100 items

## Security Considerations

### Data Protection
- Input validation using Pydantic models
- SQL injection prevention through ORM
- XSS prevention through content-type headers
- CORS configuration for frontend integration

### Error Handling
- Consistent error response format
- Appropriate HTTP status codes
- Detailed error messages in development
- Sanitized error messages in production

## Development Setup

### Requirements
- Python 3.8+
- pip
- virtualenv (recommended)

### Installation Steps
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Initialize database
python migrate.py

# Run tests
pytest

# Start server
flask run
```

## Testing Strategy

### Unit Tests
- Route handlers
- Database models
- Business logic
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Error handling
- Data validation

### Test Coverage Goals
- Minimum 80% code coverage
- Critical paths: 100% coverage
- Error conditions: 90% coverage

## Deployment

### Development
- Local SQLite database
- Debug mode enabled
- Detailed error messages
- Auto-reload enabled

### Production
- Connection pooling
- Error logging
- Performance monitoring
- Regular backups

## Monitoring and Maintenance

### Health Checks
- Database connectivity
- API response times
- Error rates
- Resource usage

### Backup Strategy
- Daily database backups
- Version control for code
- Migration version tracking
Backend Server Technical Specifications
Business Goal
A French language learning portal that serves as:

A comprehensive French vocabulary inventory system
A learning record store (LRS) tracking student performance
A unified platform to launch various French learning activities

Technical Requirements

Backend Framework: Python FastAPI (chosen for its modern async support, automatic OpenAPI docs, and type safety)
Database: SQLite3
Architecture: RESTful API
Response Format: JSON
Authentication: None (single user system)
Deployment: Docker container (optional, for easier deployment)

### Database Schema

SQLite Features Used:

Foreign Key constraints for referential integrity
JSON column type for flexible word parts storage
Automatic timestamp handling
Boolean type for correct/incorrect tracking
Cascade deletes to maintain data consistency


Table Relationships:

Many-to-many relationship between words and groups through word_groups
One-to-many relationship between groups and study_sessions
One-to-many relationship between study_activities and study_sessions
One-to-many relationship between study_sessions and word_review_items


Performance Considerations:

Counter cache on groups.words_count for efficient word counting
Indexes automatically created on primary and foreign keys
All necessary columns marked as nullable=False for data integrity

### API Endpoints


### Key Features

Word Management

CRUD operations for French vocabulary
Support for word components (gender, type, conjugation)
Search and filter capabilities


Group Organization

Thematic grouping of words
Group-based learning progress tracking
Words can belong to multiple groups


Study Sessions

Track learning progress
Record correct/incorrect attempts
Generate performance statistics


Learning Activities

Multiple activity types support
Activity progress tracking
Performance analytics
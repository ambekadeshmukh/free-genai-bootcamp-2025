# French Learning Portal API Documentation

## API Overview
RESTful API for managing French vocabulary learning, study sessions, and progress tracking.

## Base URL
`http://localhost:5000/api`

## Authentication
No authentication required (single-user system)

## Common Response Formats

### Success Response
```json
{
    "data": {
        // Response data here
    },
    "meta": {
        "page": 1,
        "per_page": 50,
        "total": 100
    }
}
```

### Error Response
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
```

## Endpoints

### Words Management

#### GET /words
Get paginated list of vocabulary words.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50, max: 100)
- `sort_by` (optional): Sort field (french|phonetic|english) (default: french)
- `order` (optional): Sort order (asc|desc) (default: asc)
- `search` (optional): Search term

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "french": "bonjour",
            "phonetic": "bɔ̃ʒuʁ",
            "english": "hello",
            "parts": {
                "type": "greeting"
            }
        }
    ],
    "meta": {
        "page": 1,
        "per_page": 50,
        "total": 100
    }
}
```

#### GET /words/{id}
Get details of a specific word.

**Response:**
```json
{
    "data": {
        "id": 1,
        "french": "bonjour",
        "phonetic": "bɔ̃ʒuʁ",
        "english": "hello",
        "parts": {
            "type": "greeting"
        }
    }
}
```

#### POST /words
Create a new vocabulary word.

**Request Body:**
```json
{
    "french": "merci",
    "phonetic": "mɛʁsi",
    "english": "thank you",
    "parts": {
        "type": "greeting"
    }
}
```

### Groups Management

#### GET /groups
Get paginated list of word groups.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50, max: 100)
- `sort_by` (optional): Sort field (name|words_count) (default: name)
- `order` (optional): Sort order (asc|desc) (default: asc)

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "name": "Common Verbs",
            "description": "Most frequently used French verbs",
            "words_count": 50
        }
    ],
    "meta": {
        "page": 1,
        "per_page": 50,
        "total": 5
    }
}
```

#### GET /groups/{id}/words
Get words in a specific group.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50, max: 100)

### Study Sessions

#### POST /study-sessions
Create a new study session.

**Request Body:**
```json
{
    "group_id": 1,
    "study_activity_id": 1
}
```

**Response:**
```json
{
    "data": {
        "id": 1,
        "group_id": 1,
        "study_activity_id": 1,
        "created_at": "2025-02-14T10:00:00Z"
    }
}
```

#### POST /study-sessions/{id}/review
Submit a word review.

**Request Body:**
```json
{
    "word_id": 1,
    "correct": true
}
```

### Dashboard Analytics

#### GET /dashboard/last_study_session
Get details of the most recent study session.

**Response:**
```json
{
    "data": {
        "session_id": 1,
        "created_at": "2025-02-14T10:00:00Z",
        "group_name": "Common Verbs",
        "activity_name": "Flashcards",
        "total_reviews": 20,
        "correct_count": 15,
        "accuracy": 75.0
    }
}
```

#### GET /dashboard/study_progress
Get study progress over time.

**Parameters:**
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
    "data": [
        {
            "date": "2025-02-14",
            "sessions_count": 3,
            "words_reviewed": 60,
            "correct_count": 45,
            "accuracy": 75.0
        }
    ]
}
```

### Study Activities

#### GET /study-activities
Get list of available study activities.

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "name": "Flashcards",
            "url": "/activities/flashcards",
            "description": "Practice vocabulary with digital flashcards"
        }
    ]
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Server Error

## Rate Limiting

No rate limiting implemented in current version.

## Data Models

### Word
```json
{
    "id": "integer",
    "french": "string",
    "phonetic": "string",
    "english": "string",
    "parts": "json object",
    "created_at": "timestamp"
}
```

### Group
```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "words_count": "integer",
    "created_at": "timestamp"
}
```

### StudySession
```json
{
    "id": "integer",
    "group_id": "integer",
    "study_activity_id": "integer",
    "created_at": "timestamp"
}
```

## Development Tools

### Testing the API
You can use tools like:
- curl
- Postman
- httpie
- Python requests library

Example curl command:
```bash
curl http://localhost:5000/api/words?page=1&per_page=50
```

### Debugging
Enable debug mode in Flask:
```bash
export FLASK_DEBUG=1
flask run
```
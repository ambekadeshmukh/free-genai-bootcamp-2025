export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
    LESSONS: '/lessons',
    PROGRESS: '/progress',
    TRANSLATE: '/translate'
};

export const DIFFICULTY_LEVELS = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced'
};

export const LESSON_TYPES = {
    VOCABULARY: 'vocabulary',
    GRAMMAR: 'grammar',
    CONVERSATION: 'conversation',
    CULTURE: 'culture'
};

export const ERROR_MESSAGES = {
    FETCH_LESSONS: 'Failed to fetch lessons',
    SAVE_PROGRESS: 'Failed to save progress',
    NETWORK_ERROR: 'Network error occurred'
};
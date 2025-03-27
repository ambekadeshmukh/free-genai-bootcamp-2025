import { DIFFICULTY_LEVELS } from './constants';

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
};

export const calculateProgress = (completed, total) => {
    return Math.round((completed / total) * 100);
};

export const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case DIFFICULTY_LEVELS.BEGINNER:
            return '#4CAF50';
        case DIFFICULTY_LEVELS.INTERMEDIATE:
            return '#FFC107';
        case DIFFICULTY_LEVELS.ADVANCED:
            return '#F44336';
        default:
            return '#9E9E9E';
    }
};

export const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

export const generateLessonSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
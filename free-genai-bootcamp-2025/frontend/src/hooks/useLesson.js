import { useState, useEffect } from 'react';
import { lessonService } from '../services/api';
import { ERROR_MESSAGES } from '../utils/constants';

export const useLesson = (lessonId = null) => {
    const [lesson, setLesson] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLessons = async () => {
        try {
            setLoading(true);
            const response = await lessonService.getAllLessons();
            setLessons(response.data);
            setError(null);
        } catch (err) {
            setError(ERROR_MESSAGES.FETCH_LESSONS);
        } finally {
            setLoading(false);
        }
    };

    const fetchLesson = async (id) => {
        try {
            setLoading(true);
            const response = await lessonService.getLessonById(id);
            setLesson(response.data);
            setError(null);
        } catch (err) {
            setError(ERROR_MESSAGES.FETCH_LESSONS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lessonId) {
            fetchLesson(lessonId);
        } else {
            fetchLessons();
        }
    }, [lessonId]);

    return {
        lesson,
        lessons,
        loading,
        error,
        refetchLessons: fetchLessons,
        refetchLesson: fetchLesson
    };
};
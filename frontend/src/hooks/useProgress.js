import { useState, useEffect } from 'react';
import { progressService } from '../services/api';
import { ERROR_MESSAGES } from '../utils/constants';

export const useProgress = () => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const response = await progressService.getUserProgress();
            setProgress(response.data);
            setError(null);
        } catch (err) {
            setError(ERROR_MESSAGES.FETCH_PROGRESS);
        } finally {
            setLoading(false);
        }
    };

    const updateProgress = async (lessonId, completed) => {
        try {
            setLoading(true);
            const response = await progressService.updateProgress({
                lessonId,
                completed
            });
            setProgress(response.data);
            setError(null);
            return true;
        } catch (err) {
            setError(ERROR_MESSAGES.SAVE_PROGRESS);
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, []);

    return {
        progress,
        loading,
        error,
        updateProgress,
        refetchProgress: fetchProgress
    };
};
import React, { useState, useEffect } from 'react';
import { lessonService } from '../../services/api';
import LessonCard from './LessonCard';
import Loading from '../common/Loading';

const LessonList = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await lessonService.getAllLessons();
                setLessons(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, []);

    if (loading) return <Loading />;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="lesson-list">
            {lessons.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
            ))}
        </div>
    );
};

export default LessonList;
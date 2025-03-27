import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const lessonService = {
    getAllLessons: () => api.get('/lessons'),
    getLessonById: (id) => api.get(`/lessons/${id}`),
    createLesson: (data) => api.post('/lessons', data),
    updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
    deleteLesson: (id) => api.delete(`/lessons/${id}`)
};

export const progressService = {
    getUserProgress: () => api.get('/progress'),
    updateProgress: (data) => api.post('/progress', data)
};
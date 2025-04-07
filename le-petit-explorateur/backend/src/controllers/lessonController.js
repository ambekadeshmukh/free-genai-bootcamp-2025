const openaiService = require('../services/openaiService');
const chromaService = require('../services/chromaService');

exports.getAllLessons = async (req, res) => {
    try {
        // Implement lesson retrieval logic
        const lessons = await chromaService.getAllLessons();
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        const lesson = await chromaService.getLessonById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createLesson = async (req, res) => {
    try {
        const { title, content, difficulty } = req.body;
        // Generate lesson content using OpenAI
        const enhancedContent = await openaiService.enhanceLessonContent(content);
        const lesson = await chromaService.createLesson({
            title,
            content: enhancedContent,
            difficulty
        });
        res.status(201).json(lesson);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
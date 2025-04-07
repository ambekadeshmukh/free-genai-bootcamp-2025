const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.enhanceLessonContent = async (content) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a French language teaching assistant."
                },
                {
                    role: "user",
                    content: `Enhance this French lesson content: ${content}`
                }
            ]
        });
        return completion.choices[0].message.content;
    } catch (error) {
        throw new Error(`OpenAI API error: ${error.message}`);
    }
};
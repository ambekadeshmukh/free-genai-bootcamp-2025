// test-ai-integration.js
require('dotenv').config();
const { OpenAI } = require('openai');

// Print full API key length (but not the actual key)
const apiKey = process.env.OPENAI_API_KEY || '';
console.log('API Key length:', apiKey.length);
console.log('API Key first 7 chars:', apiKey.substring(0, 7));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  console.log('Testing OpenAI integration...');
  console.log('API Key configured:', !!process.env.OPENAI_API_KEY);
  
  try {
    // Simple test with minimal tokens
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello" in French' }
      ],
      temperature: 0.5,
      max_tokens: 20
    });
    
    console.log('OpenAI Response:', response.choices[0].message.content);
    console.log('Integration test successful!');
    
    // Print usage information
    if (response.usage) {
      console.log('Token usage:', {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      });
    }
  } catch (error) {
    console.error('OpenAI integration test failed:', error.message);
    
    // Print detailed error information
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Check specific error types
    if (error.code === 'insufficient_quota') {
      console.error('Account has insufficient quota. Please check billing status.');
    }
  }
}

testOpenAI();
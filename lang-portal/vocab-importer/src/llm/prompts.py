VOCAB_GENERATION_PROMPT = """Generate a French vocabulary list based on the theme: "{theme}".
Please generate {num_words} words/phrases that are relevant to this theme.

The response should be a JSON array with the following structure for each word:
{{
    "french": "word in French",
    "pronunciation": "pronunciation in IPA",
    "english": "English translation",
    "parts": [
        {{
            "type": "article/noun/verb/etc",
            "gender": "masculine/feminine" (if applicable),
            "conjugation": "basic conjugation" (if it's a verb)
        }}
    ]
}}

Ensure that:
1. All French words are grammatically correct
2. Pronunciations use proper IPA notation
3. Parts includes relevant grammatical information
4. The response is valid JSON
"""
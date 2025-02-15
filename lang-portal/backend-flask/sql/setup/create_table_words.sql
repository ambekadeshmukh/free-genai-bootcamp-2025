-- create_table_words.sql
CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    french TEXT NOT NULL,
    phonetic TEXT NOT NULL,
    english TEXT NOT NULL,
    parts TEXT NOT NULL, -- JSON string for word components
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_words_french ON words(french);
CREATE INDEX IF NOT EXISTS idx_words_english ON words(english);
CREATE UNIQUE INDEX IF NOT EXISTS idx_words_french_unique ON words(french);
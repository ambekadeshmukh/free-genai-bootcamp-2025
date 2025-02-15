-- create_table_word_reviews.sql
CREATE TABLE IF NOT EXISTS word_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_reviews_word ON word_reviews(word_id);
CREATE INDEX IF NOT EXISTS idx_word_reviews_counts ON word_reviews(correct_count, wrong_count);
CREATE INDEX IF NOT EXISTS idx_word_reviews_last_reviewed ON word_reviews(last_reviewed_at);
-- create_table_word_review_items.sql
CREATE TABLE IF NOT EXISTS word_review_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    study_session_id INTEGER NOT NULL,
    correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id) REFERENCES study_sessions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_review_items_word ON word_review_items(word_id);
CREATE INDEX IF NOT EXISTS idx_word_review_items_session ON word_review_items(study_session_id);
CREATE INDEX IF NOT EXISTS idx_word_review_items_created ON word_review_items(created_at);
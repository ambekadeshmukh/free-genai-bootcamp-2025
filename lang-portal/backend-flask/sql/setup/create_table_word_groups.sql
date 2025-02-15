-- create_table_word_groups.sql
CREATE TABLE IF NOT EXISTS word_groups (
    word_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (word_id, group_id),
    FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
);
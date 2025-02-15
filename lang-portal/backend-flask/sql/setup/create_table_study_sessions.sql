-- create_table_study_sessions.sql
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    study_activity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    FOREIGN KEY (study_activity_id) REFERENCES study_activities (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_group ON study_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_activity ON study_sessions(study_activity_id);

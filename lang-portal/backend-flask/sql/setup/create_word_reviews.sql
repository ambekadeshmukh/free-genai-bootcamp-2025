-- create_word_reviews.sql
CREATE VIEW IF NOT EXISTS word_review_stats AS
SELECT 
    w.id as word_id,
    w.french,
    w.english,
    COUNT(wri.id) as total_reviews,
    SUM(CASE WHEN wri.correct THEN 1 ELSE 0 END) as correct_count,
    SUM(CASE WHEN NOT wri.correct THEN 1 ELSE 0 END) as wrong_count,
    MAX(wri.created_at) as last_reviewed_at
FROM words w
LEFT JOIN word_review_items wri ON w.id = wri.word_id
GROUP BY w.id, w.french, w.english;
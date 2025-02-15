-- insert_study_activities.sql
INSERT INTO study_activities (name, url, description) VALUES 
    ('Flashcards', '/activities/flashcards', 'Practice vocabulary with digital flashcards'),
    ('Multiple Choice', '/activities/quiz', 'Test your knowledge with multiple choice questions'),
    ('Writing Practice', '/activities/writing', 'Practice writing French words and phrases'),
    ('Listening Exercise', '/activities/listening', 'Improve your listening comprehension'),
    ('Word Match', '/activities/matching', 'Match French words with their English translations')
ON CONFLICT(name) DO NOTHING;
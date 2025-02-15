import os
import json
from lib.db import init_db, db_session
from models import Word, Group, StudyActivity, WordGroup

def load_seed_data():
    """Load seed data from JSON files"""
    # Load words
    with open('seed/data_verbs.json', 'r', encoding='utf-8') as f:
        verbs_data = json.load(f)
        for verb in verbs_data['verbs']:
            word = Word(
                french=verb['french'],
                phonetic=verb['phonetic'],
                english=verb['english'],
                parts=verb['parts']
            )
            db_session.add(word)
    
    with open('seed/data_nouns.json', 'r', encoding='utf-8') as f:
        nouns_data = json.load(f)
        for noun in nouns_data['nouns']:
            word = Word(
                french=noun['french'],
                phonetic=noun['phonetic'],
                english=noun['english'],
                parts=noun['parts']
            )
            db_session.add(word)

    # Load study activities
    with open('seed/study_activities.json', 'r', encoding='utf-8') as f:
        activities_data = json.load(f)
        for activity in activities_data['study_activities']:
            study_activity = StudyActivity(
                name=activity['name'],
                url=activity['url'],
                description=activity['description']
            )
            db_session.add(study_activity)

    # Create default groups
    default_groups = [
        {'name': 'Common Verbs', 'description': 'Most frequently used French verbs'},
        {'name': 'Basic Nouns', 'description': 'Essential everyday nouns'},
        {'name': 'Greetings', 'description': 'Common greetings and pleasantries'},
        {'name': 'Numbers', 'description': 'Numbers and counting in French'},
        {'name': 'Colors', 'description': 'Color vocabulary'}
    ]

    for group_data in default_groups:
        group = Group(
            name=group_data['name'],
            description=group_data['description']
        )
        db_session.add(group)

    db_session.commit()

def migrate():
    """Run database migrations"""
    print("Initializing database...")
    init_db()
    
    print("Loading seed data...")
    load_seed_data()
    
    print("Migration completed successfully!")

if __name__ == '__main__':
    migrate()
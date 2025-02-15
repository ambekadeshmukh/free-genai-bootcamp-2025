import pytest
from app import app
from lib.db import db_session
from models import StudySession, Group, StudyActivity, Word, WordReviewItem

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_group():
    group = Group(name='Test Group', description='Test Description')
    db_session.add(group)
    db_session.commit()
    yield group
    db_session.delete(group)
    db_session.commit()

@pytest.fixture
def sample_activity():
    activity = StudyActivity(
        name='Test Activity',
        url='/test',
        description='Test Description'
    )
    db_session.add(activity)
    db_session.commit()
    yield activity
    db_session.delete(activity)
    db_session.commit()

@pytest.fixture
def sample_session(sample_group, sample_activity):
    session = StudySession(
        group_id=sample_group.id,
        study_activity_id=sample_activity.id
    )
    db_session.add(session)
    db_session.commit()
    yield session
    db_session.delete(session)
    db_session.commit()

def test_create_study_session(client, sample_group, sample_activity):
    """Test creating a new study session"""
    data = {
        'group_id': sample_group.id,
        'study_activity_id': sample_activity.id
    }
    response = client.post('/api/study-sessions', json=data)
    assert response.status_code == 201
    assert response.json['group_id'] == sample_group.id
    assert response.json['study_activity_id'] == sample_activity.id

def test_get_study_session(client, sample_session):
    """Test getting a study session"""
    response = client.get(f'/api/study-sessions/{sample_session.id}')
    assert response.status_code == 200
    assert response.json['id'] == sample_session.id

def test_submit_review(client, sample_session):
    """Test submitting a word review"""
    # Create a test word first
    word = Word(
        french='test',
        phonetic='test',
        english='test',
        parts={}
    )
    db_session.add(word)
    db_session.commit()

    review_data = {
        'word_id': word.id,
        'correct': True
    }
    response = client.post(
        f'/api/study-sessions/{sample_session.id}/review',
        json=review_data
    )
    assert response.status_code == 201
    assert response.json['correct'] == True

    # Cleanup
    db_session.delete(word)
    db_session.commit()

def test_get_session_reviews(client, sample_session):
    """Test getting reviews for a session"""
    response = client.get(f'/api/study-sessions/{sample_session.id}/reviews')
    assert response.status_code == 200
    assert isinstance(response.json, list)
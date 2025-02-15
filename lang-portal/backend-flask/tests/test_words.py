import pytest
from app import app
from lib.db import db_session
from models import Word

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_word():
    word = Word(
        french='bonjour',
        phonetic='bɔ̃ʒuʁ',
        english='hello',
        parts={'type': 'greeting'}
    )
    db_session.add(word)
    db_session.commit()
    yield word
    db_session.delete(word)
    db_session.commit()

def test_get_words(client):
    """Test getting list of words"""
    response = client.get('/api/words')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_get_single_word(client, sample_word):
    """Test getting a single word"""
    response = client.get(f'/api/words/{sample_word.id}')
    assert response.status_code == 200
    assert response.json['french'] == 'bonjour'
    assert response.json['english'] == 'hello'

def test_create_word(client):
    """Test creating a new word"""
    word_data = {
        'french': 'merci',
        'phonetic': 'mɛʁsi',
        'english': 'thank you',
        'parts': {'type': 'greeting'}
    }
    response = client.post('/api/words', json=word_data)
    assert response.status_code == 201
    assert response.json['french'] == 'merci'
    
    # Cleanup
    created_word = Word.query.filter_by(french='merci').first()
    db_session.delete(created_word)
    db_session.commit()

def test_get_nonexistent_word(client):
    """Test getting a word that doesn't exist"""
    response = client.get('/api/words/9999')
    assert response.status_code == 404
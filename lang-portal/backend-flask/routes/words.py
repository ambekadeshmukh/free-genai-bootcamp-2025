from flask import Blueprint, jsonify, request
from lib.db import db_session
from models import Word
from sqlalchemy import desc

bp = Blueprint('words', __name__, url_prefix='/api/words')

@bp.route('/', methods=['GET'])
def get_words():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    sort_by = request.args.get('sort_by', 'french')
    order = request.args.get('order', 'asc')
    
    query = Word.query
    
    # Apply sorting
    if order == 'desc':
        query = query.order_by(desc(getattr(Word, sort_by)))
    else:
        query = query.order_by(getattr(Word, sort_by))
    
    # Apply pagination
    offset = (page - 1) * per_page
    words = query.offset(offset).limit(per_page).all()
    
    return jsonify([{
        'id': word.id,
        'french': word.french,
        'phonetic': word.phonetic,
        'english': word.english,
        'parts': word.parts
    } for word in words])

@bp.route('/<int:word_id>', methods=['GET'])
def get_word(word_id):
    word = Word.query.get_or_404(word_id)
    return jsonify({
        'id': word.id,
        'french': word.french,
        'phonetic': word.phonetic,
        'english': word.english,
        'parts': word.parts
    })

@bp.route('/', methods=['POST'])
def create_word():
    data = request.get_json()
    
    word = Word(
        french=data['french'],
        phonetic=data['phonetic'],
        english=data['english'],
        parts=data['parts']
    )
    
    db_session.add(word)
    db_session.commit()
    
    return jsonify({
        'id': word.id,
        'french': word.french,
        'phonetic': word.phonetic,
        'english': word.english,
        'parts': word.parts
    }), 201
from flask import Blueprint, jsonify, request
from lib.db import db_session
from models import Group, Word
from sqlalchemy import desc

bp = Blueprint('groups', __name__, url_prefix='/api/groups')

@bp.route('/', methods=['GET'])
def get_groups():
    """Get paginated list of word groups"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    sort_by = request.args.get('sort_by', 'name')
    order = request.args.get('order', 'asc')
    
    query = Group.query
    
    # Apply sorting
    if order == 'desc':
        query = query.order_by(desc(getattr(Group, sort_by)))
    else:
        query = query.order_by(getattr(Group, sort_by))
    
    # Apply pagination
    offset = (page - 1) * per_page
    groups = query.offset(offset).limit(per_page).all()
    
    return jsonify([{
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'words_count': group.words_count
    } for group in groups])

@bp.route('/<int:group_id>', methods=['GET'])
def get_group(group_id):
    """Get detailed information about a specific group"""
    group = Group.query.get_or_404(group_id)
    return jsonify({
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'words_count': group.words_count
    })

@bp.route('/<int:group_id>/words', methods=['GET'])
def get_group_words(group_id):
    """Get all words in a specific group"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    group = Group.query.get_or_404(group_id)
    offset = (page - 1) * per_page
    
    words = Word.query.join(WordGroup).filter(
        WordGroup.group_id == group_id
    ).offset(offset).limit(per_page).all()
    
    return jsonify([{
        'id': word.id,
        'french': word.french,
        'phonetic': word.phonetic,
        'english': word.english,
        'parts': word.parts
    } for word in words])

@bp.route('/', methods=['POST'])
def create_group():
    """Create a new word group"""
    data = request.get_json()
    
    group = Group(
        name=data['name'],
        description=data.get('description', '')
    )
    
    db_session.add(group)
    db_session.commit()
    
    return jsonify({
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'words_count': 0
    }), 201

@bp.route('/<int:group_id>/words', methods=['POST'])
def add_words_to_group(group_id):
    """Add words to a group"""
    group = Group.query.get_or_404(group_id)
    data = request.get_json()
    word_ids = data.get('word_ids', [])
    
    existing_words = set(wg.word_id for wg in WordGroup.query.filter_by(group_id=group_id).all())
    new_words = set(word_ids) - existing_words
    
    for word_id in new_words:
        word_group = WordGroup(word_id=word_id, group_id=group_id)
        db_session.add(word_group)
    
    group.words_count = len(existing_words) + len(new_words)
    db_session.commit()
    
    return jsonify({
        'message': f'Added {len(new_words)} words to group',
        'group_id': group_id,
        'words_count': group.words_count
    })
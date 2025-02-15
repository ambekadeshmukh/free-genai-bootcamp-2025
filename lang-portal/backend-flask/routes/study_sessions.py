from flask import Blueprint, jsonify, request
from lib.db import db_session
from models import StudySession, WordReviewItem, Group, StudyActivity
from datetime import datetime

bp = Blueprint('study_sessions', __name__, url_prefix='/api/study-sessions')

@bp.route('/', methods=['POST'])
def create_study_session():
    """Create a new study session"""
    data = request.get_json()
    
    # Validate group and activity exist
    group = Group.query.get_or_404(data['group_id'])
    activity = StudyActivity.query.get_or_404(data['study_activity_id'])
    
    session = StudySession(
        group_id=group.id,
        study_activity_id=activity.id,
        created_at=datetime.utcnow()
    )
    
    db_session.add(session)
    db_session.commit()
    
    return jsonify({
        'id': session.id,
        'group_id': session.group_id,
        'study_activity_id': session.study_activity_id,
        'created_at': session.created_at
    }), 201

@bp.route('/<int:session_id>', methods=['GET'])
def get_study_session(session_id):
    """Get details about a specific study session"""
    session = StudySession.query.get_or_404(session_id)
    
    # Get review statistics
    reviews = WordReviewItem.query.filter_by(study_session_id=session_id).all()
    correct_count = sum(1 for review in reviews if review.correct)
    
    return jsonify({
        'id': session.id,
        'group': {
            'id': session.group.id,
            'name': session.group.name
        },
        'activity': {
            'id': session.activity.id,
            'name': session.activity.name
        },
        'created_at': session.created_at,
        'stats': {
            'total_reviews': len(reviews),
            'correct_count': correct_count,
            'accuracy': (correct_count / len(reviews) * 100) if reviews else 0
        }
    })

@bp.route('/<int:session_id>/review', methods=['POST'])
def submit_review(session_id):
    """Submit a word review during a study session"""
    session = StudySession.query.get_or_404(session_id)
    data = request.get_json()
    
    review = WordReviewItem(
        word_id=data['word_id'],
        study_session_id=session_id,
        correct=data['correct'],
        created_at=datetime.utcnow()
    )
    
    db_session.add(review)
    db_session.commit()
    
    return jsonify({
        'id': review.id,
        'word_id': review.word_id,
        'study_session_id': review.study_session_id,
        'correct': review.correct,
        'created_at': review.created_at
    }), 201

@bp.route('/<int:session_id>/reviews', methods=['GET'])
def get_session_reviews(session_id):
    """Get all reviews for a specific study session"""
    session = StudySession.query.get_or_404(session_id)
    reviews = WordReviewItem.query.filter_by(study_session_id=session_id).all()
    
    return jsonify([{
        'id': review.id,
        'word': {
            'id': review.word.id,
            'french': review.word.french,
            'english': review.word.english
        },
        'correct': review.correct,
        'created_at': review.created_at
    } for review in reviews])
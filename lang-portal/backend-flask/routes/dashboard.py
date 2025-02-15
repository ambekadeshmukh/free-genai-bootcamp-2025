from flask import Blueprint, jsonify
from lib.db import db_session
from models import StudySession, WordReviewItem, Group
from sqlalchemy import func, desc
from datetime import datetime, timedelta

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@bp.route('/last_study_session', methods=['GET'])
def get_last_study_session():
    """Get the most recent study session with performance metrics"""
    last_session = StudySession.query.order_by(desc(StudySession.created_at)).first()
    
    if not last_session:
        return jsonify({
            'message': 'No study sessions found'
        }), 404
    
    # Calculate session statistics
    stats = db_session.query(
        func.count(WordReviewItem.id).label('total_reviews'),
        func.sum(case([(WordReviewItem.correct == True, 1)], else_=0)).label('correct_count')
    ).filter(WordReviewItem.study_session_id == last_session.id).first()
    
    return jsonify({
        'session_id': last_session.id,
        'created_at': last_session.created_at,
        'group_name': last_session.group.name,
        'activity_name': last_session.activity.name,
        'total_reviews': stats.total_reviews,
        'correct_count': stats.correct_count,
        'accuracy': (stats.correct_count / stats.total_reviews * 100) if stats.total_reviews > 0 else 0
    })

@bp.route('/study_progress', methods=['GET'])
def get_study_progress():
    """Get study progress over the last 7 days"""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    daily_progress = db_session.query(
        func.date(StudySession.created_at).label('date'),
        func.count(StudySession.id).label('sessions_count'),
        func.count(WordReviewItem.id).label('words_reviewed'),
        func.sum(case([(WordReviewItem.correct == True, 1)], else_=0)).label('correct_count')
    ).join(WordReviewItem).filter(
        StudySession.created_at >= seven_days_ago
    ).group_by(
        func.date(StudySession.created_at)
    ).all()
    
    return jsonify([{
        'date': day.date.strftime('%Y-%m-%d'),
        'sessions_count': day.sessions_count,
        'words_reviewed': day.words_reviewed,
        'correct_count': day.correct_count,
        'accuracy': (day.correct_count / day.words_reviewed * 100) if day.words_reviewed > 0 else 0
    } for day in daily_progress])

@bp.route('/quick-stats', methods=['GET'])
def get_quick_stats():
    """Get quick overview statistics"""
    total_groups = Group.query.count()
    total_sessions = StudySession.query.count()
    
    # Calculate overall accuracy
    accuracy_stats = db_session.query(
        func.count(WordReviewItem.id).label('total_reviews'),
        func.sum(case([(WordReviewItem.correct == True, 1)], else_=0)).label('correct_count')
    ).first()
    
    return jsonify({
        'total_groups': total_groups,
        'total_sessions': total_sessions,
        'total_reviews': accuracy_stats.total_reviews,
        'overall_accuracy': (accuracy_stats.correct_count / accuracy_stats.total_reviews * 100) 
            if accuracy_stats.total_reviews > 0 else 0
    })
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from lib.db import Base
from datetime import datetime

class StudySession(Base):
    __tablename__ = 'study_sessions'
    id = Column(Integer, primary_key=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    group_id = Column(Integer, ForeignKey('groups.id'))
    
    group = relationship("Group", back_populates="study_sessions")
    word_reviews = relationship("WordReviewItem", back_populates="study_session")

class WordReviewItem(Base):
    __tablename__ = 'word_review_items'
    id = Column(Integer, primary_key=True)
    word_id = Column(Integer, ForeignKey('words.id'))
    study_session_id = Column(Integer, ForeignKey('study_sessions.id'))
    is_correct = Column(Boolean, default=False)
    
    word = relationship("Word", back_populates="reviews")
    study_session = relationship("StudySession", back_populates="word_reviews")

class Group(Base):
    __tablename__ = 'groups'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    
    study_sessions = relationship("StudySession", back_populates="group")
    words = relationship("Word", back_populates="group")

class Word(Base):
    __tablename__ = 'words'
    id = Column(Integer, primary_key=True)
    french = Column(String(100), nullable=False)
    english = Column(String(100), nullable=False)
    group_id = Column(Integer, ForeignKey('groups.id'))
    
    group = relationship("Group", back_populates="words")
    reviews = relationship("WordReviewItem", back_populates="word")

class StudyActivity(Base):
    __tablename__ = 'study_activities'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    
    sessions = relationship("StudySession", back_populates="activity")

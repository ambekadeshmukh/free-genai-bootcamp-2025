from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

database_url = os.getenv('DATABASE_URL', 'sqlite:///french_portal.db')
engine = create_engine(database_url)
db_session = scoped_session(sessionmaker(autocommit=False,
                                       autoflush=False,
                                       bind=engine))

Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    """Initialize the database and create all tables"""
    import models  # Import models to register them
    Base.metadata.create_all(bind=engine)

def shutdown_session(exception=None):
    """Remove the session after each request"""
    db_session.remove()
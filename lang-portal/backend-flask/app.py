from flask import Flask
from flask_cors import CORS
from lib.db import db_session, init_db
from routes import dashboard, groups, study_activities, study_sessions, words

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(dashboard.bp)
app.register_blueprint(groups.bp)
app.register_blueprint(study_activities.bp)
app.register_blueprint(study_sessions.bp)
app.register_blueprint(words.bp)

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

@app.cli.command("init-db")
def init_db_command():
    """Initialize the database."""
    init_db()
    print("Initialized the database.")
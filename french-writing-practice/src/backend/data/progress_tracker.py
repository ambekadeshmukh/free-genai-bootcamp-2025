import json
import os
import time
from collections import defaultdict

# File path for storing user data
DATA_DIR = 'data'
USER_DATA_FILE = os.path.join(DATA_DIR, 'user_progress.json')

def load_user_data():
    """Load user data from JSON file"""
    if not os.path.exists(USER_DATA_FILE):
        return {
            "history": [],
            "word_stats": {},
            "user_stats": {
                "total_practiced": 0,
                "total_correct": 0,
                "current_streak": 0,
                "best_streak": 0,
                "last_practice": None
            }
        }
    
    try:
        with open(USER_DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {
            "history": [],
            "word_stats": {},
            "user_stats": {
                "total_practiced": 0,
                "total_correct": 0,
                "current_streak": 0,
                "best_streak": 0,
                "last_practice": None
            }
        }

def save_user_data(data):
    """Save user data to JSON file"""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(USER_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving user data: {str(e)}")
        return False

def update_progress(word, correct, submission):
    """Update user progress with practice results"""
    data = load_user_data()
    
    # Add to history
    history_entry = {
        "word": word,
        "correct": correct,
        "submission": submission,
        "timestamp": time.time()
    }
    data["history"].append(history_entry)
    
    # Update word-specific stats
    if word not in data["word_stats"]:
        data["word_stats"][word] = {
            "practices": 0,
            "correct": 0,
            "last_practiced": None
        }
    
    data["word_stats"][word]["practices"] += 1
    if correct:
        data["word_stats"][word]["correct"] += 1
    data["word_stats"][word]["last_practiced"] = time.time()
    
    # Update overall user stats
    data["user_stats"]["total_practiced"] += 1
    if correct:
        data["user_stats"]["total_correct"] += 1
        data["user_stats"]["current_streak"] += 1
    else:
        data["user_stats"]["current_streak"] = 0
    
    # Update best streak
    if data["user_stats"]["current_streak"] > data["user_stats"]["best_streak"]:
        data["user_stats"]["best_streak"] = data["user_stats"]["current_streak"]
    
    data["user_stats"]["last_practice"] = time.time()
    
    # Save updated data
    save_user_data(data)
    
    return True

def get_user_stats():
    """Get user statistics"""
    data = load_user_data()
    
    # Basic stats from user_stats
    stats = data["user_stats"].copy()
    
    # Calculate additional stats
    if stats["total_practiced"] > 0:
        stats["accuracy"] = (stats["total_correct"] / stats["total_practiced"]) * 100
    else:
        stats["accuracy"] = 0
    
    # Find challenging words (practiced multiple times with low success rate)
    challenging_words = []
    for word, word_stats in data["word_stats"].items():
        if word_stats["practices"] >= 3:
            success_rate = (word_stats["correct"] / word_stats["practices"]) * 100
            if success_rate < 50:
                challenging_words.append({
                    "word": word,
                    "success_rate": success_rate,
                    "practices": word_stats["practices"]
                })
    
    # Sort challenging words by success rate
    challenging_words.sort(key=lambda x: x["success_rate"])
    stats["challenging_words"] = [word["word"] for word in challenging_words[:5]]
    
    # Get recent activity
    stats["recent_activity"] = data["history"][-10:] if data["history"] else []
    
    return stats

def get_word_progress(word):
    """Get progress statistics for a specific word"""
    data = load_user_data()
    
    if word in data["word_stats"]:
        return data["word_stats"][word]
    else:
        return {
            "practices": 0,
            "correct": 0,
            "last_practiced": None
        }

def reset_progress():
    """Reset all user progress data"""
    data = {
        "history": [],
        "word_stats": {},
        "user_stats": {
            "total_practiced": 0,
            "total_correct": 0,
            "current_streak": 0,
            "best_streak": 0,
            "last_practice": None
        }
    }
    
    save_user_data(data)
    return True
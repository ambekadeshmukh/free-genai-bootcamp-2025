import streamlit as st
import os
import yaml
from dotenv import load_dotenv
from PIL import Image
import time
import random

# Load environment variables
load_dotenv()

# Local imports
from src.backend.ocr.text_recognition import process_image
from src.backend.grading.evaluator import grade_submission
from src.backend.data.word_manager import get_word, get_all_words
from src.backend.data.progress_tracker import update_progress, get_user_stats
from src.utils.helpers import load_config

# Page configuration
st.set_page_config(
    page_title="French Writing Practice",
    page_icon="🇫🇷",
    layout="wide"
)

# Load CSS
def load_css():
    with open('static/css/style.css') as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Initialize session state
def initialize_session():
    if 'current_word' not in st.session_state:
        st.session_state.current_word = None
    if 'practice_count' not in st.session_state:
        st.session_state.practice_count = 0
    if 'correct_count' not in st.session_state:
        st.session_state.correct_count = 0
    if 'streak' not in st.session_state:
        st.session_state.streak = 0
    if 'history' not in st.session_state:
        st.session_state.history = []

def main():
    # Initialize
    load_css()
    initialize_session()
    
    # Sidebar
    with st.sidebar:
        st.title("French Writing Practice")
        st.markdown("---")
        page = st.radio("", ["Practice", "Statistics", "Settings"])

    # Display selected page
    if page == "Practice":
        practice_page()
    elif page == "Statistics":
        statistics_page()
    else:
        settings_page()

def practice_page():
    st.header("Word Practice")
    
    col1, col2 = st.columns([2, 3])
    
    with col1:
        if st.button("Get New Word"):
            with st.spinner("Loading new word..."):
                st.session_state.current_word = get_word()
        
        if st.session_state.current_word:
            st.subheader("French Word")
            st.markdown(f"<div class='word-display'>{st.session_state.current_word['french']}</div>", unsafe_allow_html=True)
            
            st.subheader("English Translation")
            st.markdown(f"<div class='translation-display'>{st.session_state.current_word['english']}</div>", unsafe_allow_html=True)
            
            st.markdown("### Instructions")
            st.write("Practice writing this word in French. Upload your handwritten attempt.")
    
    with col2:
        if st.session_state.current_word:
            st.subheader("Your Submission")
            uploaded_file = st.file_uploader("Upload your handwritten word", type=['png', 'jpg', 'jpeg'])
            
            if uploaded_file:
                image = Image.open(uploaded_file)
                st.image(image, caption="Your writing", width=400)
                
                if st.button("Submit for Review"):
                    with st.spinner("Analyzing your writing..."):
                        # Process image with OCR
                        transcription = process_image(image)
                        
                        # Grade submission
                        result = grade_submission(
                            transcription,
                            st.session_state.current_word['french']
                        )
                        
                        # Update stats
                        st.session_state.practice_count += 1
                        if result["correct"]:
                            st.session_state.correct_count += 1
                            st.session_state.streak += 1
                        else:
                            st.session_state.streak = 0
                        
                        # Add to history
                        st.session_state.history.append({
                            "word": st.session_state.current_word['french'],
                            "submission": transcription,
                            "correct": result["correct"],
                            "timestamp": time.time()
                        })
                        
                        # Display results
                        st.subheader("Results")
                        if result["correct"]:
                            st.success("✓ Correct!")
                        else:
                            st.error("✗ Needs improvement")
                        
                        st.write(f"**Your writing:** {transcription}")
                        st.write(f"**Feedback:** {result['feedback']}")
                        
                        # Update progress in database
                        update_progress(
                            word=st.session_state.current_word['french'],
                            correct=result["correct"],
                            submission=transcription
                        )

def statistics_page():
    st.header("Your Progress")
    
    # Summary statistics
    col1, col2, col3, col4 = st.columns(4)
    
    # Either use session state or fetch from database
    stats = get_user_stats()
    
    with col1:
        st.metric("Words Practiced", stats["total_practiced"])
    with col2:
        if stats["total_practiced"] > 0:
            success_rate = f"{(stats['total_correct'] / stats['total_practiced']) * 100:.1f}%"
        else:
            success_rate = "0%"
        st.metric("Success Rate", success_rate)
    with col3:
        st.metric("Current Streak", stats["current_streak"])
    with col4:
        st.metric("Best Streak", stats["best_streak"])
    
    # Recent activity
    st.subheader("Recent Activity")
    if st.session_state.history:
        for i, entry in enumerate(reversed(st.session_state.history[-5:])):
            status = "✓" if entry["correct"] else "✗"
            st.write(f"{status} **{entry['word']}** - Submission: {entry['submission']}")
    else:
        st.write("No practice history yet. Start practicing to see your progress!")
    
    # Challenging words
    st.subheader("Words to Practice More")
    challenging_words = stats.get("challenging_words", [])
    if challenging_words:
        for word in challenging_words:
            st.write(f"• {word}")
    else:
        st.write("No challenging words identified yet.")

def settings_page():
    st.header("Settings")
    
    # Load current settings
    config = load_config()
    
    # Difficulty settings
    st.subheader("Practice Settings")
    difficulty = st.select_slider(
        "Difficulty Level",
        options=["A1 (Beginner)", "A2 (Elementary)", "B1 (Intermediate)", "B2 (Upper Intermediate)"],
        value=config.get("difficulty", "A1 (Beginner)")
    )
    
    # Feedback settings
    feedback_lang = st.radio(
        "Feedback Language",
        options=["English", "French"],
        index=0 if config.get("feedback_language") == "english" else 1
    )
    
    # OCR sensitivity
    ocr_sensitivity = st.slider(
        "OCR Sensitivity",
        min_value=1,
        max_value=10,
        value=config.get("ocr_sensitivity", 5),
        help="Higher values are more forgiving of handwriting variations"
    )
    
    # Save settings
    if st.button("Save Settings"):
        # Update config
        config["difficulty"] = difficulty
        config["feedback_language"] = "english" if feedback_lang == "English" else "french"
        config["ocr_sensitivity"] = ocr_sensitivity
        
        # Save to file
        with open('config/settings.yaml', 'w') as f:
            yaml.dump(config, f)
        
        st.success("Settings saved successfully!")

if __name__ == "__main__":
    main()
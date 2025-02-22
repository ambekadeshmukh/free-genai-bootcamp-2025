import sys
from pathlib import Path
import streamlit as st
from dotenv import load_dotenv
import os
import tempfile
from backend import BedrockChat, get_youtube_transcript
from backend.audio_generator import AudioGenerator
from backend.speech_to_text import SpeechToText
from backend.get_transcript import YouTubeTranscriptDownloader

# Configure Streamlit page
st.set_page_config(
    page_title="French Learning Assistant",
    page_icon="🇫🇷",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': None,
        'Report a bug': None,
        'About': None
    }
)

# Hide debug info and streamlit marks
st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        .stDeployButton {display:none;}
        .css-1dp5vir {display:none;}
        .css-18e3th9 {padding-top: 0;}
        div[data-testid="stToolbar"] {display: none;}
    </style>
""", unsafe_allow_html=True)

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

# Load environment variables
load_dotenv()

# Initialize BedrockChat
chat = BedrockChat()

# Initialize session state
if 'transcript' not in st.session_state:
    st.session_state.transcript = None
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'audio_paths' not in st.session_state:
    st.session_state.audio_paths = {}

# Initialize audio generator
audio_gen = AudioGenerator()

def initialize_components():
    """Initialize backend components"""
    if 'audio_gen' not in st.session_state:
        st.session_state.audio_gen = AudioGenerator()
    if 'stt' not in st.session_state:
        st.session_state.stt = SpeechToText()
    if 'bedrock_chat' not in st.session_state:
        st.session_state.bedrock_chat = BedrockChat()

def render_header():
    """Render the header section"""
    st.title("French Learning Assistant")
    st.markdown("""
    Transform YouTube transcripts into interactive French learning experiences.
    Practice listening, speaking, and comprehension with AI assistance.
    """)

def render_audio_practice():
    """Render the audio practice section"""
    st.header("Pronunciation Practice")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Text input for pronunciation
        french_text = st.text_area(
            "Enter French text to practice:",
            key='french_text',
            height=100
        )
        
        # Voice selection
        gender = st.radio(
            "Select voice:",
            options=['female', 'male'],
            key='voice_gender'
        )
        
        if st.button("Generate Audio"):
            generate_audio_button()
    
    with col2:
        # Play generated audio
        if 'practice' in st.session_state.audio_paths:
            st.subheader("Listen")
            st.audio(st.session_state.audio_paths['practice'])
            
            # Record user's pronunciation
            st.subheader("Your Turn")
            audio_bytes = st.audio_recorder(text="Record your pronunciation")
            
            if audio_bytes:
                # Save recording temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as f:
                    f.write(audio_bytes)
                    recording_path = f.name
                
                # Transcribe recording
                try:
                    transcription = st.session_state.stt.transcribe_audio(recording_path)
                    st.write("Your pronunciation:")
                    st.write(transcription['text'])
                    
                    # Clean up temporary file
                    os.unlink(recording_path)
                except Exception as e:
                    st.error(f"Error transcribing audio: {str(e)}")

def render_listening_exercise():
    """Render listening comprehension exercise"""
    st.header("Listening Comprehension")
    
    # Example dialogue
    dialogue = {
        "question": "Où est la bibliothèque?",
        "options": [
            "C'est à droite du café",
            "C'est à gauche de la banque",
            "C'est en face de l'hôtel",
            "C'est derrière le restaurant"
        ]
    }
    
    if st.button("Generate New Exercise"):
        with st.spinner("Generating audio..."):
            try:
                # Generate audio for question and options
                audio_files = st.session_state.audio_gen.generate_question_audio(
                    dialogue["question"],
                    dialogue["options"]
                )
                st.session_state.audio_paths['question'] = audio_files['question']
                st.session_state.audio_paths['options'] = audio_files['options']
                st.success("Exercise generated!")
            except Exception as e:
                st.error(f"Error generating exercise: {str(e)}")
    
    # Display exercise
    if 'question' in st.session_state.audio_paths:
        st.subheader("Listen to the Question")
        st.audio(st.session_state.audio_paths['question'])
        
        st.subheader("Choose the Correct Answer")
        for i, (option, audio_path) in enumerate(zip(
            dialogue["options"], 
            st.session_state.audio_paths['options']
        )):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.radio(
                    "Select answer:",
                    [option],
                    key=f"option_{i}"
                )
            with col2:
                st.audio(audio_path)

def render_transcript_practice():
    """Render YouTube transcript practice"""
    st.header("Learn from YouTube")
    
    url = st.text_input(
        "Enter French YouTube video URL:",
        placeholder="https://www.youtube.com/watch?v=..."
    )
    
    if url and st.button("Process Video"):
        with st.spinner("Processing transcript..."):
            try:
                # Download transcript
                downloader = YouTubeTranscriptDownloader()
                transcript = downloader.get_transcript(url)
                
                if transcript:
                    # Store transcript
                    st.session_state.transcript = transcript
                    
                    # Generate audio for sections
                    for i, entry in enumerate(transcript[:3]):  # First 3 sections
                        audio_path = st.session_state.audio_gen.generate_audio(
                            entry['text']
                        )
                        st.session_state.audio_paths[f'transcript_{i}'] = audio_path
                    
                    st.success("Video processed!")
                else:
                    st.error("No French transcript available for this video.")
            except Exception as e:
                st.error(f"Error processing video: {str(e)}")
    
    # Display transcript sections with audio
    if st.session_state.transcript:
        st.subheader("Practice with Video Sections")
        for i, entry in enumerate(st.session_state.transcript[:3]):
            with st.expander(f"Section {i+1}"):
                st.write(entry['text'])
                if f'transcript_{i}' in st.session_state.audio_paths:
                    st.audio(st.session_state.audio_paths[f'transcript_{i}'])

def generate_audio_button():
    text = st.session_state.get('french_text', '')
    gender = st.session_state.get('voice_gender', 'female')
    
    if text:
        try:
            audio_bytes = audio_gen.generate_audio(text, gender)
            st.audio(audio_bytes, format='audio/mp3')
        except Exception as e:
            st.error(f"Error generating audio: {str(e)}")
    else:
        st.warning("Please enter some French text first")

def main():
    # Initialize components
    initialize_components()
    
    # Render UI
    render_header()
    
    # Sidebar for navigation
    with st.sidebar:
        st.header("Practice Options")
        page = st.radio(
            "Select practice type:",
            ["Pronunciation Practice", 
             "Listening Comprehension",
             "Learn from YouTube"]
        )
    
    # Render selected page
    if page == "Pronunciation Practice":
        render_audio_practice()
    elif page == "Listening Comprehension":
        render_listening_exercise()
    else:
        render_transcript_practice()

if __name__ == "__main__":
    main()
import streamlit as st
import json
from pathlib import Path
from typing import Dict, List
import sys
from dotenv import load_dotenv
import pandas as pd

# Add src to Python path
sys.path.append(str(Path(__file__).parent / "src"))

from llm.groq_client import GroqClient
from utils.file_handlers import save_json, load_json
from utils.validators import validate_vocab_json

# Set page config first
st.set_page_config(
    page_title="Language Vocabulary Generator",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

def set_custom_style():
    st.markdown("""
        <style>
        .main {
            padding: 1rem;
        }
        .stButton>button {
            width: 100%;
            border-radius: 10px;
            background-color: #FF4B4B;
            color: white;
            padding: 0.5rem;
        }
        .stSelectbox, .stTextInput {
            margin-bottom: 1rem;
        }
        .stDataFrame {
            margin: 1rem 0;
            font-size: 1.1rem !important;
        }
        .dataframe td, .dataframe th {
            padding: 8px !important;
        }
        h1 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: #1E1E1E;
        }
        .stExpander {
            border-radius: 10px;
            border: 1px solid #eee;
        }
        div[data-testid="stVerticalBlock"] > div {
            padding-top: 0.5rem;
        }
        .main-title {
            text-align: center;
            padding: 1rem 0;
            margin-bottom: 2rem;
        }
        </style>
    """, unsafe_allow_html=True)

# Load environment variables
load_dotenv()

# Initialize Groq client
llm_client = GroqClient()

# Initialize session state
if 'mode' not in st.session_state:
    st.session_state.mode = 'Generate Vocabulary'

# Apply custom styling
set_custom_style()

# Add main title
st.markdown("<h1 class='main-title'>📚 Language Vocabulary Generator</h1>", unsafe_allow_html=True)

# Add sidebar
with st.sidebar:
    st.title("Select Mode")
    mode = st.radio(
        "Select Mode",
        options=["Generate Vocabulary", "Import/Export"],
        key="mode"
    )

def display_vocab_results(vocab_data: List[Dict], language: str = "French"):
    """Display vocabulary results in a formatted way"""
    if not vocab_data:
        st.error("No vocabulary data was generated. Please try again.")
        return
    
    st.markdown("""
        <div style='background-color: #f8f9fa; padding: 1rem; border-radius: 10px; margin: 1rem 0;'>
        <h3 style='margin:0; font-size: 1.3rem;'>📖 Generated Vocabulary</h3>
        </div>
    """, unsafe_allow_html=True)
    
    # Flatten the vocabulary data
    flattened_data = []
    for item in vocab_data:
        parts = item.get("parts", [{}])[0]
        flat_item = {
            language: item.get("french", ""),
            "English": item.get("english", ""),
            "Pronunciation": item.get("pronunciation", ""),
            "Type": parts.get("type", ""),
            "Gender": parts.get("gender", "")
        }
        flattened_data.append(flat_item)
    
    df = pd.DataFrame(flattened_data)
    
    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True,
        column_config={
            language: st.column_config.Column(
                width="medium",
                label=language,
                help="Word in target language"
            ),
            "English": st.column_config.Column(
                width="medium",
                help="English translation"
            ),
            "Pronunciation": st.column_config.Column(
                width="medium",
                help="IPA pronunciation"
            ),
            "Type": st.column_config.Column(
                width="small",
                help="Part of speech"
            ),
            "Gender": st.column_config.Column(
                width="small",
                help="Grammatical gender"
            )
        }
    )
    
    with st.expander("🔍 Show Raw JSON", expanded=False):
        st.json(vocab_data)

    st.download_button(
        label="📥 Download Vocabulary",
        data=json.dumps(vocab_data, indent=2),
        file_name=f"{language.lower()}_vocabulary.json",
        mime="application/json",
    )

# Main content based on mode
if st.session_state.mode == "Generate Vocabulary":
    col1, col2 = st.columns([2, 1])
    
    with col1:
        language = st.selectbox(
            "Select target language",
            ["French", "Spanish", "German", "Italian"],
            index=0
        )
        
        theme = st.text_input(
            "Enter thematic category",
            placeholder="e.g., food, travel, weather"
        )
        
        num_words = st.slider(
            "Number of words to generate",
            min_value=5,
            max_value=20,
            value=9,
            help="Slide to select the number of words"
        )
        
        if st.button("Generate Vocabulary 🎯", type="primary"):
            if theme:
                with st.spinner("✨ Generating vocabulary..."):
                    try:
                        vocab_data = llm_client.generate_vocabulary(theme=theme, num_words=num_words)
                        st.session_state.generated_vocab = vocab_data
                        display_vocab_results(vocab_data, language)
                    except Exception as e:
                        st.error(f"Error generating vocabulary: {str(e)}")
            else:
                st.warning("⚠️ Please enter a thematic category")

    with col2:
        st.markdown("""
            <div style='background-color: #f8f9fa; padding: 1.5rem; border-radius: 10px;'>
            <h3>💡 Tips</h3>
            </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
            * 🎯 Be specific with your theme
            * 📝 Consider adding context or specific requirements
            * 🔄 You can generate multiple sets and combine them
        """)

else:
    st.write("Import/Export functionality coming soon!")
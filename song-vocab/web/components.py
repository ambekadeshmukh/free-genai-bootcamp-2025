"""UI components for the Streamlit web application."""

import streamlit as st
from typing import Dict, Any, List, Optional
import pandas as pd

from agents.agent_manager import SongAnalysisResult
from agents.vocab_agent import VocabEntry, VocabularyList


def display_header():
    """Display the application header."""
    st.title("🎵 Song-Vocab: French Song Analysis")
    st.write("""
    Enter a French song title and artist to analyze. The application will:
    1. Find the original French lyrics
    2. Translate the lyrics to English
    3. Extract key vocabulary with definitions and examples
    """)
    st.divider()


def display_search_form() -> Dict[str, Any]:
    """Display the song search form.
    
    Returns:
        Dictionary with form inputs
    """
    with st.form("song_search_form"):
        col1, col2 = st.columns([2, 1])
        
        with col1:
            song_title = st.text_input("Song Title", placeholder="La Vie En Rose")
        
        with col2:
            artist_name = st.text_input("Artist (Optional)", placeholder="Édith Piaf")
        
        submit_button = st.form_submit_button("Analyze Song")
        
        return {
            "song_title": song_title,
            "artist_name": artist_name,
            "submitted": submit_button
        }


def display_lyrics_section(song_info, translation):
    """Display the lyrics section with original and translated lyrics.
    
    Args:
        song_info: SongInfo object with song details
        translation: TranslatedLyrics object with translations
    """
    st.header(f"📝 Lyrics: {song_info.song_title}")
    if song_info.artist_name:
        st.subheader(f"Artist: {song_info.artist_name}")
    
    if song_info.url:
        st.write(f"Source: [{song_info.url}]({song_info.url})")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🇫🇷 Original (French)")
        st.text_area("", song_info.lyrics, height=400, disabled=True)
    
    with col2:
        st.subheader("🇺🇸 Translation (English)")
        st.text_area("", translation.translation, height=400, disabled=True)


def display_vocabulary_section(vocabulary: VocabularyList):
    """Display the vocabulary section with extracted vocabulary items.
    
    Args:
        vocabulary: VocabularyList object with vocabulary entries
    """
    st.header("📚 Vocabulary")
    
    if not vocabulary.entries:
        st.warning("No vocabulary entries were extracted.")
        return
    
    # Create a dataframe for better display
    vocab_data = []
    for entry in vocabulary.entries:
        vocab_data.append({
            "Word": f"**{entry.word}** ({entry.part_of_speech})",
            "Definition": entry.definition,
            "Example": f"{entry.example}\n\n*{entry.translation}*"
        })
    
    df = pd.DataFrame(vocab_data)
    
    # Display as an expander for each word
    for i, entry in enumerate(vocabulary.entries):
        with st.expander(f"{entry.word} ({entry.part_of_speech})"):
            st.markdown(f"**Definition:** {entry.definition}")
            st.markdown(f"**Example:** {entry.example}")
            st.markdown(f"**Translation:** *{entry.translation}*")
    
    # Also provide a download option
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button(
        "Download Vocabulary as CSV",
        csv,
        "vocabulary.csv",
        "text/csv",
        key='download-csv'
    )


def display_loading_state():
    """Display a loading spinner and message."""
    with st.spinner("Processing your request..."):
        st.text("🔍 Searching for lyrics...")
        progress_bar = st.progress(0)
        
        # Return the progress bar so it can be updated
        return progress_bar


def display_results(result: SongAnalysisResult):
    """Display all results from the song analysis.
    
    Args:
        result: SongAnalysisResult object with all analysis data
    """
    # Display lyrics section
    display_lyrics_section(result.song_info, result.translation)
    
    # Add a divider
    st.divider()
    
    # Display vocabulary section
    display_vocabulary_section(result.vocabulary)
    
    # Add a divider
    st.divider()
    
    # Add a section for feedback/information
    with st.expander("About this analysis"):
        st.write("""
        This analysis was performed using AI agents that work together to:
        1. Find and retrieve song lyrics
        2. Translate the lyrics from French to English
        3. Extract key vocabulary items with definitions and examples
        
        The analysis is powered by large language models and may occasionally contain errors.
        If you notice any issues, please try another song or check the spelling of the song title and artist.
        """)
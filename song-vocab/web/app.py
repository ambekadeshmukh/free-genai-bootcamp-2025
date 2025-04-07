"""Streamlit web application for the song-vocab project."""

import streamlit as st
import time
import sys
import os

# Add the project root to the path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.agent_manager import AgentManager
from web.components import (
    display_header,
    display_search_form,
    display_results,
    display_loading_state
)
from utils.config import Config


def main():
    """Main entry point for the Streamlit application."""
    # Set page config
    st.set_page_config(
        page_title="Song-Vocab: French Song Analysis",
        page_icon="🎵",
        layout="wide"
    )
    
    # Display the header
    display_header()
    
    # Initialize the agent manager in the session state if not present
    if 'agent_manager' not in st.session_state:
        try:
            # Validate configuration
            Config.validate()
            st.session_state.agent_manager = AgentManager()
        except ValueError as e:
            st.error(f"Configuration Error: {str(e)}")
            st.info("Please set up your .env file with the required API keys.")
            return
    
    # Display the search form
    form_data = display_search_form()
    
    # Process the form submission
    if form_data["submitted"] and form_data["song_title"]:
        # Store the form data in session state
        st.session_state.song_title = form_data["song_title"]
        st.session_state.artist_name = form_data["artist_name"]
        
        # Create a loading state
        progress_bar = display_loading_state()
        
        try:
            # Process the song
            result = st.session_state.agent_manager.process_song(
                song_title=st.session_state.song_title,
                artist_name=st.session_state.artist_name
            )
            
            # Update progress
            progress_bar.progress(100)
            
            # Store the result in session state
            st.session_state.result = result
            
            # Force a rerun to display the results
            st.rerun()
        
        except Exception as e:
            st.error(f"An error occurred: {str(e)}")
    
    # Display results if available
    if 'result' in st.session_state:
        display_results(st.session_state.result)


if __name__ == "__main__":
    main()
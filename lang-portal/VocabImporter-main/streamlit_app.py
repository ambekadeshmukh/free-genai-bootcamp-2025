import streamlit as st
import json
from pathlib import Path
from typing import Dict, List

from llm.groq_client import GroqClient
from utils.file_handlers import save_json, load_json
from utils.validators import validate_vocab_json

def main():
    st.set_page_config(
        page_title="Language Vocabulary Generator",
        page_icon="📚",
        layout="wide"
    )

    st.title("Language Vocabulary Generator")
    
    # Initialize LLM client
    llm_client = GroqClient()
    
    # Sidebar for mode selection
    mode = st.sidebar.radio(
        "Select Mode",
        ["Generate Vocabulary", "Import/Export"]
    )
    
    if mode == "Generate Vocabulary":
        generate_vocab_ui(llm_client)
    else:
        import_export_ui()

def generate_vocab_ui(llm_client: GroqClient):
    """UI for vocabulary generation"""
    col1, col2 = st.columns([2, 1])
    
    with col1:
        theme = st.text_input(
            "Enter thematic category",
            placeholder="e.g., food, travel, weather"
        )
        num_words = st.slider("Number of words to generate", 5, 20, 10)
        
        if st.button("Generate Vocabulary", type="primary"):
            if theme:
                with st.spinner("Generating vocabulary..."):
                    try:
                        vocab_data = llm_client.generate_vocabulary(theme, num_words)
                        st.session_state.generated_vocab = vocab_data
                        display_vocab_results(vocab_data)
                    except Exception as e:
                        st.error(f"Error generating vocabulary: {str(e)}")
            else:
                st.warning("Please enter a thematic category")
    
    with col2:
        st.markdown("### Tips")
        st.markdown("""
        - Be specific with your theme
        - Consider adding context or specific requirements
        - You can generate multiple sets and combine them
        """)

def import_export_ui():
    """UI for importing and exporting vocabulary"""
    st.header("Import/Export Vocabulary")
    
    # Export section
    if "generated_vocab" in st.session_state:
        st.subheader("Export Generated Vocabulary")
        if st.button("Download JSON"):
            json_str = json.dumps(st.session_state.generated_vocab, indent=2)
            st.download_button(
                label="📥 Download Vocabulary JSON",
                data=json_str,
                file_name="vocabulary.json",
                mime="application/json"
            )
    
    # Import section
    st.subheader("Import Vocabulary")
    uploaded_file = st.file_uploader("Upload Vocabulary JSON", type=['json'])
    
    if uploaded_file:
        try:
            vocab_data = json.load(uploaded_file)
            if validate_vocab_json(vocab_data):
                st.success("Vocabulary file successfully validated")
                display_vocab_results(vocab_data)
                st.session_state.generated_vocab = vocab_data
            else:
                st.error("Invalid vocabulary format")
        except json.JSONDecodeError:
            st.error("Invalid JSON file")
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

def display_vocab_results(vocab_data: List[Dict]):
    """Display vocabulary results in a formatted way"""
    st.subheader("Generated Vocabulary")
    
    # Convert to DataFrame for better display
    import pandas as pd
    
    # Flatten the vocabulary data
    flattened_data = []
    for item in vocab_data:
        flat_item = {
            "French": item["french"],
            "Pronunciation": item["pronunciation"],
            "English": item["english"],
            "Type": item["parts"][0].get("type", ""),
            "Gender": item["parts"][0].get("gender", ""),
            "Conjugation": item["parts"][0].get("conjugation", "")
        }
        flattened_data.append(flat_item)
    
    df = pd.DataFrame(flattened_data)
    st.dataframe(df, use_container_width=True)
    
    # Show raw JSON with copy button
    st.subheader("Raw JSON")
    st.json(vocab_data)

if __name__ == "__main__":
    main()
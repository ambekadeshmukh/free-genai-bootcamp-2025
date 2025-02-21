import streamlit as st
from typing import Dict
import json
from collections import Counter
import re
import plotly.graph_objects as go
import pandas as pd

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.chat import BedrockChat

# Page config
st.set_page_config(
    page_title="French Learning Assistant",
    page_icon="🇫🇷",
    layout="wide"
)

# Initialize session state
if 'transcript' not in st.session_state:
    st.session_state.transcript = None
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'rag_visualization' not in st.session_state:
    st.session_state.rag_visualization = None

def render_header():
    """Render the header section"""
    st.title("🇫🇷 French Learning Assistant")
    st.markdown("""
    Transform YouTube transcripts into interactive French learning experiences.
    
    This tool demonstrates:
    - Base LLM Capabilities with Amazon Nova
    - RAG (Retrieval Augmented Generation)
    - Amazon Bedrock Integration
    - Interactive Learning System
    """)

def render_sidebar():
    """Render the sidebar with component selection"""
    with st.sidebar:
        st.header("Development Stages")
        
        selected_stage = st.radio(
            "Select Stage:",
            [
                "1. Chat with Nova",
                "2. Raw Transcript",
                "3. Structured Data",
                "4. RAG Implementation",
                "5. Interactive Learning"
            ]
        )
        
        stage_info = {
            "1. Chat with Nova": """
            **Current Focus:**
            - Basic French learning
            - Understanding LLM capabilities
            - Natural language interactions
            """,
            
            "2. Raw Transcript": """
            **Current Focus:**
            - YouTube transcript processing
            - French text analysis
            - Accent and character handling
            """,
            
            "3. Structured Data": """
            **Current Focus:**
            - French dialogue extraction
            - Grammar pattern recognition
            - Vocabulary categorization
            """,
            
            "4. RAG Implementation": """
            **Current Focus:**
            - Contextual learning
            - French language vectors
            - Semantic search
            """,
            
            "5. Interactive Learning": """
            **Current Focus:**
            - Pronunciation practice
            - Grammar exercises
            - Vocabulary quizzes
            """
        }
        
        st.markdown("---")
        st.markdown(stage_info[selected_stage])
        
        return selected_stage

def count_french_patterns(text):
    """Count French language patterns in text"""
    if not text:
        return 0, 0
    
    french_patterns = {
        'accents': r'[àáâãäçèéêëìíîïñòóôõöùúûüýÿ]',
        'articles': r'\b(le|la|les|un|une|des)\b',
        'conjunctions': r'\b(et|ou|mais|donc|car|ni|or)\b'
    }
    
    counts = {k: len(re.findall(pattern, text, re.IGNORECASE)) 
             for k, pattern in french_patterns.items()}
    return counts

def render_chat_stage():
    """Render an improved chat interface"""
    st.header("Chat with Nova")

    if 'bedrock_chat' not in st.session_state:
        st.session_state.bedrock_chat = BedrockChat()

    st.markdown("""
    Explore Nova's French language capabilities. Ask questions about French grammar, 
    vocabulary, or cultural aspects.
    """)

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"], avatar="🧑‍💻" if message["role"] == "user" else "🤖"):
            st.markdown(message["content"])

    # Chat input
    if prompt := st.chat_input("Ask about French language..."):
        process_message(prompt)

    # Example questions
    with st.sidebar:
        st.markdown("### Try These Examples")
        example_questions = [
            "Comment dit-on 'Where is the train station?' en français?",
            "Expliquez la différence entre 'tu' et 'vous'",
            "Conjuguez le verbe 'être' au présent",
            "Comment former le passé composé?",
            "Quelle est la différence entre 'bon' et 'bien'?",
            "Comment demander son chemin poliment?"
        ]
        
        for q in example_questions:
            if st.button(q, use_container_width=True, type="secondary"):
                process_message(q)
                st.rerun()

    # Clear chat button
    if st.session_state.messages:
        if st.button("Clear Chat", type="primary"):
            st.session_state.messages = []
            st.rerun()

def visualize_rag_process(query, contexts, response):
    """Create visualization of RAG process"""
    fig = go.Figure()

    # Add nodes
    fig.add_trace(go.Scatter(
        x=[0], y=[0],
        mode='markers+text',
        name='Query',
        text=['Query'],
        marker=dict(size=20, color='blue')
    ))

    # Add context nodes
    x_contexts = [-1, 0, 1]
    for i, context in enumerate(contexts[:3]):
        fig.add_trace(go.Scatter(
            x=[x_contexts[i]], y=[-1],
            mode='markers+text',
            name=f'Context {i+1}',
            text=[f'Context {i+1}'],
            marker=dict(size=15, color='green')
        ))

    # Add response node
    fig.add_trace(go.Scatter(
        x=[0], y=[-2],
        mode='markers+text',
        name='Response',
        text=['Response'],
        marker=dict(size=20, color='red')
    ))

    # Update layout
    fig.update_layout(
        title="RAG Process Visualization",
        showlegend=False,
        height=400
    )

    return fig

def render_rag_stage():
    """Render the RAG implementation stage with visualization"""
    st.header("RAG System")
    
    query = st.text_input(
        "Test Query",
        placeholder="Enter a question about French..."
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Retrieved Context")
        if query:
            # Simulate context retrieval
            contexts = ["Context 1", "Context 2", "Context 3"]
            st.write(contexts)
            
            # Visualize RAG process
            fig = visualize_rag_process(query, contexts, "Generated response")
            st.plotly_chart(fig)
        else:
            st.info("Enter a query to see retrieved contexts")
        
    with col2:
        st.subheader("Generated Response")
        if query:
            # Generate response using RAG
            st.write("Generated response will appear here")
        else:
            st.info("Enter a query to generate a response")

def render_interactive_stage():
    """Render enhanced interactive learning stage"""
    st.header("Interactive Learning")
    
    practice_type = st.selectbox(
        "Select Practice Type",
        ["Pronunciation", "Grammar Quiz", "Vocabulary Practice", "Listening Exercise"]
    )
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Practice Scenario")
        
        if practice_type == "Pronunciation":
            st.text_area("Repeat after me:", value="Bonjour, comment allez-vous?")
            st.button("Record")
            
        elif practice_type == "Grammar Quiz":
            question = "Complétez la phrase: Je ___ étudiant."
            options = ["suis", "es", "est", "sont"]
            selected = st.radio("Choose:", options)
            
        elif practice_type == "Vocabulary Practice":
            st.image("https://via.placeholder.com/300x200", caption="What's this?")
            options = ["une pomme", "une orange", "une banane", "une poire"]
            selected = st.radio("Choose:", options)
            
        elif practice_type == "Listening Exercise":
            st.audio("sample.mp3")
            st.text_input("What did you hear?")
    
    with col2:
        st.subheader("Progress")
        # Add progress visualization
        progress_data = {
            'Pronunciation': 75,
            'Grammar': 60,
            'Vocabulary': 85,
            'Listening': 70
        }
        
        fig = go.Figure(go.Bar(
            x=list(progress_data.values()),
            y=list(progress_data.keys()),
            orientation='h'
        ))
        
        fig.update_layout(title="Your Progress")
        st.plotly_chart(fig)

def main():
    render_header()
    selected_stage = render_sidebar()
    
    if selected_stage == "1. Chat with Nova":
        render_chat_stage()
    elif selected_stage == "2. Raw Transcript":
        render_transcript_stage()
    elif selected_stage == "3. Structured Data":
        render_structured_stage()
    elif selected_stage == "4. RAG Implementation":
        render_rag_stage()
    elif selected_stage == "5. Interactive Learning":
        render_interactive_stage()
    
    with st.expander("Debug Information"):
        st.json({
            "selected_stage": selected_stage,
            "transcript_loaded": st.session_state.transcript is not None,
            "chat_messages": len(st.session_state.messages),
            "rag_visualization": st.session_state.rag_visualization is not None
        })

if __name__ == "__main__":
    main()
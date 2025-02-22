import streamlit as st
import boto3
import pandas as pd
import sqlite3
from youtube_transcript_api import YouTubeTranscriptApi
import json
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings

class FrenchLearningAssistant:
    def __init__(self):
        """Initialize the French Learning Assistant with AWS services and database connections"""
        # Initialize AWS Bedrock client
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-east-1'
        )
        
        # Initialize SQLite connection
        self.db_path = "french_learning.db"
        self.setup_database()
        
        # Initialize ChromaDB for vector storage
        self.chroma_client = chromadb.Client(Settings(
            persist_directory="chroma_db"
        ))
        self.collection = self.chroma_client.create_collection(name="french_content")

    def setup_database(self):
        """Initialize SQLite database with tables for content and embeddings"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Create tables for storing bilingual content and embeddings
        c.execute('''
            CREATE TABLE IF NOT EXISTS content (
                id INTEGER PRIMARY KEY,
                source_id TEXT,
                french_text TEXT,
                english_text TEXT,
                content_type TEXT,
                difficulty_level TEXT,
                metadata TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS embeddings (
                id INTEGER PRIMARY KEY,
                content_id INTEGER,
                embedding BLOB,
                FOREIGN KEY (content_id) REFERENCES content(id)
            )
        ''')
        
        conn.commit()
        conn.close()

    def process_youtube_transcript(self, video_id: str) -> Dict[str, Any]:
        """Fetch and process YouTube transcript for French content"""
        try:
            transcript = YouTubeTranscriptApi.get_transcript(
                video_id, 
                languages=['fr']
            )
            
            # Process transcript for both raw and structured storage
            processed_content = {
                'raw_transcript': transcript,
                'structured_content': self._structure_transcript(transcript)
            }
            
            return processed_content
        except Exception as e:
            st.error(f"Error processing transcript: {str(e)}")
            return None

    def _structure_transcript(self, transcript: List[Dict]) -> List[Dict]:
        """Structure raw transcript into learning segments"""
        structured_content = []
        current_segment = {"text": "", "start": 0, "duration": 0}
        
        for entry in transcript:
            # Group transcript entries into meaningful segments
            if len(current_segment["text"]) < 200:
                current_segment["text"] += f" {entry['text']}"
                current_segment["duration"] += entry['duration']
            else:
                structured_content.append(current_segment)
                current_segment = {
                    "text": entry['text'],
                    "start": entry['start'],
                    "duration": entry['duration']
                }
        
        return structured_content

    def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings using AWS Bedrock Titan"""
        try:
            response = self.bedrock.invoke_model(
                modelId='amazon.titan-embed-text-v1',
                body=json.dumps({
                    'inputText': text
                })
            )
            return json.loads(response['body'].read())['embedding']
        except Exception as e:
            st.error(f"Error generating embeddings: {str(e)}")
            return None

    def store_content(self, content: Dict[str, Any]):
        """Store content and its embeddings in databases"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Store main content
            c.execute('''
                INSERT INTO content 
                (source_id, french_text, english_text, content_type, difficulty_level, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                content['source_id'],
                content['french_text'],
                content['english_text'],
                content['content_type'],
                content['difficulty_level'],
                json.dumps(content['metadata'])
            ))
            
            content_id = c.lastrowid
            
            # Generate and store embeddings
            embedding = self.generate_embeddings(content['french_text'])
            if embedding:
                c.execute('''
                    INSERT INTO embeddings (content_id, embedding)
                    VALUES (?, ?)
                ''', (content_id, json.dumps(embedding)))
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            st.error(f"Error storing content: {str(e)}")
        finally:
            conn.close()

    def generate_questions(self, content: str) -> List[Dict]:
        """Generate questions using AWS Bedrock Claude"""
        try:
            prompt = f"""
            Given the following French text, generate 3 multiple-choice questions 
            that test comprehension and grammar understanding. Include English translations.
            
            Text: {content}
            
            Format each question as:
            Q: [French Question]
            EN: [English Translation]
            A) [Option 1]
            B) [Option 2]
            C) [Option 3]
            D) [Option 4]
            Correct: [Letter]
            Explanation: [Why this is correct]
            """
            
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-v2',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 1000,
                    "temperature": 0.7
                })
            )
            
            return self._parse_questions(response['body'].read())
        except Exception as e:
            st.error(f"Error generating questions: {str(e)}")
            return None

    def _parse_questions(self, raw_response: str) -> List[Dict]:
        """Parse raw question generation response into structured format"""
        # Implementation for parsing the response into structured questions
        # This would handle the specific format returned by Claude
        pass

class BedrockChat:
    def __init__(self):
        self.client = boto3.client('bedrock-runtime')
        self.model_id = "anthropic.claude-v2"  # or your preferred model

    def generate_response(self, prompt: str) -> str:
        try:
            body = json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 2000,
                "temperature": 0.7,
                "top_p": 1,
            })

            response = self.client.invoke_model(
                modelId=self.model_id,
                body=body
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['completion']
            
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return ""

    def analyze_transcript(self, transcript: str) -> Dict:
        """Analyze transcript and generate questions"""
        prompt = f"""Analyze this transcript and generate:
        1. 3 comprehension questions
        2. Key vocabulary words
        3. Main topics discussed

        Transcript:
        {transcript}
        """
        
        response = self.generate_response(prompt)
        return response

def main():
    st.title("French Language Learning Assistant")
    st.subheader("Progressive Learning with RAG")
    
    # Initialize the assistant
    assistant = FrenchLearningAssistant()
    
    # Sidebar for mode selection
    mode = st.sidebar.selectbox(
        "Select Learning Mode",
        ["Base LLM", "Raw Transcript", "Structured Content", "RAG Implementation", "Interactive Practice"]
    )
    
    # YouTube URL input
    youtube_url = st.text_input("Enter French Learning Video URL:")
    
    if youtube_url:
        video_id = youtube_url.split("v=")[1] if "v=" in youtube_url else youtube_url.split("/")[-1]
        
        if mode == "Base LLM":
            st.info("Using base LLM without context")
            # Implement base LLM interaction
            
        elif mode == "Raw Transcript":
            transcript = assistant.process_youtube_transcript(video_id)
            if transcript:
                st.write("Raw Transcript:")
                st.json(transcript['raw_transcript'])
                
        elif mode == "Structured Content":
            transcript = assistant.process_youtube_transcript(video_id)
            if transcript:
                st.write("Structured Content:")
                st.json(transcript['structured_content'])
                
        elif mode == "RAG Implementation":
            st.info("RAG-enhanced responses")
            # Implement RAG-based interaction
            
        elif mode == "Interactive Practice":
            st.info("Interactive learning exercises")
            # Implement interactive exercises

if __name__ == "__main__":
    main()
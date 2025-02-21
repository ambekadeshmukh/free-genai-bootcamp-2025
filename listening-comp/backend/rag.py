import boto3
import json
import sqlite3
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings

class RAGSystem:
    def __init__(self, db_path: str = "french_learning.db"):
        """Initialize the RAG system"""
        self.db_path = db_path
        
        # Initialize AWS Bedrock client
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-east-1'
        )
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.Client(Settings(
            persist_directory="chroma_db"
        ))
        self.collection = self.chroma_client.create_collection(name="french_content")
        
        # Initialize database
        self.setup_database()

    def setup_database(self):
        """Set up SQLite database for storing content and embeddings"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Create necessary tables
        c.execute('''
            CREATE TABLE IF NOT EXISTS content (
                id INTEGER PRIMARY KEY,
                text TEXT,
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

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embeddings using AWS Bedrock"""
        try:
            response = self.bedrock.invoke_model(
                modelId='amazon.titan-embed-text-v1',
                body=json.dumps({
                    'inputText': text
                })
            )
            return json.loads(response['body'].read())['embedding']
        except Exception as e:
            raise Exception(f"Error generating embedding: {str(e)}")

    def store_content(self, text: str, metadata: Dict = None):
        """Store content and its embedding"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Store content
            c.execute(
                "INSERT INTO content (text, metadata) VALUES (?, ?)",
                (text, json.dumps(metadata or {}))
            )
            content_id = c.lastrowid
            
            # Generate and store embedding
            embedding = self.generate_embedding(text)
            c.execute(
                "INSERT INTO embeddings (content_id, embedding) VALUES (?, ?)",
                (content_id, json.dumps(embedding))
            )
            
            # Add to ChromaDB for efficient search
            self.collection.add(
                documents=[text],
                metadatas=[metadata or {}],
                ids=[str(content_id)]
            )
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error storing content: {str(e)}")
            
        finally:
            conn.close()

    def search(self, query: str, k: int = 3) -> List[Dict]:
        """Search for relevant content using embeddings"""
        try:
            query_embedding = self.generate_embedding(query)
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k
            )
            
            return [
                {
                    'text': doc,
                    'metadata': meta
                }
                for doc, meta in zip(results['documents'][0], results['metadatas'][0])
            ]
            
        except Exception as e:
            raise Exception(f"Error searching content: {str(e)}")

    def generate_response(self, query: str, contexts: List[Dict]) -> str:
        """Generate response using retrieved contexts"""
        try:
            # Prepare prompt with contexts
            context_text = "\n".join([c['text'] for c in contexts])
            
            prompt = f"""
            Given the following French learning contexts:
            {context_text}
            
            Answer the following question:
            {query}
            
            Ensure the response is helpful for French language learners and includes relevant examples.
            """
            
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-v2',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 1000,
                    "temperature": 0.7
                })
            )
            
            return json.loads(response['body'].read())['completion']
            
        except Exception as e:
            raise Exception(f"Error generating response: {str(e)}")

    def process_query(self, query: str) -> Dict[str, Any]:
        """Process a query through the complete RAG pipeline"""
        try:
            # Search for relevant contexts
            contexts = self.search(query)
            
            # Generate response
            response = self.generate_response(query, contexts)
            
            return {
                'query': query,
                'contexts': contexts,
                'response': response
            }
            
        except Exception as e:
            raise Exception(f"Error processing query: {str(e)}")
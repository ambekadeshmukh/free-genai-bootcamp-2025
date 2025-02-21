import sqlite3
import json
import boto3
from typing import List, Dict, Any, Optional
import numpy as np
from pathlib import Path

class VectorStore:
    def __init__(self, db_path: str = "french_vectors.db"):
        """Initialize vector store"""
        self.db_path = db_path
        self.bedrock = boto3.client('bedrock-runtime')
        self.setup_database()

    def setup_database(self):
        """Set up SQLite database for vector storage"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Create tables
        c.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY,
                content TEXT NOT NULL,
                metadata TEXT,
                category TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS embeddings (
                id INTEGER PRIMARY KEY,
                document_id INTEGER,
                embedding BLOB NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )
        ''')
        
        # Create indices
        c.execute('CREATE INDEX IF NOT EXISTS idx_category ON documents(category)')
        
        conn.commit()
        conn.close()

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using AWS Bedrock"""
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

    def add_document(self, content: str, metadata: Dict = None, category: str = None):
        """Add document to vector store"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Insert document
            c.execute(
                'INSERT INTO documents (content, metadata, category) VALUES (?, ?, ?)',
                (content, json.dumps(metadata or {}), category)
            )
            document_id = c.lastrowid
            
            # Generate and store embedding
            embedding = self.generate_embedding(content)
            embedding_bytes = np.array(embedding).tobytes()
            
            c.execute(
                'INSERT INTO embeddings (document_id, embedding) VALUES (?, ?)',
                (document_id, embedding_bytes)
            )
            
            conn.commit()
            return document_id
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error adding document: {str(e)}")
            
        finally:
            conn.close()

    def search(self, query: str, limit: int = 5, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        query_embedding = np.array(self.generate_embedding(query))
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Get all documents and embeddings
            if category:
                c.execute('''
                    SELECT d.id, d.content, d.metadata, d.category, e.embedding
                    FROM documents d
                    JOIN embeddings e ON d.id = e.document_id
                    WHERE d.category = ?
                ''', (category,))
            else:
                c.execute('''
                    SELECT d.id, d.content, d.metadata, d.category, e.embedding
                    FROM documents d
                    JOIN embeddings e ON d.id = e.document_id
                ''')
            
            results = []
            for row in c.fetchall():
                doc_id, content, metadata, cat, embedding_bytes = row
                doc_embedding = np.frombuffer(embedding_bytes)
                
                # Calculate cosine similarity
                similarity = np.dot(query_embedding, doc_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
                )
                
                results.append({
                    'id': doc_id,
                    'content': content,
                    'metadata': json.loads(metadata),
                    'category': cat,
                    'similarity': float(similarity)
                })
            
            # Sort by similarity and return top results
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:limit]
            
        finally:
            conn.close()

    def get_document(self, doc_id: int) -> Optional[Dict[str, Any]]:
        """Retrieve document by ID"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            c.execute(
                'SELECT content, metadata, category FROM documents WHERE id = ?',
                (doc_id,)
            )
            row = c.fetchone()
            
            if row:
                content, metadata, category = row
                return {
                    'id': doc_id,
                    'content': content,
                    'metadata': json.loads(metadata),
                    'category': category
                }
            return None
            
        finally:
            conn.close()

    def update_document(self, doc_id: int, content: str = None, metadata: Dict = None, category: str = None):
        """Update existing document"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Get current document
            c.execute('SELECT content, metadata, category FROM documents WHERE id = ?', (doc_id,))
            current = c.fetchone()
            
            if not current:
                raise ValueError(f"Document {doc_id} not found")
                
            current_content, current_metadata, current_category = current
            
            # Update values
            new_content = content if content is not None else current_content
            new_metadata = json.dumps(metadata) if metadata is not None else current_metadata
            new_category = category if category is not None else current_category
            
            # Update document
            c.execute('''
                UPDATE documents 
                SET content = ?, metadata = ?, category = ?
                WHERE id = ?
            ''', (new_content, new_metadata, new_category, doc_id))
            
            # If content changed, update embedding
            if content is not None:
                embedding = self.generate_embedding(new_content)
                embedding_bytes = np.array(embedding).tobytes()
                
                c.execute('''
                    UPDATE embeddings
                    SET embedding = ?
                    WHERE document_id = ?
                ''', (embedding_bytes, doc_id))
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error updating document: {str(e)}")
            
        finally:
            conn.close()

    def delete_document(self, doc_id: int):
        """Delete document and its embedding"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Delete embedding first (foreign key constraint)
            c.execute('DELETE FROM embeddings WHERE document_id = ?', (doc_id,))
            c.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error deleting document: {str(e)}")
            
        finally:
            conn.close()

    def clear_category(self, category: str):
        """Delete all documents in a category"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Get document IDs in category
            c.execute('SELECT id FROM documents WHERE category = ?', (category,))
            doc_ids = [row[0] for row in c.fetchall()]
            
            # Delete embeddings and documents
            c.execute('DELETE FROM embeddings WHERE document_id IN (%s)' % ','.join('?' * len(doc_ids)), doc_ids)
            c.execute('DELETE FROM documents WHERE category = ?', (category,))
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise Exception(f"Error clearing category: {str(e)}")
            
        finally:
            conn.close()
"""Agent for extracting vocabulary from French lyrics."""

from typing import List, Dict, Any
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from utils.config import Config
from agents.lyrics_agent import SongInfo


class VocabEntry(BaseModel):
    """Model for a vocabulary entry."""
    
    word: str = Field(..., description="The French word or phrase")
    part_of_speech: str = Field(..., description="The part of speech (noun, verb, adjective, etc.)")
    definition: str = Field(..., description="The English definition")
    example: str = Field(..., description="An example sentence using the word")
    translation: str = Field(..., description="Translation of the example sentence")


class VocabularyList(BaseModel):
    """Model for a list of vocabulary entries."""
    
    entries: List[VocabEntry] = Field(..., description="List of vocabulary entries")


class VocabAgent:
    """Agent for extracting vocabulary from French lyrics."""
    
    def __init__(self):
        """Initialize the vocabulary agent."""
        # Create the vocabulary extraction prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "You are a French language educator specializing in teaching through music. "
             "Your task is to extract key vocabulary items from French song lyrics, "
             "focusing on words and phrases that would be valuable for a French language learner. "
             "For each vocabulary item, provide:\n"
             "1. The word or phrase in French\n"
             "2. Its part of speech\n"
             "3. Its English definition\n"
             "4. An example sentence using the word (different from the lyrics)\n"
             "5. The English translation of the example sentence\n\n"
             "Format your response as a JSON list of objects with the fields 'word', 'part_of_speech', "
             "'definition', 'example', and 'translation'. Select 10-15 vocabulary items that "
             "represent a mix of difficulty levels, prioritizing words that appear frequently "
             "or are central to the song's meaning."),
            ("user", 
             "Extract key vocabulary from these French lyrics:\n\n{lyrics}")
        ])
        
        # Initialize the LLM
        llm = ChatOpenAI(
            api_key=Config.OPENAI_API_KEY,
            model=Config.LLM_MODEL,
            temperature=Config.TEMPERATURE,
            response_format={"type": "json_object"}
        )
        
        # Create the chain
        self.chain = LLMChain(llm=llm, prompt=prompt)
    
    def extract_vocabulary(self, song_info: SongInfo) -> VocabularyList:
        """Extract vocabulary from French lyrics.
        
        Args:
            song_info: SongInfo object containing the lyrics
            
        Returns:
            VocabularyList object with extracted vocabulary entries
        """
        # Check if the input is empty or indicates lyrics were not found
        if not song_info.lyrics or "not found" in song_info.lyrics.lower():
            return VocabularyList(entries=[])
        
        # Call the chain to extract vocabulary
        result = self.chain.invoke({"lyrics": song_info.lyrics})
        
        # Parse the JSON response
        result_text = result.get("text", "{}")
        try:
            import json
            data = json.loads(result_text)
            
            # Standardize the response format
            if "entries" in data:
                vocab_entries = data["entries"]
            elif isinstance(data, list):
                vocab_entries = data
            else:
                vocab_entries = [data]
            
            # Create VocabEntry objects
            entries = []
            for entry in vocab_entries:
                entries.append(VocabEntry(
                    word=entry.get("word", ""),
                    part_of_speech=entry.get("part_of_speech", ""),
                    definition=entry.get("definition", ""),
                    example=entry.get("example", ""),
                    translation=entry.get("translation", "")
                ))
            
            return VocabularyList(entries=entries)
        
        except Exception as e:
            # Fallback for parsing errors
            return VocabularyList(entries=[
                VocabEntry(
                    word="Error parsing vocabulary",
                    part_of_speech="error",
                    definition=f"Error: {str(e)}",
                    example="Please try again with a different song.",
                    translation="Please try again with a different song."
                )
            ])
"""Agent module initialization."""

from agents.agent_manager import AgentManager
from agents.lyrics_agent import LyricsAgent
from agents.translation_agent import TranslationAgent
from agents.vocab_agent import VocabAgent

__all__ = [
    'AgentManager',
    'LyricsAgent',
    'TranslationAgent',
    'VocabAgent',
]
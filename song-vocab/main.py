"""Main entry point for the song-vocab application."""

import argparse
import sys

from agents.agent_manager import AgentManager
from utils.config import Config


def process_song(song_title, artist_name=None):
    """Process a song and print the results.
    
    Args:
        song_title: Title of the song to analyze
        artist_name: Optional artist name
    """
    # Validate configuration
    Config.validate()
    
    # Initialize the agent manager
    agent_manager = AgentManager()
    
    # Process the song
    result = agent_manager.process_song(song_title, artist_name)
    
    # Print the results
    print("\n" + "=" * 50)
    print(f"SONG: {result.song_info.song_title}")
    if result.song_info.artist_name:
        print(f"ARTIST: {result.song_info.artist_name}")
    print("=" * 50)
    
    print("\nORIGINAL LYRICS (FRENCH):")
    print("-" * 50)
    print(result.song_info.lyrics)
    
    print("\nTRANSLATED LYRICS (ENGLISH):")
    print("-" * 50)
    print(result.translation.translation)
    
    print("\nVOCABULARY:")
    print("-" * 50)
    for i, entry in enumerate(result.vocabulary.entries, 1):
        print(f"{i}. {entry.word} ({entry.part_of_speech}): {entry.definition}")
        print(f"   Example: {entry.example}")
        print(f"   Translation: {entry.translation}")
        print()
    
    return result


def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(description="Analyze French songs for vocabulary learning")
    parser.add_argument("song_title", help="Title of the French song to analyze")
    parser.add_argument("--artist", "-a", help="Name of the artist (optional)")
    parser.add_argument("--web", "-w", action="store_true", help="Launch the web interface")
    
    args = parser.parse_args()
    
    if args.web:
        # Launch the web interface
        print("Launching web interface...")
        import subprocess
        subprocess.run(["streamlit", "run", "web/app.py"])
    else:
        # Process the song via CLI
        try:
            process_song(args.song_title, args.artist)
        except Exception as e:
            print(f"Error: {str(e)}")
            sys.exit(1)


if __name__ == "__main__":
    main()
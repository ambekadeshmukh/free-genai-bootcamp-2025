from src.utils.helpers import load_config
import random

# Feedback templates in English
ENGLISH_FEEDBACK = {
    "perfect": [
        "Perfect! Your writing is excellent.",
        "Fantastic job! Your French writing is spot on.",
        "Excellent! Your handwriting and spelling are perfect."
    ],
    "almost_perfect": [
        "Very close! Just a small accent issue.",
        "Nearly perfect! Pay attention to the accents.",
        "Almost there! Check the accents carefully."
    ],
    "good": [
        "Good attempt! You're on the right track.",
        "Well done! Just a few small errors to fix.",
        "Nice work! With a bit more practice, you'll nail it."
    ],
    "needs_work": [
        "Keep practicing! Try to pay more attention to spelling.",
        "You're making progress! Focus on the correct spelling.",
        "Continue your efforts! Pay attention to each letter."
    ],
    "accent_tips": [
        "Remember that '{char}' should have an accent: '{correct_char}'.",
        "The letter '{char}' needs an accent in this word: '{correct_char}'.",
        "Don't forget the accent on '{char}' → '{correct_char}'."
    ]
}

# Feedback templates in French
FRENCH_FEEDBACK = {
    "perfect": [
        "Parfait ! Votre écriture est excellente.",
        "Fantastique ! Votre français écrit est impeccable.",
        "Excellent ! Votre écriture et votre orthographe sont parfaites."
    ],
    "almost_perfect": [
        "Très proche ! Juste un petit problème d'accent.",
        "Presque parfait ! Faites attention aux accents.",
        "Vous y êtes presque ! Vérifiez bien les accents."
    ],
    "good": [
        "Bonne tentative ! Vous êtes sur la bonne voie.",
        "Bien joué ! Juste quelques petites erreurs à corriger.",
        "Bon travail ! Avec un peu plus de pratique, vous y arriverez."
    ],
    "needs_work": [
        "Continuez à pratiquer ! Essayez de faire plus attention à l'orthographe.",
        "Vous progressez ! Concentrez-vous sur l'orthographe correcte.",
        "Poursuivez vos efforts ! Faites attention à chaque lettre."
    ],
    "accent_tips": [
        "N'oubliez pas que '{char}' devrait avoir un accent : '{correct_char}'.",
        "La lettre '{char}' a besoin d'un accent dans ce mot : '{correct_char}'.",
        "N'oubliez pas l'accent sur '{char}' → '{correct_char}'."
    ]
}

def generate_feedback(evaluation):
    """Generate feedback based on evaluation results"""
    # Load configuration
    config = load_config()
    language = config.get("feedback_language", "english")
    
    # Select appropriate feedback templates
    templates = FRENCH_FEEDBACK if language == "french" else ENGLISH_FEEDBACK
    
    # Generate appropriate feedback based on evaluation
    if evaluation["exact_match"]:
        return random.choice(templates["perfect"])
    
    # Almost perfect - just accent issues
    if evaluation["no_accent_similarity"] > 0.95 and evaluation["accent_mistakes"]:
        base_feedback = random.choice(templates["almost_perfect"])
        
        # Add specific accent advice
        accent_tips = []
        for mistake in evaluation["accent_mistakes"][:2]:  # Limit to 2 tips
            tip = random.choice(templates["accent_tips"]).format(
                char=mistake["submitted"],
                correct_char=mistake["expected"]
            )
            accent_tips.append(tip)
        
        return f"{base_feedback} {' '.join(accent_tips)}"
    
    # Good attempt
    if evaluation["similarity"] >= 0.7:
        return random.choice(templates["good"])
    
    # Needs more work
    return f"{random.choice(templates['needs_work'])} {evaluation['expected']}"
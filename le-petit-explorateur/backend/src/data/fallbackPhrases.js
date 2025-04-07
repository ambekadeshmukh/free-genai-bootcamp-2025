// backend/src/data/fallbackPhrases.js

module.exports = {
    greetings: [
      { id: '1', french: 'Bonjour comment allez-vous', english: 'Hello how are you', words: ['Bonjour', 'comment', 'allez', 'vous'], hint: 'A common greeting' },
      { id: '2', french: 'Au revoir et à bientôt', english: 'Goodbye and see you soon', words: ['Au', 'revoir', 'et', 'à', 'bientôt'], hint: 'Saying goodbye' },
      { id: '3', french: 'Enchanté de faire votre connaissance', english: 'Pleased to meet you', words: ['Enchanté', 'de', 'faire', 'votre', 'connaissance'], hint: 'First meeting' }
    ],
    questions: [
      { id: '1', french: 'Où est la bibliothèque', english: 'Where is the library', words: ['Où', 'est', 'la', 'bibliothèque'], hint: 'Asking for a location' },
      { id: '2', french: 'Quelle heure est-il', english: 'What time is it', words: ['Quelle', 'heure', 'est', 'il'], hint: 'Asking about time' },
      { id: '3', french: 'Comment vous appelez-vous', english: 'What is your name', words: ['Comment', 'vous', 'appelez', 'vous'], hint: 'Asking for a name' }
    ],
    food: [
      { id: '1', french: 'Je voudrais un café', english: 'I would like a coffee', words: ['Je', 'voudrais', 'un', 'café'], hint: 'In a café' },
      { id: '2', french: 'Le menu s\'il vous plaît', english: 'The menu please', words: ['Le', 'menu', 's\'il', 'vous', 'plaît'], hint: 'In a restaurant' },
      { id: '3', french: 'J\'aime la cuisine française', english: 'I like French cuisine', words: ['J\'aime', 'la', 'cuisine', 'française'], hint: 'Food preference' }
    ],
    travel: [
      { id: '1', french: 'Je vais à Paris', english: 'I am going to Paris', words: ['Je', 'vais', 'à', 'Paris'], hint: 'Stating destination' },
      { id: '2', french: 'Où est la gare', english: 'Where is the train station', words: ['Où', 'est', 'la', 'gare'], hint: 'Finding a location' },
      { id: '3', french: 'J\'ai perdu mon passeport', english: 'I lost my passport', words: ['J\'ai', 'perdu', 'mon', 'passeport'], hint: 'Problem while traveling' }
    ],
    daily: [
      { id: '1', french: 'Je me lève à sept heures', english: 'I get up at seven o\'clock', words: ['Je', 'me', 'lève', 'à', 'sept', 'heures'], hint: 'Morning routine' },
      { id: '2', french: 'Je vais travailler', english: 'I go to work', words: ['Je', 'vais', 'travailler'], hint: 'Daily activity' },
      { id: '3', french: 'Je dîne à huit heures', english: 'I have dinner at eight o\'clock', words: ['Je', 'dîne', 'à', 'huit', 'heures'], hint: 'Evening routine' }
    ],
    expressions: [
      { id: '1', french: 'C\'est la vie', english: 'That\'s life', words: ['C\'est', 'la', 'vie'], hint: 'Common expression' },
      { id: '2', french: 'Je ne sais pas', english: 'I don\'t know', words: ['Je', 'ne', 'sais', 'pas'], hint: 'Expressing uncertainty' },
      { id: '3', french: 'À votre santé', english: 'To your health', words: ['À', 'votre', 'santé'], hint: 'Toast when drinking' }
    ]
  };
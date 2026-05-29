/**
 * Lexia Cameroon — Bilingual Content Store (EN/FR)
 * All content uses Cameroonian names, cities, foods, and cultural context.
 */

const i18n = {
  en: {
    // App
    appName: "Lexia",
    appTagline: "Read. Spell. Shine!",
    appSubtitle: "Helping Cameroon's children master reading,\none sound at a time.",
    offline: "You're offline — no worries, Lexia still works!",

    // Navigation
    navHome: "Home",
    navPhonics: "Sounds",
    navSpelling: "Spelling",

    // Home
    heroGreeting: "Welcome, young reader!",
    statsWords: "Words",
    statsStreak: "Streak",
    statsStars: "Stars",
    modulePhonicTitle: "Phonics Lab",
    modulePhonicDesc: "Learn the sounds of letters & words",
    moduleForgeTitle: "Word Forge",
    moduleForgeDesc: "Build & spell Cameroonian words",
    dailyTip: "Tip of the Day",
    tips: [
      "Try sounding out letters slowly: N-D-O-L-É.",
      "Tap each letter tile to hear its sound!",
      "Practice 5 words a day to build your skills.",
      "Ask a friend to spell a word — make it a game!",
      "Read signs around Douala or Yaoundé aloud!",
    ],

    // Phonics Lab
    phonicsTitle: "Phonics Lab",
    phonicsSubtitle: "Tap a tile to hear the sound",
    categoryAll: "All",
    categoryVowels: "Vowels",
    categoryConsonants: "Consonants",
    categoryBlends: "Blends",
    phonicsTip: "Tap any tile to hear its sound. Learn to blend sounds to read words!",

    // Word Forge
    forgeTitle: "Word Forge",
    forgeSubtitle: "Spell the word!",
    forgeHint: "Hint",
    forgeSkip: "Skip",
    forgeCheck: "Check",
    forgeNext: "Next Word",
    forgeCorrect: "Amazing! 🎉",
    forgeWrong: "Try again — you got this!",
    forgeComplete: "You finished all the words!",
    forgePlayAgain: "Play Again",
    forgeScore: "Score",
    forgeStreak: "streak",
    forgeCategoryFood: "Food",
    forgeCategoryNames: "Names",
    forgeCategoryCities: "Cities",
    forgeCategoryNature: "Nature",
    forgeCategoryAll: "All Words",

    // Celebration
    celebTitle: "Superstar! ⭐",
    celebMessage: "You completed the round!",
    celebBtn: "Keep Going",

    // Accessibility
    speakBtn: "Listen",
    backBtn: "Back",
  },

  fr: {
    // App
    appName: "Lexia",
    appTagline: "Lis. Épelle. Brille !",
    appSubtitle: "Aider les enfants du Cameroun à maîtriser la lecture,\nun son à la fois.",
    offline: "Vous êtes hors ligne — pas de souci, Lexia fonctionne toujours !",

    // Navigation
    navHome: "Accueil",
    navPhonics: "Sons",
    navSpelling: "Épeler",

    // Home
    heroGreeting: "Bienvenue, jeune lecteur !",
    statsWords: "Mots",
    statsStreak: "Série",
    statsStars: "Étoiles",
    modulePhonicTitle: "Labo Phonique",
    modulePhonicDesc: "Apprends les sons des lettres et mots",
    moduleForgeTitle: "Forge de Mots",
    moduleForgeDesc: "Construis et épelle des mots camerounais",
    dailyTip: "Conseil du jour",
    tips: [
      "Essaie d'épeler lentement : N-D-O-L-É.",
      "Touche chaque tuile pour entendre son son !",
      "Pratique 5 mots par jour pour progresser.",
      "Demande à un ami d'épeler un mot — c'est un jeu !",
      "Lis les panneaux à Douala ou Yaoundé à voix haute !",
    ],

    // Phonics Lab
    phonicsTitle: "Labo Phonique",
    phonicsSubtitle: "Touche une tuile pour entendre le son",
    categoryAll: "Tous",
    categoryVowels: "Voyelles",
    categoryConsonants: "Consonnes",
    categoryBlends: "Mélanges",
    phonicsTip: "Touche une tuile pour entendre le son. Apprends à mélanger les sons !",

    // Word Forge
    forgeTitle: "Forge de Mots",
    forgeSubtitle: "Épelle le mot !",
    forgeHint: "Indice",
    forgeSkip: "Passer",
    forgeCheck: "Vérifier",
    forgeNext: "Mot Suivant",
    forgeCorrect: "Bravo ! 🎉",
    forgeWrong: "Réessaie — tu peux le faire !",
    forgeComplete: "Tu as terminé tous les mots !",
    forgePlayAgain: "Rejouer",
    forgeScore: "Score",
    forgeStreak: "série",
    forgeCategoryFood: "Nourriture",
    forgeCategoryNames: "Prénoms",
    forgeCategoryCities: "Villes",
    forgeCategoryNature: "Nature",
    forgeCategoryAll: "Tous les Mots",

    // Celebration
    celebTitle: "Superstar ! ⭐",
    celebMessage: "Tu as terminé la série !",
    celebBtn: "Continuer",

    // Accessibility
    speakBtn: "Écouter",
    backBtn: "Retour",
  },
};

/** Phonics data — shared across both languages */
export const phonicsData = [
  // Vowels
  { letter: "A",  sound: "ah",    example: "Abena",    category: "vowels",     color: "tile-green" },
  { letter: "E",  sound: "eh",    example: "Ekondo",   category: "vowels",     color: "tile-green" },
  { letter: "I",  sound: "ih",    example: "Idenau",   category: "vowels",     color: "tile-green" },
  { letter: "O",  sound: "oh",    example: "Obala",    category: "vowels",     color: "tile-green" },
  { letter: "U",  sound: "uh",    example: "Uyo",      category: "vowels",     color: "tile-green" },

  // Consonants
  { letter: "B",  sound: "buh",   example: "Bamenda",  category: "consonants", color: "tile-amber" },
  { letter: "C",  sound: "kuh",   example: "Cameroon", category: "consonants", color: "tile-amber" },
  { letter: "D",  sound: "duh",   example: "Douala",   category: "consonants", color: "tile-amber" },
  { letter: "F",  sound: "fuh",   example: "Foumban",  category: "consonants", color: "tile-amber" },
  { letter: "G",  sound: "guh",   example: "Garoua",   category: "consonants", color: "tile-amber" },
  { letter: "H",  sound: "huh",   example: "Henna",    category: "consonants", color: "tile-amber" },
  { letter: "J",  sound: "juh",   example: "Joy",      category: "consonants", color: "tile-amber" },
  { letter: "K",  sound: "kuh",   example: "Kumba",    category: "consonants", color: "tile-amber" },
  { letter: "L",  sound: "luh",   example: "Limbe",    category: "consonants", color: "tile-amber" },
  { letter: "M",  sound: "muh",   example: "Maroua",   category: "consonants", color: "tile-amber" },
  { letter: "N",  sound: "nuh",   example: "Ndolé",    category: "consonants", color: "tile-amber" },
  { letter: "P",  sound: "puh",   example: "Pelé",     category: "consonants", color: "tile-amber" },
  { letter: "R",  sound: "ruh",   example: "Rita",     category: "consonants", color: "tile-amber" },
  { letter: "S",  sound: "sss",   example: "Sawa",     category: "consonants", color: "tile-amber" },
  { letter: "T",  sound: "tuh",   example: "Tiko",     category: "consonants", color: "tile-amber" },
  { letter: "V",  sound: "vuh",   example: "Victoria", category: "consonants", color: "tile-amber" },
  { letter: "W",  sound: "wuh",   example: "Wum",      category: "consonants", color: "tile-amber" },
  { letter: "Y",  sound: "yuh",   example: "Yaoundé",  category: "consonants", color: "tile-amber" },
  { letter: "Z",  sound: "zuh",   example: "Zoa",      category: "consonants", color: "tile-amber" },

  // Blends
  { letter: "CH", sound: "chuh",  example: "Achu",     category: "blends",     color: "tile-indigo" },
  { letter: "SH", sound: "shuh",  example: "Shey",     category: "blends",     color: "tile-indigo" },
  { letter: "TH", sound: "thuh",  example: "Thandani", category: "blends",     color: "tile-indigo" },
  { letter: "PH", sound: "fuh",   example: "Philip",   category: "blends",     color: "tile-indigo" },
  { letter: "NG", sound: "nguh",  example: "Ngong",    category: "blends",     color: "tile-rose" },
  { letter: "ND", sound: "nduh",  example: "Ndolé",    category: "blends",     color: "tile-rose" },
  { letter: "MB", sound: "mbuh",  example: "Mbang",    category: "blends",     color: "tile-rose" },
  { letter: "NK", sound: "nkuh",  example: "Nkongsamba",category: "blends",    color: "tile-rose" },
];

/** Word Forge vocabulary — Cameroonian context */
export const wordData = [
  // Food
  { word: "NDOLE", emoji: "🥬", hint: { en: "A famous Cameroonian dish with bitter leaves", fr: "Un plat camerounais célèbre avec des feuilles amères" }, category: "food" },
  { word: "ACHU",  emoji: "🍲", hint: { en: "A traditional dish from the Northwest", fr: "Un plat traditionnel du Nord-Ouest" }, category: "food" },
  { word: "KOKI",  emoji: "🫘", hint: { en: "A steamed bean pudding wrapped in leaves", fr: "Un pouding de haricots cuit à la vapeur" }, category: "food" },
  { word: "FUFU",  emoji: "🥣", hint: { en: "A soft dough made from cassava or corn", fr: "Une pâte molle de manioc ou de maïs" }, category: "food" },
  { word: "SUYA",  emoji: "🍢", hint: { en: "Spicy grilled meat on a stick", fr: "Viande grillée épicée sur un bâton" }, category: "food" },
  { word: "PUFF",  emoji: "🍩", hint: { en: "A fried dough ball — puff puff!", fr: "Un beignet frit — puff puff !" }, category: "food" },
  { word: "FISH",  emoji: "🐟", hint: { en: "Caught in rivers and the Atlantic coast", fr: "Pêché dans les rivières et la côte Atlantique" }, category: "food" },
  { word: "RICE",  emoji: "🍚", hint: { en: "A staple food enjoyed across Cameroon", fr: "Un aliment de base apprécié au Cameroun" }, category: "food" },
  { word: "CORN",  emoji: "🌽", hint: { en: "Grown in fields across the country", fr: "Cultivé dans les champs à travers le pays" }, category: "food" },
  { word: "BEAN",  emoji: "🫘", hint: { en: "Used to make koki and many dishes", fr: "Utilisé pour le koki et beaucoup de plats" }, category: "food" },

  // Names
  { word: "ABENA",  emoji: "👧🏾", hint: { en: "A beautiful girl's name", fr: "Un beau prénom de fille" }, category: "names" },
  { word: "FON",    emoji: "👨🏾", hint: { en: "A traditional chief's title", fr: "Un titre de chef traditionnel" }, category: "names" },
  { word: "AMINA",  emoji: "👩🏾", hint: { en: "A popular name in the North", fr: "Un prénom populaire au Nord" }, category: "names" },
  { word: "BELLO",  emoji: "👦🏾", hint: { en: "A common Fulani name", fr: "Un prénom peul courant" }, category: "names" },
  { word: "NJOYA",  emoji: "👑", hint: { en: "A famous king of the Bamoun people", fr: "Un célèbre roi du peuple Bamoun" }, category: "names" },
  { word: "MAMA",   emoji: "🤱🏾", hint: { en: "What we call our mothers", fr: "Comment on appelle nos mamans" }, category: "names" },
  { word: "PAPA",   emoji: "👨🏾‍🦱", hint: { en: "What we call our fathers", fr: "Comment on appelle nos papas" }, category: "names" },

  // Cities
  { word: "DOUALA",   emoji: "🏙️", hint: { en: "The economic capital by the sea", fr: "La capitale économique au bord de la mer" }, category: "cities" },
  { word: "LIMBE",    emoji: "🏖️", hint: { en: "A coastal town near Mount Cameroon", fr: "Une ville côtière près du Mont Cameroun" }, category: "cities" },
  { word: "KUMBA",    emoji: "🌿", hint: { en: "A city in the Southwest Region", fr: "Une ville de la Région du Sud-Ouest" }, category: "cities" },
  { word: "BUEA",     emoji: "⛰️", hint: { en: "A town at the foot of Mount Cameroon", fr: "Une ville au pied du Mont Cameroun" }, category: "cities" },
  { word: "KRIBI",    emoji: "🌊", hint: { en: "A beach town on the southern coast", fr: "Une ville balnéaire sur la côte sud" }, category: "cities" },
  { word: "TIKO",     emoji: "🏘️", hint: { en: "A town near Douala with plantations", fr: "Une ville près de Douala avec des plantations" }, category: "cities" },
  { word: "BAMENDA",  emoji: "🌄", hint: { en: "Capital of the Northwest Region", fr: "Capitale de la Région du Nord-Ouest" }, category: "cities" },

  // Nature
  { word: "RIVER",  emoji: "🏞️", hint: { en: "Water that flows — like the Wouri!", fr: "L'eau qui coule — comme le Wouri !" }, category: "nature" },
  { word: "TREE",   emoji: "🌳", hint: { en: "Tall plants in the rainforest", fr: "De grandes plantes dans la forêt tropicale" }, category: "nature" },
  { word: "RAIN",   emoji: "🌧️", hint: { en: "Falls often in Cameroon!", fr: "Tombe souvent au Cameroun !" }, category: "nature" },
  { word: "SUN",    emoji: "☀️", hint: { en: "Shines bright in the dry season", fr: "Brille fort en saison sèche" }, category: "nature" },
  { word: "BIRD",   emoji: "🦜", hint: { en: "Flies in the sky — many types in Cameroon", fr: "Vole dans le ciel — beaucoup d'espèces au Cameroun" }, category: "nature" },
  { word: "LION",   emoji: "🦁", hint: { en: "The Indomitable Lions of Cameroon!", fr: "Les Lions Indomptables du Cameroun !" }, category: "nature" },
  { word: "LAKE",   emoji: "💧", hint: { en: "Like Lake Nyos in the Northwest", fr: "Comme le Lac Nyos au Nord-Ouest" }, category: "nature" },
  { word: "HILL",   emoji: "⛰️", hint: { en: "Cameroon has many green hills", fr: "Le Cameroun a beaucoup de collines vertes" }, category: "nature" },
];

export default i18n;

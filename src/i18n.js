/**
 * Lexia Cameroon — Bilingual Content Store (EN/FR)
 * All content uses Cameroonian names, cities, foods, and cultural context.
 */

const i18n = {
  en: {
    // App
    appName: "LexiaCamer",
    appTagline: "Read. Spell. Shine!",
    appSubtitle: "Helping Cameroon's children master reading,\none sound at a time.",
    offline: "You're offline — no worries, Lexia still works!",
    audioUnavailable: "Audio isn't available on this device, so you won't hear the sounds. Everything else still works.",

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
    forgeUndo: "Undo",
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

    // Home — action grid
    defaultUserName: "Young Reader",
    homePhonicsTitle: "Phonics Lab",
    homePhonicsDesc: "Learn sounds",
    homeForgeTitle: "Word Forge",
    homeForgeDesc: "Spell words",
    homeStickerTitle: "Sticker Book",
    homeStickerDesc: "Spend stars",
    homeSettingsTitle: "Settings",
    homeSettingsDesc: "Dyslexia mode",

    // Onboarding
    onboardNameTitle: "What is your name?",
    onboardNameSubtitle: "Let's personalize your experience!",
    onboardNamePlaceholder: "Type your name...",
    onboardContinue: "Continue",
    onboardAvatarTitle: "Choose your buddy",
    onboardAvatarSubtitle: "Pick an animal friend to learn with!",
    onboardReady: "You're all set. Let's start learning! 🎉",
    onboardLetsGo: "Let's Go!",
    onboardWelcome: "Welcome, {name}!",

    // Phonics Lab — challenge mode
    phonicsPlayChallenge: "Play Challenge Mode",
    phonicsRepeatSound: "Repeat Sound",
    phonicsQuit: "Quit",
    phonicsListenPrompt: "Listen carefully! Find the letter that makes the sound.",

    // Settings
    settingsTitle: "Settings",
    settingsDyslexiaTitle: "Dyslexia-Friendly Mode",
    settingsDyslexiaDesc: "Uses the Comic Neue font and increased letter spacing for easier reading.",
    settingsAboutTitle: "About LexiaCamer",
    settingsAboutDesc: "Helping Cameroon's children master reading, one sound at a time. This app is 100% free and works offline!",

    // Parent Dashboard
    parentTitle: "Parent Area",
    parentUnlockPrompt: "This area is for grown-ups. Tap the button below 3 times to unlock it.",
    parentTapUnlock: "Tap to Unlock",
    parentLeft: "left",
    parentCancel: "Cancel",
    parentOverview: "Overview",
    parentWordsBuilt: "Words Built",
    parentTotalStars: "Total Stars",
    parentPracticeAreas: "Practice Areas",
    parentNoData: "Not enough data yet. Let your child play more Word Forge!",
    parentMissedLetters: "These are the letters your child frequently misses when spelling:",
    parentTip: "Go to the Phonics Lab and practice the sounds for these specific letters together!",
    parentReset: "Reset progress",
    parentResetWarning: "This clears all stars, streak, words and stickers. It can't be undone.",
    parentResetConfirm: "Yes, reset",
    parentTipLabel: "Parent Tip:",

    // Sticker Book
    stickerTitle: "Sticker Book",
    stickerHowTo: "How to collect stickers",
    stickerStepEarn: "Earn stars",
    stickerStepEarnDesc: "You get stars for every word you read in Phonics Lab & Word Forge.",
    stickerStepPick: "Pick a sticker",
    stickerStepPickDesc: "The number on each locked sticker is its star price. Choose one you can afford.",
    stickerStepUnlock: "Tap to unlock",
    stickerStepUnlockDesc: "Tap it to spend your stars. It joins your collection to keep forever!",
    stickerCollected: "stickers collected",
    stickerUnlock: "Unlock",
    stickerMoreToGo: "more to go",

    // Top bar
    dashboardLabel: "Dashboard",
  },

  fr: {
    // App
    appName: "LexiaCamer",
    appTagline: "Lis. Épelle. Brille !",
    appSubtitle: "Aider les enfants du Cameroun à maîtriser la lecture,\nun son à la fois.",
    offline: "Vous êtes hors ligne — pas de souci, Lexia fonctionne toujours !",
    audioUnavailable: "L'audio n'est pas disponible sur cet appareil, vous n'entendrez donc pas les sons. Tout le reste fonctionne.",

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
    forgeUndo: "Annuler",
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

    // Home — action grid
    defaultUserName: "Jeune Lecteur",
    homePhonicsTitle: "Labo Phonique",
    homePhonicsDesc: "Apprends les sons",
    homeForgeTitle: "Forge de Mots",
    homeForgeDesc: "Épelle les mots",
    homeStickerTitle: "Album d'Autocollants",
    homeStickerDesc: "Dépense tes étoiles",
    homeSettingsTitle: "Réglages",
    homeSettingsDesc: "Mode dyslexie",

    // Onboarding
    onboardNameTitle: "Comment tu t'appelles ?",
    onboardNameSubtitle: "Personnalisons ton expérience !",
    onboardNamePlaceholder: "Tape ton nom...",
    onboardContinue: "Continuer",
    onboardAvatarTitle: "Choisis ton compagnon",
    onboardAvatarSubtitle: "Choisis un ami animal pour apprendre !",
    onboardReady: "Tu es prêt. Apprenons ensemble ! 🎉",
    onboardLetsGo: "C'est parti !",
    onboardWelcome: "Bienvenue, {name} !",

    // Phonics Lab — challenge mode
    phonicsPlayChallenge: "Mode Défi",
    phonicsRepeatSound: "Répéter le son",
    phonicsQuit: "Quitter",
    phonicsListenPrompt: "Écoute bien ! Trouve la lettre qui fait ce son.",

    // Settings
    settingsTitle: "Réglages",
    settingsDyslexiaTitle: "Mode Dyslexie",
    settingsDyslexiaDesc: "Utilise la police Comic Neue et un espacement plus large pour faciliter la lecture.",
    settingsAboutTitle: "À propos de LexiaCamer",
    settingsAboutDesc: "Aider les enfants du Cameroun à maîtriser la lecture, un son à la fois. Cette application est 100% gratuite et fonctionne hors ligne !",

    // Parent Dashboard
    parentTitle: "Espace Parent",
    parentUnlockPrompt: "Cet espace est réservé aux adultes. Appuyez 3 fois sur le bouton pour le déverrouiller.",
    parentTapUnlock: "Appuyez pour déverrouiller",
    parentLeft: "restant(s)",
    parentCancel: "Annuler",
    parentOverview: "Aperçu",
    parentWordsBuilt: "Mots Construits",
    parentTotalStars: "Étoiles Totales",
    parentPracticeAreas: "Domaines à Pratiquer",
    parentNoData: "Pas assez de données. Laissez votre enfant jouer plus à Forge de Mots !",
    parentMissedLetters: "Voici les lettres que votre enfant rate souvent en épelant :",
    parentTip: "Allez au Labo Phonique et pratiquez les sons de ces lettres ensemble !",
    parentReset: "Réinitialiser la progression",
    parentResetWarning: "Cela efface toutes les étoiles, la série, les mots et les autocollants. C'est irréversible.",
    parentResetConfirm: "Oui, réinitialiser",
    parentTipLabel: "Conseil parent :",

    // Sticker Book
    stickerTitle: "Album d'Autocollants",
    stickerHowTo: "Comment collectionner les autocollants",
    stickerStepEarn: "Gagne des étoiles",
    stickerStepEarnDesc: "Tu gagnes des étoiles pour chaque mot lu au Labo Phonique et à la Forge de Mots.",
    stickerStepPick: "Choisis un autocollant",
    stickerStepPickDesc: "Le nombre sur chaque autocollant verrouillé est son prix en étoiles. Choisis-en un que tu peux te permettre.",
    stickerStepUnlock: "Touche pour débloquer",
    stickerStepUnlockDesc: "Touche-le pour dépenser tes étoiles. Il rejoint ta collection pour toujours !",
    stickerCollected: "autocollants collectionnés",
    stickerUnlock: "Débloquer",
    stickerMoreToGo: "encore",

    // Top bar
    dashboardLabel: "Tableau de bord",
  },
};

/** Phonics data — shared across both languages */
export const phonicsData = [
  // Vowels
  { letter: "A", sound: "ah", example: "Abena", category: "vowels", color: "tile-green" },
  { letter: "E", sound: "eh", example: "Ekondo", category: "vowels", color: "tile-green" },
  { letter: "I", sound: "i", example: "Idenau", category: "vowels", color: "tile-green" },
  { letter: "O", sound: "oh", example: "Obala", category: "vowels", color: "tile-green" },
  { letter: "U", sound: "u", example: "Uyo", category: "vowels", color: "tile-green" },

  // Consonants
  { letter: "B", sound: "b", example: "Bamenda", category: "consonants", color: "tile-amber" },
  { letter: "C", sound: "c", example: "Cameroon", category: "consonants", color: "tile-amber" },
  { letter: "D", sound: "d", example: "Douala", category: "consonants", color: "tile-amber" },
  { letter: "F", sound: "f", example: "Foumban", category: "consonants", color: "tile-amber" },
  { letter: "G", sound: "g", example: "Garoua", category: "consonants", color: "tile-amber" },
  { letter: "H", sound: "h", example: "Henna", category: "consonants", color: "tile-amber" },
  { letter: "J", sound: "j", example: "Joy", category: "consonants", color: "tile-amber" },
  { letter: "K", sound: "k", example: "Kumba", category: "consonants", color: "tile-amber" },
  { letter: "L", sound: "l", example: "Limbe", category: "consonants", color: "tile-amber" },
  { letter: "M", sound: "m", example: "Maroua", category: "consonants", color: "tile-amber" },
  { letter: "N", sound: "n", example: "Ndolé", category: "consonants", color: "tile-amber" },
  { letter: "P", sound: "p", example: "Pelé", category: "consonants", color: "tile-amber" },
  { letter: "R", sound: "r", example: "Rita", category: "consonants", color: "tile-amber" },
  { letter: "S", sound: "s", example: "Sawa", category: "consonants", color: "tile-amber" },
  { letter: "T", sound: "t", example: "Tiko", category: "consonants", color: "tile-amber" },
  { letter: "V", sound: "v", example: "Victoria", category: "consonants", color: "tile-amber" },
  { letter: "W", sound: "w", example: "Wum", category: "consonants", color: "tile-amber" },
  { letter: "Y", sound: "y", example: "Yaoundé", category: "consonants", color: "tile-amber" },
  { letter: "Z", sound: "z", example: "Zoa", category: "consonants", color: "tile-amber" },

  // Blends — sound field must match a phoneme map key OR be a word the TTS can speak directly.
  // CH/SH/TH/PH: keys exist in the phoneme map → map converts to clean single-syllable phoneme.
  // NG/ND/MB/NK: prenasalised stops don't exist word-initially in English/French TTS;
  //              pass the example word → TTS speaks the whole word slowly at rate 0.65,
  //              which is how phonics teachers introduce these blends in context.
  { letter: "CH", sound: "ch",    example: "Achu",         category: "blends", color: "tile-indigo" },
  { letter: "SH", sound: "sh",    example: "Shey",         category: "blends", color: "tile-indigo" },
  { letter: "TH", sound: "th",    example: "Thandani",     category: "blends", color: "tile-indigo" },
  { letter: "PH", sound: "ph",    example: "Philip",       category: "blends", color: "tile-indigo" },
  { letter: "NG", sound: "Ngong",        example: "Ngong",         category: "blends", color: "tile-rose" },
  { letter: "ND", sound: "Ndolé",        example: "Ndolé",         category: "blends", color: "tile-rose" },
  { letter: "MB", sound: "Mbang",        example: "Mbang",         category: "blends", color: "tile-rose" },
  { letter: "NK", sound: "Nkam",         example: "Nkongsamba",    category: "blends", color: "tile-rose" },
];

/** Word Forge vocabulary — Cameroonian context */
export const wordData = [
  // Food
  { word: "NDOLE", icon: "Leaf", hint: { en: "A famous Cameroonian dish with bitter leaves", fr: "Un plat camerounais célèbre avec des feuilles amères" }, category: "food" },
  { word: "ACHU", icon: "Soup", hint: { en: "A traditional dish from the Northwest", fr: "Un plat traditionnel du Nord-Ouest" }, category: "food" },
  { word: "KOKI", icon: "Package", hint: { en: "A steamed bean pudding wrapped in leaves", fr: "Un pouding de haricots cuit à la vapeur" }, category: "food" },
  { word: "FUFU", icon: "ChefHat", hint: { en: "A soft dough made from cassava or corn", fr: "Une pâte molle de manioc ou de maïs" }, category: "food" },
  { word: "SUYA", icon: "Beef", hint: { en: "Spicy grilled meat on a stick", fr: "Viande grillée épicée sur un bâton" }, category: "food" },
  { word: "PUFF", icon: "Circle", hint: { en: "A fried dough ball — puff puff!", fr: "Un beignet frit — puff puff !" }, category: "food" },
  { word: "FISH", icon: "Fish", hint: { en: "Caught in rivers and the Atlantic coast", fr: "Pêché dans les rivières et la côte Atlantique" }, category: "food" },
  { word: "RICE", icon: "ConciergeBell", hint: { en: "A staple food enjoyed across Cameroon", fr: "Un aliment de base apprécié au Cameroun" }, category: "food" },
  { word: "CORN", icon: "Wheat", hint: { en: "Grown in fields across the country", fr: "Cultivé dans les champs à travers le pays" }, category: "food" },
  { word: "BEAN", icon: "Carrot", hint: { en: "Used to make koki and many dishes", fr: "Utilisé pour le koki et beaucoup de plats" }, category: "food" },
  { word: "EGG", icon: "Circle", hint: { en: "A round food we eat at breakfast", fr: "Un aliment rond du petit déjeuner" }, category: "food" },
  { word: "YAM", icon: "Carrot", hint: { en: "A starchy root we boil or pound", fr: "Un tubercule que l'on bout ou pile" }, category: "food" },
  { word: "OKRA", icon: "Leaf", hint: { en: "A green vegetable used in soups", fr: "Un légume vert utilisé dans les soupes" }, category: "food" },
  { word: "MEAT", icon: "Beef", hint: { en: "Grilled or cooked in a stew", fr: "Grillée ou cuite en sauce" }, category: "food" },
  { word: "MILK", icon: "Droplets", hint: { en: "A white drink that comes from cows", fr: "Une boisson blanche qui vient des vaches" }, category: "food" },
  { word: "GARI", icon: "Package", hint: { en: "Ground cassava flakes", fr: "Des flocons de manioc moulu" }, category: "food" },
  { word: "ERU", icon: "Leaf", hint: { en: "A tasty forest-leaf dish", fr: "Un délicieux plat de feuilles de forêt" }, category: "food" },
  { word: "BREAD", icon: "Wheat", hint: { en: "Baked and eaten at breakfast", fr: "Cuit au four et mangé au petit déjeuner" }, category: "food" },

  // Names
  { word: "ABENA", icon: "User", hint: { en: "A beautiful girl's name", fr: "Un beau prénom de fille" }, category: "names" },
  { word: "FON", icon: "Crown", hint: { en: "A traditional chief's title", fr: "Un titre de chef traditionnel" }, category: "names" },
  { word: "AMINA", icon: "UserCheck", hint: { en: "A popular name in the North", fr: "Un prénom populaire au Nord" }, category: "names" },
  { word: "BELLO", icon: "UserSquare", hint: { en: "A common Fulani name", fr: "Un prénom peul courant" }, category: "names" },
  { word: "NJOYA", icon: "Star", hint: { en: "A famous king of the Bamoun people", fr: "Un célèbre roi du peuple Bamoun" }, category: "names" },
  { word: "MAMA", icon: "Heart", hint: { en: "What we call our mothers", fr: "Comment on appelle nos mamans" }, category: "names" },
  { word: "PAPA", icon: "Smile", hint: { en: "What we call our fathers", fr: "Comment on appelle nos papas" }, category: "names" },
  { word: "ETO", icon: "Star", hint: { en: "Like Eto'o, the famous footballer!", fr: "Comme Eto'o, le célèbre footballeur !" }, category: "names" },
  { word: "TABI", icon: "User", hint: { en: "A common name in the Southwest", fr: "Un prénom courant au Sud-Ouest" }, category: "names" },
  { word: "NGWA", icon: "UserSquare", hint: { en: "A common Cameroonian family name", fr: "Un nom de famille camerounais courant" }, category: "names" },
  { word: "MANGA", icon: "UserCheck", hint: { en: "A family name in Cameroon", fr: "Un nom de famille au Cameroun" }, category: "names" },
  { word: "SISI", icon: "Smile", hint: { en: "A sweet way to call a sister", fr: "Une façon affectueuse d'appeler une sœur" }, category: "names" },
  { word: "BABA", icon: "Heart", hint: { en: "A loving word for father", fr: "Un mot affectueux pour le père" }, category: "names" },

  // Cities
  { word: "DOUALA", icon: "Building2", hint: { en: "The economic capital by the sea", fr: "La capitale économique au bord de la mer" }, category: "cities" },
  { word: "LIMBE", icon: "Tent", hint: { en: "A coastal town near Mount Cameroon", fr: "Une ville côtière près du Mont Cameroun" }, category: "cities" },
  { word: "KUMBA", icon: "Trees", hint: { en: "A city in the Southwest Region", fr: "Une ville de la Région du Sud-Ouest" }, category: "cities" },
  { word: "BUEA", icon: "Mountain", hint: { en: "A town at the foot of Mount Cameroon", fr: "Une ville au pied du Mont Cameroun" }, category: "cities" },
  { word: "KRIBI", icon: "Waves", hint: { en: "A beach town on the southern coast", fr: "Une ville balnéaire sur la côte sud" }, category: "cities" },
  { word: "TIKO", icon: "Home", hint: { en: "A town near Douala with plantations", fr: "Une ville près de Douala avec des plantations" }, category: "cities" },
  { word: "BAMENDA", icon: "MapPin", hint: { en: "Capital of the Northwest Region", fr: "Capitale de la Région du Nord-Ouest" }, category: "cities" },
  { word: "YAOUNDE", icon: "Building2", hint: { en: "The capital city of Cameroon", fr: "La capitale du Cameroun" }, category: "cities" },
  { word: "GAROUA", icon: "Tent", hint: { en: "A northern city on the Benue River", fr: "Une ville du Nord sur le fleuve Bénoué" }, category: "cities" },
  { word: "MAROUA", icon: "MapPin", hint: { en: "A city in the Far North", fr: "Une ville de l'Extrême-Nord" }, category: "cities" },
  { word: "EBOLOWA", icon: "Trees", hint: { en: "A green city in the South", fr: "Une ville verte du Sud" }, category: "cities" },
  { word: "BERTOUA", icon: "TreePine", hint: { en: "The main city in the East Region", fr: "La ville principale de la Région de l'Est" }, category: "cities" },
  { word: "EDEA", icon: "Waves", hint: { en: "A town with a big dam on the Sanaga", fr: "Une ville avec un grand barrage sur la Sanaga" }, category: "cities" },
  { word: "KUMBO", icon: "Home", hint: { en: "A highland town in the Northwest", fr: "Une ville des hauts plateaux du Nord-Ouest" }, category: "cities" },

  // Nature
  { word: "RIVER", icon: "Waves", hint: { en: "Water that flows — like the Wouri!", fr: "L'eau qui coule — comme le Wouri !" }, category: "nature" },
  { word: "TREE", icon: "TreePine", hint: { en: "Tall plants in the rainforest", fr: "De grandes plantes dans la forêt tropicale" }, category: "nature" },
  { word: "RAIN", icon: "CloudRain", hint: { en: "Falls often in Cameroon!", fr: "Tombe souvent au Cameroun !" }, category: "nature" },
  { word: "SUN", icon: "Sun", hint: { en: "Shines bright in the dry season", fr: "Brille fort en saison sèche" }, category: "nature" },
  { word: "BIRD", icon: "Bird", hint: { en: "Flies in the sky — many types in Cameroon", fr: "Vole dans le ciel — beaucoup d'espèces au Cameroun" }, category: "nature" },
  { word: "LION", icon: "Flame", hint: { en: "The Indomitable Lions of Cameroon!", fr: "Les Lions Indomptables du Cameroun !" }, category: "nature" },
  { word: "LAKE", icon: "Droplets", hint: { en: "Like Lake Nyos in the Northwest", fr: "Comme le Lac Nyos au Nord-Ouest" }, category: "nature" },
  { word: "HILL", icon: "Mountain", hint: { en: "Cameroon has many green hills", fr: "Le Cameroun a beaucoup de collines vertes" }, category: "nature" },
  { word: "MOON", icon: "Circle", hint: { en: "Shines in the night sky", fr: "Brille dans le ciel nocturne" }, category: "nature" },
  { word: "STAR", icon: "Star", hint: { en: "Twinkles high in the night sky", fr: "Scintille haut dans le ciel nocturne" }, category: "nature" },
  { word: "LEAF", icon: "Leaf", hint: { en: "Grows green on every tree", fr: "Pousse en vert sur chaque arbre" }, category: "nature" },
  { word: "PALM", icon: "TreePine", hint: { en: "A tree that gives oil and wine", fr: "Un arbre qui donne huile et vin" }, category: "nature" },
  { word: "SEA", icon: "Waves", hint: { en: "The Atlantic meets Cameroon's coast", fr: "L'Atlantique borde la côte du Cameroun" }, category: "nature" },
  { word: "FIRE", icon: "Flame", hint: { en: "Warm and bright — be careful!", fr: "Chaud et lumineux — attention !" }, category: "nature" },
  { word: "ROCK", icon: "Mountain", hint: { en: "Hard stone found on the hills", fr: "Une pierre dure trouvée sur les collines" }, category: "nature" },
];

export default i18n;

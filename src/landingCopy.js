/**
 * Landing page copy (EN/FR).
 *
 * Kept out of i18n.js on purpose: that file is the child-facing app, this is
 * the page a parent reads before they trust us with a five-year-old. Different
 * audience, different voice, and it changes on a different schedule.
 *
 * Two rules hold this copy together, and both are easy to break by accident:
 *
 * 1. Nothing here may be invented. Every number is real, every contact reaches
 *    a person. A parent who taps a dead link concludes the whole thing is fake,
 *    which is precisely the opposite of what this page exists to do.
 * 2. There is exactly one call to action. Teachers and schools are described,
 *    never linked, because those dashboards do not exist yet.
 */

export const FACEBOOK_URL =
  'https://web.facebook.com/profile.php?id=61594568422185';

// The one number we cite. It is real: the school directory built from
// OpenStreetMap. If it stops being true, change it here or delete the claim.
export const SCHOOL_COUNT = '3,470';

const landing = {
  en: {
    langName: 'English',
    otherLang: 'Français',

    navCta: 'Become an early tester',

    badge: 'Early prototype',
    heroTitle: 'Your child can learn to read in English, even with no internet.',
    heroLead:
      'LexiaCamer teaches English letter sounds and spelling. The app itself is in English and French, so you can help your child even if you do not read English yourself. Free, offline, no account.',
    heroCta: 'Become an early tester',
    heroSecondary: 'See what a child sees',
    reassure: ['No account needed', 'Works offline', 'Free while we build'],

    // The mock phone in the hero. Matches the real Home screen.
    mockGreeting: 'Hi, Ada',
    mockSub: 'Ready to learn today?',
    mockStats: [
      { value: '12', label: 'Words' },
      { value: '3', label: 'Streak' },
      { value: '45', label: 'Stars' },
    ],
    mockTiles: ['Phonics Lab', 'Word Forge', 'Sticker Book', 'Settings'],

    // The single most important block on the page. Naming our own weakness
    // first is the one trust signal a fake product will not copy.
    honestTitle: 'What is not finished yet',
    honestBody1a: 'The ',
    honestBody1b: '32 letter sounds are not recorded yet',
    honestBody1c:
      ", so the app currently uses your phone's built-in voice. On some Android phones that sounds wrong, or does not play at all. We know, and we are recording real voices next.",
    honestBody2:
      'Reading in French is not built yet either. Today the sounds and the words are English ones, so a child learning to read French will not find what they need here. The app is translated; the lessons are not. French is what we build after the English version is right — properly, with its own sounds and its own words, not a translation of these. Follow the page and we will tell you when it is ready.',
    honestBody3:
      'Everything else is worth your opinion: the spelling game, the stickers, and whether a child can find their way around.',

    howTitle: 'How it works',
    how: [
      {
        title: 'Open it on your device, phone, tablet or laptop',
        body: 'There is nothing to install from a store. It opens in your browser, and you can add it to your home screen to use it like any other app, even with no data.',
      },
      {
        title: 'Your child plays for ten minutes',
        body: 'They tap letters to hear the sound, build words letter by letter, and earn stars for every success. It feels like a game, but they are learning to read.',
      },
      {
        title: 'You see what they found hard',
        body: 'A parent view shows which letters your child is missing and which words they have mastered. Nobody can change what a child did, including us.',
      },
    ],

    insideTitle: 'What is inside',
    inside: [
      {
        title: 'Phonics Lab',
        body: 'Tap a letter, hear its sound, say it back. The foundation of reading.',
      },
      {
        title: 'Word Forge',
        body: 'Build words letter by letter and earn stars.',
      },
      {
        title: 'Sticker Book',
        body: 'Spend stars to collect stickers. The only reward loop in the app.',
      },
      {
        title: 'Dyslexia mode',
        body: 'A rounder font with wider letter spacing, one tap away.',
      },
    ],

    builtTitle: 'Built for Cameroon',
    built: [
      {
        title: 'Works with no data',
        body: 'After the first load, it works entirely offline.',
      },
      {
        title: 'English reading, French instructions',
        body: 'The child learns to read English. Menus, hints and the parent view are in French too, so you can sit with them.',
      },
      {
        title: 'Readable in bright daylight',
        body: 'High contrast, built and tested on low-end Android.',
      },
    ],
    schoolsLabel: 'Cameroonian schools',
    schoolsSub: 'already in our directory',

    audienceTitle: 'For parents, teachers and schools',
    audiences: [
      {
        title: 'For parents',
        body: 'See progress for your own children only. Nobody else can see them.',
      },
      {
        title: 'For teachers',
        body: 'See only the classes you teach, and nobody else.',
      },
      {
        title: 'For directors',
        body: "See every child in your own school, and never another school's.",
      },
    ],
    audienceNote: 'The teacher and school dashboards are still being built.',

    privacyTitle: 'Privacy and price',
    privacyLead: 'Free while we build.',
    privacyBody: [
      'No account, no password, no payment. We want your feedback, not your money.',
      'We ask for your WhatsApp number or email for one reason: to tell you when the next version is ready. Nothing else.',
      "A child's record is read-only to everyone, including us. Nobody can change what a child did, and we never ask for your home address.",
    ],

    contactTitle: 'Contact and support',
    contactCta: 'Message us on Facebook',
    contactBody:
      'Facebook is where we answer questions and post what changed. It is the fastest way to reach a person.',
    contactReply: 'We usually reply within a day.',

    finalTitle: 'Be one of the first to test LexiaCamer.',
    finalCta: 'Become an early tester',
    finalNote: 'Free. No account needed. Takes a minute.',

    footerBlurb:
      'A reading app for children in Cameroon. Phonics and spelling, offline.',
    footerLanguage: 'Language',
    footerLinks: 'Links',
    footerPrivacy: 'Privacy and price',
    footerFacebook: 'Facebook page',
    footerMade: 'Made in Cameroon',
  },

  fr: {
    langName: 'Français',
    otherLang: 'English',

    navCta: 'Devenir testeur',

    badge: 'Prototype',
    heroTitle: 'Votre enfant peut apprendre à lire en anglais, même sans internet.',
    heroLead:
      "LexiaCamer enseigne les sons des lettres et l'orthographe en anglais. L'application est en français, pour que vous puissiez aider votre enfant même si vous ne lisez pas l'anglais. Gratuit, hors ligne, sans compte.",
    heroCta: 'Devenir testeur',
    heroSecondary: 'Voir ce que voit un enfant',
    reassure: ['Aucun compte', 'Marche hors ligne', 'Gratuit pendant la construction'],

    mockGreeting: 'Salut, Ada',
    mockSub: "Prêt à apprendre aujourd'hui ?",
    mockStats: [
      { value: '12', label: 'Mots' },
      { value: '3', label: 'Série' },
      { value: '45', label: 'Étoiles' },
    ],
    mockTiles: ['Labo des sons', 'Forge des mots', 'Autocollants', 'Réglages'],

    honestTitle: "Ce qui n'est pas encore terminé",
    honestBody1a: 'Les ',
    honestBody1b: "32 sons des lettres ne sont pas encore enregistrés",
    honestBody1c:
      ", donc l'application utilise pour l'instant la voix intégrée de votre téléphone. Sur certains téléphones Android, le son est mauvais ou ne se lance pas du tout. Nous le savons, et nous enregistrons de vraies voix ensuite.",
    honestBody2:
      "L'apprentissage de la lecture en français n'existe pas encore non plus. Aujourd'hui les sons et les mots sont anglais : un enfant qui apprend à lire le français n'y trouvera pas ce qu'il lui faut ici. L'application est traduite ; les leçons ne le sont pas. Le français, c'est ce que nous construisons une fois la version anglaise au point — pour de vrai, avec ses propres sons et ses propres mots, pas une traduction de ceux-ci. Suivez la page et nous vous dirons quand ce sera prêt.",
    honestBody3:
      "Tout le reste mérite votre avis : le jeu d'orthographe, les autocollants, et si un enfant arrive à se repérer seul.",

    howTitle: 'Comment ça marche',
    how: [
      {
        title: "Ouvrez-la sur votre appareil : téléphone, tablette ou ordinateur",
        body: "Rien à installer depuis un magasin d'applications. Elle s'ouvre dans votre navigateur, et vous pouvez l'ajouter à votre écran d'accueil pour l'utiliser comme les autres, même sans données.",
      },
      {
        title: 'Votre enfant joue dix minutes',
        body: "Il touche les lettres pour entendre leur son, construit des mots lettre par lettre, et gagne des étoiles à chaque réussite. Ça ressemble à un jeu, mais il apprend à lire.",
      },
      {
        title: "Vous voyez ce qui a été difficile",
        body: "Une vue parent montre quelles lettres votre enfant rate et quels mots il maîtrise. Personne ne peut modifier ce qu'un enfant a fait, nous y compris.",
      },
    ],

    insideTitle: "Ce qu'il y a dedans",
    inside: [
      {
        title: 'Labo des sons',
        body: "Touchez une lettre, écoutez son son, répétez-le. La base de la lecture.",
      },
      {
        title: 'Forge des mots',
        body: 'Construisez des mots lettre par lettre et gagnez des étoiles.',
      },
      {
        title: 'Autocollants',
        body: "Dépensez vos étoiles pour collectionner. La seule récompense de l'application.",
      },
      {
        title: 'Mode dyslexie',
        body: 'Une police plus ronde avec des lettres plus espacées, en un seul geste.',
      },
    ],

    builtTitle: 'Conçue pour le Cameroun',
    built: [
      {
        title: 'Fonctionne sans données',
        body: 'Après le premier chargement, elle marche entièrement hors ligne.',
      },
      {
        title: "Lecture en anglais, consignes en français",
        body: "L'enfant apprend à lire l'anglais. Les menus, les indices et la vue parent sont aussi en français, pour que vous puissiez l'accompagner.",
      },
      {
        title: 'Lisible en plein soleil',
        body: 'Fort contraste, conçue et testée sur des Android d’entrée de gamme.',
      },
    ],
    schoolsLabel: 'écoles camerounaises',
    schoolsSub: 'déjà dans notre annuaire',

    audienceTitle: 'Pour les parents, les enseignants et les écoles',
    audiences: [
      {
        title: 'Pour les parents',
        body: 'Voyez les progrès de vos propres enfants uniquement. Personne d’autre ne les voit.',
      },
      {
        title: 'Pour les enseignants',
        body: 'Voyez uniquement les classes que vous enseignez, et personne d’autre.',
      },
      {
        title: 'Pour les directeurs',
        body: "Voyez chaque enfant de votre propre école, et jamais ceux d'une autre.",
      },
    ],
    audienceNote:
      "Les tableaux de bord enseignants et écoles sont encore en construction.",

    privacyTitle: 'Confidentialité et prix',
    privacyLead: 'Gratuit pendant que nous construisons.',
    privacyBody: [
      "Aucun compte, aucun mot de passe, aucun paiement. Nous voulons votre avis, pas votre argent.",
      "Nous demandons votre numéro WhatsApp ou votre e-mail pour une seule raison : vous prévenir quand la prochaine version est prête. Rien d'autre.",
      "Le dossier d'un enfant est en lecture seule pour tout le monde, nous y compris. Personne ne peut modifier ce qu'un enfant a fait, et nous ne demandons jamais votre adresse.",
    ],

    contactTitle: 'Contact et aide',
    contactCta: 'Écrivez-nous sur Facebook',
    contactBody:
      "Facebook est l'endroit où nous répondons aux questions et publions les nouveautés. C'est le moyen le plus rapide de joindre quelqu'un.",
    contactReply: "Nous répondons généralement sous un jour.",

    finalTitle: 'Soyez parmi les premiers à tester LexiaCamer.',
    finalCta: 'Devenir testeur',
    finalNote: 'Gratuit. Aucun compte. Ça prend une minute.',

    footerBlurb:
      "Une application de lecture pour les enfants du Cameroun. Sons et orthographe, hors ligne.",
    footerLanguage: 'Langue',
    footerLinks: 'Liens',
    footerPrivacy: 'Confidentialité et prix',
    footerFacebook: 'Page Facebook',
    footerMade: 'Fait au Cameroun',
  },
};

export default landing;

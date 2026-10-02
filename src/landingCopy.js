/**
 * Landing page copy (EN/FR).
 *
 * Kept out of i18n.js on purpose: that file is the child-facing app, this is
 * the page a parent reads before they trust us with a five-year-old. Different
 * audience, different voice, and it changes on a different schedule.
 *
 * Nothing here may be invented. Every feature named is in the app today, every
 * number is counted from the app (34 recorded sounds, two pronunciations), and
 * every link reaches something real. A parent who taps a dead link, or finds a
 * promised feature missing, concludes the whole thing is fake, which is the
 * opposite of what this page exists to do.
 *
 * The audience is any parent, not only parents in Cameroon. The local words
 * stay, because they are what makes the app different, but the copy never says
 * the app is only for one country. "Made in Cameroon" in the footer is the one
 * place the country is named as ours.
 *
 * The French needs a review by a native speaker before it is final.
 */

export const FACEBOOK_URL =
  'https://web.facebook.com/profile.php?id=61594568422185';

// Letters on the hero card and the Standard/Native board. Each one has a clip
// in every folder it is played from (see letterSounds.js).
export const HERO_LETTERS = ['a', 'b', 'sh'];
export const BOARD_LETTERS = ['a', 'o', 'u', 'r'];

const landing = {
  en: {
    otherLang: 'Français',
    navCta: 'Start learning',

    eyebrow: 'Listen · Sound it out · Read',
    heroTitleA: 'Your child can learn to read in English, ',
    heroTitleB: 'even with no data.',
    heroLead:
      'Every letter sound is recorded by a real voice, not a robot. Your child taps a letter, hears it, sounds out words like koki and Kribi, then spells them.',
    heroCta: 'Start learning',
    heroSecondary: 'See how it works',
    reassure: ['Free', 'Works offline after the first visit', 'No account needed'],
    heroAlt: 'Two smiling children at a school desk, one writing with a pencil',
    hearTitle: 'Hear the sounds',
    hearSub: 'Tap a letter',
    playSound: 'Play the sound',

    storyTitle: 'Why this app exists',
    storyLead:
      "My niece couldn't read or spell. She failed her exams and had to stay behind while her friends moved up a class.",
    story: [
      "People started saying she wasn't smart. You could feel it in the way they looked at her, and in how she was compared to her cousins. She went quiet at family gatherings, and sometimes at school.",
      "She wasn't the problem. Nobody had taught her the sounds that letters make.",
      "So I built LexiaCamer and recorded every letter sound in my own voice. She plays with it almost every day. She isn't perfect yet. Long words still trip her up. But she has caught up a lot, she's livelier and more confident, and now she teaches her little sister in nursery school the alphabet.",
    ],

    howTitle: 'Ten minutes a day',
    steps: [
      {
        title: 'Hear it.',
        body: 'Tap a letter in Phonics Lab and hear its sound.',
        img: 'phonics-lab',
        alt: 'The Phonics Lab screen: a grid of letter tiles',
      },
      {
        title: 'Sound it out.',
        body: 'Letters appear as tiles: S, U, N. Tap each one, press Say it fast, then pick the picture.',
        img: 'sound-it-out',
        alt: 'The Sound It Out screen: three letter tiles and three pictures',
      },
      {
        title: 'Spell it.',
        body: 'In Word Forge your child hears a word, like ndolé or Yaoundé, and builds it letter by letter.',
        img: 'word-forge',
        alt: 'The Word Forge screen: empty letter boxes and a keyboard',
      },
    ],
    stickersTitle: 'Collect stickers.',
    stickersBody: 'Every right answer earns a star to spend in the Sticker Book.',

    diffTitle: 'Hear the difference',
    diffBody:
      'Some letters sound different in local words and names than in standard English. Switch between the two in Settings and hear both, in the same voice.',
    diffFacts: ['34 sounds', '2 pronunciations'],
    diffStandard: 'Standard',
    diffNative: 'Native',

    parentsTitle: 'For parents',
    parents: [
      {
        title: 'See how your child is doing',
        body: 'Sign in with a code sent to your email. See how many words your child has built and the sounds they find hard.',
      },
      {
        title: "Your child's data stays safe",
        body: 'Nothing leaves the phone unless you sign in and agree, and your child is asked too. You can download or delete everything any time.',
      },
    ],

    realTitle: 'Made for real life',
    real: [
      'Works with no internet after the first visit.',
      'Made for low-cost Android phones and bright sunlight.',
      'Words children recognise, like ndolé, puff-puff and Yaoundé, alongside everyday English.',
      'Menus, hints and the parent screens in English and French. French reading lessons come later.',
      'Dyslexia mode: rounder letters and wider spacing, one tap away.',
    ],

    price:
      'The reading games are free, with no account needed. Some features we add later may cost something. The reading games will stay free.',

    finalTitle: 'Hand your child the phone. Start with the first letter.',
    finalCta: 'Start learning now',
    questions: 'Questions?',
    facebookCta: 'Visit our page on Facebook',

    footerPrivacy: 'Privacy',
    footerFacebook: 'Facebook page',
    footerMade: 'Made in Cameroon',
  },

  fr: {
    otherLang: 'English',
    navCta: 'Commencer',

    eyebrow: 'Écouter · Assembler les sons · Lire',
    heroTitleA: 'Votre enfant peut apprendre à lire en anglais, ',
    heroTitleB: 'même sans données.',
    heroLead:
      "Chaque son de lettre est enregistré par une vraie voix, pas un robot. Votre enfant touche une lettre, l'entend, assemble les sons de mots comme koki et Kribi, puis les épelle.",
    heroCta: 'Commencer',
    heroSecondary: 'Voir comment ça marche',
    reassure: ['Gratuit', 'Marche hors ligne après la première visite', 'Aucun compte'],
    heroAlt: "Deux enfants souriants à un pupitre, l'un écrit au crayon",
    hearTitle: 'Écoutez les sons',
    hearSub: 'Touchez une lettre',
    playSound: 'Écouter le son',

    storyTitle: 'Pourquoi cette application existe',
    storyLead:
      "Ma nièce ne savait ni lire ni écrire. Elle a échoué à ses examens et a dû redoubler pendant que ses amis passaient en classe supérieure.",
    story: [
      "Les gens ont commencé à dire qu'elle n'était pas intelligente. On le sentait dans leur regard, et dans la façon dont on la comparait à ses cousins. Elle se taisait aux réunions de famille, et parfois à l'école.",
      "Le problème, ce n'était pas elle. Personne ne lui avait appris les sons des lettres.",
      "Alors j'ai créé LexiaCamer et enregistré chaque son de lettre avec ma propre voix. Elle joue avec presque tous les jours. Elle n'est pas encore parfaite : les mots longs la font encore trébucher. Mais elle a beaucoup rattrapé son retard, elle est plus vive et plus sûre d'elle, et maintenant elle apprend l'alphabet à sa petite sœur, qui est à la maternelle.",
    ],

    howTitle: 'Dix minutes par jour',
    steps: [
      {
        title: 'Écouter.',
        body: 'Touchez une lettre dans le Labo Phonique et écoutez son son.',
        img: 'phonics-lab',
        alt: "L'écran du Labo Phonique : une grille de tuiles de lettres",
      },
      {
        title: 'Assembler les sons.',
        body: 'Les lettres apparaissent en tuiles : S, U, N. Touchez chacune, appuyez sur Dis-le vite, puis choisissez l’image.',
        img: 'sound-it-out',
        alt: "L'écran Lis les sons : trois tuiles de lettres et trois images",
      },
      {
        title: 'Épeler.',
        body: 'Dans la Forge de Mots, votre enfant entend un mot, comme ndolé ou Yaoundé, et le construit lettre par lettre.',
        img: 'word-forge',
        alt: "L'écran de la Forge de Mots : des cases vides et un clavier",
      },
    ],
    stickersTitle: 'Collectionner des autocollants.',
    stickersBody: "Chaque bonne réponse rapporte une étoile à dépenser dans l'Album d'Autocollants.",

    diffTitle: 'Entendez la différence',
    diffBody:
      "Certaines lettres ne se prononcent pas pareil dans les mots et les noms d'ici qu'en anglais standard. Passez de l'un à l'autre dans les Réglages et écoutez les deux, avec la même voix.",
    diffFacts: ['34 sons', '2 prononciations'],
    diffStandard: 'Standard',
    diffNative: 'Native',

    parentsTitle: 'Pour les parents',
    parents: [
      {
        title: 'Suivez les progrès de votre enfant',
        body: "Connectez-vous avec un code envoyé à votre e-mail. Voyez combien de mots votre enfant a construits et les sons qui lui posent problème.",
      },
      {
        title: 'Les données de votre enfant restent protégées',
        body: "Rien ne quitte le téléphone sans que vous vous connectiez et donniez votre accord, et votre enfant est consulté aussi. Vous pouvez tout télécharger ou tout supprimer à tout moment.",
      },
    ],

    realTitle: 'Pensée pour la vraie vie',
    real: [
      'Marche sans internet après la première visite.',
      "Pensée pour les téléphones Android à petit prix et le plein soleil.",
      "Des mots que les enfants connaissent, comme ndolé, puff-puff et Yaoundé, à côté de l'anglais de tous les jours.",
      "Menus, indices et écrans parents en anglais et en français. Les leçons de lecture en français viendront plus tard.",
      'Mode dyslexie : des lettres plus rondes et plus espacées, en un geste.',
    ],

    price:
      "Les jeux de lecture sont gratuits, sans compte. Certaines fonctions ajoutées plus tard pourront être payantes. Les jeux de lecture resteront gratuits.",

    finalTitle: 'Donnez le téléphone à votre enfant. Commencez par la première lettre.',
    finalCta: 'Commencer maintenant',
    questions: 'Des questions ?',
    facebookCta: 'Visitez notre page Facebook',

    footerPrivacy: 'Confidentialité',
    footerFacebook: 'Page Facebook',
    footerMade: 'Fait au Cameroun',
  },
};

export default landing;

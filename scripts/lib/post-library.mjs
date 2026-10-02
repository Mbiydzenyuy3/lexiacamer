/**
 * The post library.
 *
 * Every post is written in English and French. The scheduler decides which
 * language each one goes out in (mostly English, about one in four French) and
 * the Page's "Translate posts automatically" setting gives readers of the other
 * language a "See translation" link. The Graph API has no per-post translation
 * switch, so the French text here is a real translation, not a fallback.
 *
 * That is about the POSTS, not the product. The app teaches reading in English
 * and only its interface is translated, so no post here may imply a child can
 * learn to read French with it.
 *
 * Rules, written down because they are easy to break:
 *
 * 1. NOTHING IS INVENTED. Every feature named is in the app today. A post that
 *    cites a number declares `needs` and is skipped when the data cannot back
 *    it up.
 *
 * 2. MOST POSTS DO NOT ASK FOR ANYTHING. Only posts tagged `ask` carry a call
 *    to action, and the scheduler rations them.
 *
 * 3. THE TIPS MUST BE USEFUL EVEN IF NOBODY OPENS THE APP.
 *
 * 4. EVERY PRODUCT POST SAYS HOW TO FIND IT. A parent who is interested must
 *    not have to scroll the Page looking for the link.
 *
 * 5. THE STOCK PHOTO NEVER SITS NEXT TO THE STORY. Stock photos carry no model
 *    release, so the children in it must never read as users, or as the niece.
 *
 * `card` is [kind, props] for an image, or null for a text post. A text post
 * that contains the link still shows Facebook's preview of the site, which is
 * the landing page's share image.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const SITE = 'https://lexiacamer.vercel.app/';
const TAGS_EN = '#LearnToRead #Phonics #Parenting #Cameroon';
const TAGS_FR = '#ApprendreALire #Phonetique #Parents #Cameroun';

/** How to find it, closing every product post. */
const FIND_EN = `Free, no account. Open ${SITE} in Chrome or Safari, on a phone, a tablet or a computer.`;
const FIND_FR = `Gratuit, sans compte. Ouvrez ${SITE} dans Chrome ou Safari, sur un téléphone, une tablette ou un ordinateur.`;

/**
 * `needs(d)` gates a post on real data. `d` is whatever the generator could
 * actually read; when a table is missing or empty the field is 0 or null, and
 * the post simply does not appear in the batch.
 *
 * `lead` posts open a batch, in this order, before the rotation starts: the
 * announcement first, then how to find it.
 */
export const POSTS = [
  /* ——— The launch. ——— */
  {
    key: 'launch',
    kind: 'product',
    lead: 1,
    card: ['photo', {
      kicker: 'Free · works offline',
      title: 'Your child can learn to read, even with no data.',
      sub: 'Every letter sound recorded by a real voice.',
      fr: { kicker: 'Gratuit · hors ligne', title: 'Votre enfant peut apprendre à lire, même sans données.', sub: 'Chaque son de lettre enregistré par une vraie voix.' },
    }],
    en: `LexiaCamer is ready.

It is a free app that teaches children to read in English, one sound at a time. Every letter sound is recorded by a real voice, not a robot.

Your child taps a letter and hears it, sounds out short words like sun and koki, then spells words like ndolé and Yaoundé.

After the first visit it works with no data. Nothing to download from a store.

${FIND_EN}

${TAGS_EN}`,
    fr: `LexiaCamer est prête.

C'est une application gratuite qui apprend aux enfants à lire en anglais, un son à la fois. Chaque son de lettre est enregistré par une vraie voix, pas un robot.

Votre enfant touche une lettre et l'entend, assemble les sons de petits mots comme sun et koki, puis épelle des mots comme ndolé et Yaoundé.

Après la première visite, elle marche sans données. Rien à télécharger dans un magasin d'applications.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'how-to-find',
    kind: 'product',
    lead: 2,
    card: ['steps', {
      kicker: 'How to find it',
      title: 'Three steps, no app store.',
      steps: [
        'Open Chrome or Safari',
        'Go to lexiacamer.vercel.app',
        'Add it to your home screen',
      ],
      fr: { kicker: 'Comment la trouver', title: 'Trois étapes, sans magasin.', steps: ['Ouvrez Chrome ou Safari', 'Allez sur lexiacamer.vercel.app', "Ajoutez-la à l'écran d'accueil"] },
    }],
    en: `How to find LexiaCamer, step by step.

1. Open Chrome (Android) or Safari (iPhone, iPad).
2. Go to ${SITE} and press Start learning.
3. To keep it like an app: in Chrome, tap the ⋮ menu, then "Add to Home screen" or "Install app". In Safari, tap the Share button, then "Add to Home Screen".

The icon then sits with your other apps. After the first visit it opens with no data.

It works on phones, tablets and computers. No account, no password, no payment.

${TAGS_EN}`,
    fr: `Comment trouver LexiaCamer, étape par étape.

1. Ouvrez Chrome (Android) ou Safari (iPhone, iPad).
2. Allez sur ${SITE} et appuyez sur Commencer.
3. Pour la garder comme une application : dans Chrome, touchez le menu ⋮, puis « Ajouter à l'écran d'accueil » ou « Installer l'application ». Dans Safari, touchez le bouton Partager, puis « Sur l'écran d'accueil ».

L'icône se range alors avec vos autres applications. Après la première visite, elle s'ouvre sans données.

Elle marche sur téléphone, tablette et ordinateur. Aucun compte, aucun mot de passe, aucun paiement.

${TAGS_FR}`,
  },

  /* ——— What is in it, each shown with the real screen. ——— */
  {
    key: 'real-voice',
    kind: 'product',
    card: ['screen', {
      kicker: 'Phonics Lab',
      title: 'Tap a letter. Hear a real voice.',
      sub: 'All 34 sounds are recorded, not read out by a robot.',
      fr: { kicker: 'Labo Phonique', title: 'Touchez une lettre. Une vraie voix.', sub: 'Les 34 sons sont enregistrés, pas lus par un robot.' },
      shot: 'phonics-lab',
    }],
    en: `Tap a letter. Hear a real voice.

All 34 sounds in LexiaCamer are recorded, not read out by a phone's robot voice. A child hears "mmm" for M and "shhh" for SH, the same way every time.

Some letters sound different in names and words from home than in standard English. In Settings you can switch between Standard and Native pronunciation and hear both, in the same voice.

${FIND_EN}

${TAGS_EN}`,
    fr: `Touchez une lettre. Entendez une vraie voix.

Les 34 sons de LexiaCamer sont enregistrés, pas lus par la voix robot du téléphone. L'enfant entend « mmm » pour le M et « chhh » pour le SH, toujours de la même façon.

Certaines lettres ne se prononcent pas pareil dans les noms et les mots d'ici qu'en anglais standard. Dans les Réglages, vous pouvez passer de la prononciation Standard à la prononciation Native et écouter les deux, avec la même voix.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'sound-it-out',
    kind: 'product',
    card: ['screen', {
      kicker: 'New game',
      title: 'Sound it out, then find the picture.',
      sub: 'The moment separate sounds turn into a word is reading.',
      fr: { kicker: 'Nouveau jeu', title: "Assemble les sons, trouve l'image.", sub: 'Quand des sons séparés deviennent un mot, c\'est la lecture.' },
      shot: 'sound-it-out',
    }],
    en: `New game: Sound It Out.

A short word appears as letter tiles: S, U, N. Your child taps each tile to hear its sound, presses "Say it fast" so the sounds run together, then picks the matching picture.

That moment, when separate sounds turn into a word, is reading.

A wrong picture plays the sounds again. After two tries the right picture glows, so a child playing alone is never stuck.

${FIND_EN}

${TAGS_EN}`,
    fr: `Nouveau jeu : Lis les sons.

Un petit mot apparaît en tuiles de lettres : S, U, N. Votre enfant touche chaque tuile pour entendre son son, appuie sur « Dis-le vite » pour que les sons s'enchaînent, puis choisit l'image qui correspond.

Ce moment, où des sons séparés deviennent un mot, c'est la lecture.

Une mauvaise image fait rejouer les sons. Après deux essais, la bonne image s'illumine : un enfant qui joue seul n'est jamais bloqué.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'word-forge',
    kind: 'product',
    card: ['screen', {
      kicker: 'Word Forge',
      title: 'Spelling with words they already know.',
      sub: 'Ndolé, puff-puff, Yaoundé, Kribi, and everyday English.',
      fr: { kicker: 'Forge de Mots', title: "Épeler avec des mots qu'ils connaissent.", sub: "Ndolé, puff-puff, Yaoundé, Kribi, et l'anglais de tous les jours." },
      shot: 'word-forge',
    }],
    en: `Spelling with words they already know.

In Word Forge your child hears a word and builds it letter by letter: ndolé, puff-puff, Yaoundé, Kribi, alongside everyday English words like fish, rain and bread.

A word from their own life is easier to care about. Every right answer earns a star to spend in the Sticker Book.

${FIND_EN}

${TAGS_EN}`,
    fr: `Épeler avec des mots qu'ils connaissent déjà.

Dans la Forge de Mots, votre enfant entend un mot et le construit lettre par lettre : ndolé, puff-puff, Yaoundé, Kribi, à côté de mots anglais de tous les jours comme fish, rain et bread.

Un mot de sa propre vie compte plus pour un enfant. Chaque bonne réponse rapporte une étoile à dépenser dans l'Album d'Autocollants.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'offline',
    kind: 'product',
    card: ['statement', {
      kicker: 'Works offline',
      title: 'No data? They can still read.',
      sub: 'After the first visit, LexiaCamer works with no internet at all.',
      fr: { kicker: 'Hors ligne', title: 'Pas de données ? Ils peuvent quand même lire.', sub: 'Après la première visite, LexiaCamer marche sans internet.' },
    }],
    en: `No data? They can still read.

Most reading apps stop the moment the signal does. LexiaCamer loads once, and after that it works with no internet: the letter sounds, the games, the stars, all of it.

On the bus, in the village, at 11pm when the data bundle is finished.

${FIND_EN}

${TAGS_EN}`,
    fr: `Pas de données ? Ils peuvent quand même lire.

La plupart des applications de lecture s'arrêtent dès que le signal tombe. LexiaCamer se charge une fois, et ensuite elle marche sans internet : les sons des lettres, les jeux, les étoiles, tout.

Dans le bus, au village, à 23h quand le forfait est fini.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'devices',
    kind: 'product',
    card: null,
    en: `Phone, tablet or the family computer: LexiaCamer works on all of them.

Many children find a bigger screen easier, so hand them the tablet if you have one. It runs in the browser, so it works on Android and on iPhone and iPad alike, with nothing to install from a store.

${FIND_EN}

${TAGS_EN}`,
    fr: `Téléphone, tablette ou ordinateur familial : LexiaCamer marche sur tous.

Beaucoup d'enfants trouvent un grand écran plus facile : si vous avez une tablette, donnez-la-leur. Elle s'ouvre dans le navigateur, donc elle marche aussi bien sur Android que sur iPhone et iPad, sans rien installer depuis un magasin.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'parents',
    kind: 'product',
    card: ['statement', {
      kicker: 'For parents',
      title: 'See the sounds your child finds hard.',
      sub: 'And download or delete everything, any time.',
      fr: { kicker: 'Pour les parents', title: 'Voyez les sons qui lui posent problème.', sub: 'Et téléchargez ou supprimez tout, à tout moment.' },
    }],
    en: `For parents: see how your child is doing.

Sign in with a code sent to your email and the dashboard shows how many words your child has built and which sounds they keep missing. That tells you what to practise together tonight.

Nothing leaves the phone unless you sign in and agree, and your child is asked too. You can download everything, or delete it, whenever you want.

${FIND_EN}

${TAGS_EN}`,
    fr: `Pour les parents : suivez les progrès de votre enfant.

Connectez-vous avec un code envoyé à votre e-mail, et le tableau de bord montre combien de mots votre enfant a construits et quels sons il rate encore. Vous savez ainsi quoi travailler ensemble ce soir.

Rien ne quitte le téléphone sans que vous vous connectiez et donniez votre accord, et votre enfant est consulté aussi. Vous pouvez tout télécharger, ou tout supprimer, quand vous voulez.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'free',
    kind: 'product',
    card: ['statement', {
      kicker: 'The price',
      title: 'The reading games are free, and will stay free.',
      sub: 'No account needed.',
      fr: { kicker: 'Le prix', title: 'Les jeux de lecture sont gratuits, et le resteront.', sub: 'Aucun compte.' },
    }],
    en: `A straight answer about the price.

The reading games are free, with no account needed. Some features we add later may cost something. The reading games will stay free.

No adverts in it, and nothing about your child sold to anyone.

${FIND_EN}

${TAGS_EN}`,
    fr: `Une réponse claire sur le prix.

Les jeux de lecture sont gratuits, sans compte. Certaines fonctions ajoutées plus tard pourront être payantes. Les jeux de lecture resteront gratuits.

Aucune publicité, et rien sur votre enfant n'est vendu à personne.

${FIND_FR}

${TAGS_FR}`,
  },

  // A text post on purpose: no picture may sit beside this story (rule 5).
  {
    key: 'story',
    kind: 'story',
    card: null,
    en: `Why this app exists.

My niece couldn't read or spell. She failed her exams and had to stay behind while her friends moved up a class.

People started saying she wasn't smart. You could feel it in the way they looked at her. She went quiet at family gatherings, and sometimes at school.

She wasn't the problem. Nobody had taught her the sounds that letters make.

So I built LexiaCamer and recorded every letter sound in my own voice. She plays with it almost every day. Long words still trip her up. But she has caught up a lot, she's livelier and more confident, and now she teaches her little sister in nursery school the alphabet.

If a child you love is where she was, it is free: ${SITE}

${TAGS_EN}`,
    fr: `Pourquoi cette application existe.

Ma nièce ne savait ni lire ni écrire. Elle a échoué à ses examens et a dû redoubler pendant que ses amis passaient en classe supérieure.

Les gens ont commencé à dire qu'elle n'était pas intelligente. On le sentait dans leur regard. Elle se taisait aux réunions de famille, et parfois à l'école.

Le problème, ce n'était pas elle. Personne ne lui avait appris les sons des lettres.

Alors j'ai créé LexiaCamer et enregistré chaque son de lettre avec ma propre voix. Elle joue avec presque tous les jours. Les mots longs la font encore trébucher. Mais elle a beaucoup rattrapé son retard, elle est plus vive et plus sûre d'elle, et maintenant elle apprend l'alphabet à sa petite sœur, qui est à la maternelle.

Si un enfant que vous aimez en est là où elle en était, c'est gratuit : ${SITE}

${TAGS_FR}`,
  },

  {
    key: 'english-reading',
    kind: 'product',
    card: ['statement', {
      kicker: 'English reading',
      title: 'They read English. You can follow in French.',
      sub: 'The menus, hints and parent screens are in French too.',
      fr: { kicker: 'Lecture en anglais', title: 'Ils lisent en anglais. Vous suivez en français.', sub: 'Menus, indices et écrans parents aussi en français.' },
    }],
    en: `Worth being clear about, because plenty of apps are not.

LexiaCamer teaches a child to read in ENGLISH. The letter sounds, the words they build, the games: all English.

What is in French is the app around it: the menus, the hints, the parent screens. So a parent who does not read English can still sit beside their child and help.

French reading lessons come later. Until then, we would rather say so than waste your time.

${FIND_EN}

${TAGS_EN}`,
    fr: `À dire clairement, parce que beaucoup d'applications ne le font pas.

LexiaCamer apprend à votre enfant à lire en ANGLAIS. Les sons des lettres, les mots qu'il construit, les jeux : tout est en anglais.

Ce qui est en français, c'est l'application autour : les menus, les indices, les écrans parents. Ainsi un parent qui ne lit pas l'anglais peut quand même s'asseoir à côté de son enfant et l'aider.

Les leçons de lecture en français viendront plus tard. D'ici là, nous préférons le dire plutôt que de vous faire perdre du temps.

${FIND_FR}

${TAGS_FR}`,
  },

  {
    key: 'dyslexia',
    kind: 'product',
    card: ['statement', {
      kicker: 'One tap',
      title: 'If the letters keep moving, change them.',
      sub: 'Dyslexia mode: a rounder font and wider spacing.',
      fr: { kicker: 'Un geste', title: 'Si les lettres bougent, changez-les.', sub: 'Mode dyslexie : une police plus ronde et plus espacée.' },
    }],
    en: `Some children are not being careless. The letters genuinely will not sit still.

LexiaCamer has a dyslexia mode: one tap changes the whole app to a rounder font with wider spacing between letters.

It will not fix everything. For some children it makes the difference between trying and giving up, and it costs nothing to turn on and see.

${FIND_EN}

${TAGS_EN}`,
    fr: `Certains enfants ne sont pas distraits. Les lettres refusent vraiment de tenir en place.

LexiaCamer a un mode dyslexie : une seule pression change toute l'application pour une police plus ronde, avec des lettres plus espacées.

Cela ne règle pas tout. Pour certains enfants, c'est la différence entre essayer et abandonner, et l'activer pour voir ne coûte rien.

${FIND_FR}

${TAGS_FR}`,
  },

  /* ——— Tips. The reason to follow the page at all. ——— */
  {
    key: 'tip-sound-not-name',
    kind: 'tip',
    card: ['tip', {
      title: 'Say "mmm", not "em".',
      sub: 'A child who learns letter names first has to unlearn them to read.',
      fr: { kicker: 'Astuce lecture', title: 'Dites «\u00a0mmm\u00a0», pas «\u00a0èm\u00a0».', sub: "Un enfant qui apprend d'abord les noms des lettres doit les désapprendre pour lire." },
    }],
    en: `A small thing that makes a big difference.

When you point at M, say the sound, "mmm", not the name, "em".

A child who knows the names says "em-ay-tee" and cannot get to "mat". A child who knows the sounds says "mmm-aaa-t" and hears the word appear.

Letter names matter later, for spelling out loud. Sounds come first.

Try it tonight with three letters: M, A, T. That is a whole word.

${TAGS_EN}`,
    fr: `Un petit détail qui change tout.

Quand vous montrez le M, dites le son, « mmm », pas le nom, « èm ».

Un enfant qui connaît les noms dit « èm-a-té » et n'arrive jamais à « mat ». Un enfant qui connaît les sons dit « mmm-aaa-t » et entend le mot apparaître.

Les noms des lettres serviront plus tard, pour épeler à voix haute. Les sons d'abord.

Essayez ce soir avec trois lettres : M, A, T. Cela fait déjà un mot.

${TAGS_FR}`,
  },
  {
    key: 'tip-ten-minutes',
    kind: 'tip',
    card: null,
    en: `Ten minutes a day beats an hour on Sunday.

Reading is a habit before it is a skill. A child who reads a little every day builds something; a child who does an hour once a week mostly builds a memory of being tired.

Pick a time that already exists, after supper or before bed, and keep it short enough that they want to come back.

Stop while they are still enjoying it. That is the trick nobody tells you.

${TAGS_EN}`,
    fr: `Dix minutes par jour valent mieux qu'une heure le dimanche.

La lecture est une habitude avant d'être une compétence. Un enfant qui lit un peu chaque jour construit quelque chose ; un enfant qui fait une heure par semaine construit surtout le souvenir d'être fatigué.

Choisissez un moment qui existe déjà, après le repas ou avant le coucher, et gardez-le assez court pour qu'il ait envie de revenir.

Arrêtez pendant qu'il s'amuse encore. C'est l'astuce que personne ne dit.

${TAGS_FR}`,
  },
  {
    key: 'tip-blend',
    kind: 'tip',
    card: ['tip', {
      title: 'Stretch the word, do not chop it.',
      sub: '"Sssuuun" is easier to hear than "s - u - n".',
      fr: { kicker: 'Astuce lecture', title: 'Étirez le mot, ne le découpez pas.', sub: '«\u00a0Sssuuun\u00a0» s\'entend mieux que «\u00a0s - u - n\u00a0».' },
    }],
    en: `If your child can say each sound but cannot hear the word, try this.

Stretch it instead of chopping it.

Not "s, u, n", with gaps. Say "sssuuunnn", one long breath, and let the word fall out at the end.

The gaps are what make it hard. Stretching does the joining for them, and then one day they do it without you. It is exactly what the "Say it fast" button in Sound It Out does.

${TAGS_EN}`,
    fr: `Si votre enfant dit chaque son mais n'entend pas le mot, essayez ceci.

Étirez-le au lieu de le découper.

Pas « s, u, n », avec des silences. Dites « sssuuunnn », d'un seul souffle, et laissez le mot tomber à la fin.

Ce sont les silences qui rendent la tâche difficile. En étirant, vous faites le lien pour lui, et un jour il le fait sans vous. C'est exactement ce que fait le bouton « Dis-le vite » dans Lis les sons.

${TAGS_FR}`,
  },

  /* ——— The ask. Rationed by the scheduler. ——— */
  {
    key: 'ask-share',
    kind: 'ask',
    ask: true,
    card: ['cta', {
      title: 'Know a child who is struggling to read?',
      sub: 'Send this to their parent. It is free.',
      fr: { kicker: 'Gratuit · sans compte', title: 'Un enfant a du mal à lire ?', sub: 'Envoyez ceci à ses parents. C\'est gratuit.' },
    }],
    en: `Do you know a child who is struggling to read?

Send this to their parent. LexiaCamer is free, needs no account, and works with no data after the first visit. Ten minutes a day is enough to start.

${SITE}

${TAGS_EN}`,
    fr: `Vous connaissez un enfant qui a du mal à lire ?

Envoyez ceci à ses parents. LexiaCamer est gratuite, sans compte, et marche sans données après la première visite. Dix minutes par jour suffisent pour commencer.

${SITE}

${TAGS_FR}`,
  },
  {
    key: 'ask-feedback',
    kind: 'ask',
    ask: true,
    card: null,
    en: `Tried LexiaCamer with your child? Tell us what happened.

There is a feedback button on every screen of the app. What confused them, what made them laugh, which word they could not get: every message is read by a person, and it decides what we build next.

${SITE}

${TAGS_EN}`,
    fr: `Vous avez essayé LexiaCamer avec votre enfant ? Racontez-nous.

Il y a un bouton d'avis sur chaque écran de l'application. Ce qui l'a perdu, ce qui l'a fait rire, le mot qu'il n'arrivait pas à trouver : chaque message est lu par une personne, et c'est lui qui décide de la suite.

${SITE}

${TAGS_FR}`,
  },

  /* ——— Data-backed. Skipped entirely until the numbers are real. ——— */
  {
    key: 'fixed-from-feedback',
    kind: 'data',
    needs: (d) => d.feedback >= 5,
    card: (d) => ['stat', {
      value: String(d.feedback),
      label: 'messages from parents and children',
      sub: 'Every one of them read by a person.',
    }],
    en: (d) => `${d.feedback} messages so far, and every one read by a person.

They come from the feedback button on every screen, and they decide what changes next. Not a plan we wrote months ago.

If something annoyed you, or your child, tell us. Nothing is too small.

${SITE}

${TAGS_EN}`,
    fr: (d) => `${d.feedback} messages pour l'instant, et chacun lu par une personne.

Ils viennent du bouton d'avis présent sur chaque écran, et ce sont eux qui décident de la suite. Pas un plan écrit il y a des mois.

Si quelque chose vous a agacé, vous ou votre enfant, dites-le-nous. Rien n'est trop petit.

${SITE}

${TAGS_FR}`,
  },
];


/* ————————————————————————————————————————————————————————————
   THE DAILY SOUND
   ————————————————————————————————————————————————————————————
   One post per letter, generated from the app's own phonicsData.

   These exist because a page cannot build an audience posting twice a week,
   and eight posts is not enough to post more often than that. The constraint
   was never how much effort a person has -- the posts are generated -- it was
   how many posts existed. There are 32 sounds in the app, each of which is a
   parent learning one real thing they can use tonight, so there are 32 posts.

   They are deliberately small. A page needs a rhythm more than it needs eight
   essays, and a short post that teaches "say mmm, not em" earns more goodwill
   than a long one about features.

   Generated from the source of truth rather than written out, so a sound added
   to the app appears here and a sound corrected there is corrected here.
———————————————————————————————————————————————————————————— */

function readPhonics() {
  const src = readFileSync(resolve(import.meta.dirname, '../../src/i18n.js'), 'utf8');
  const from = src.indexOf('export const phonicsData');
  const body = src.slice(from, src.indexOf('\n];', from));
  return body.split('{').slice(1).map((e) => {
    const get = (k) => (e.match(new RegExp(`${k}: "([^"]+)"`)) || [])[1] || '';
    return { letter: get('letter'), sound: get('sound'), example: get('example'), category: get('category') };
  }).filter((x) => x.letter);
}

/** How to say it, and the trap to avoid. Only the awkward ones are named. */
const SAY_EN = {
  A: 'Short, as in "cat" — not the letter name "ay".',
  E: 'Short, as in "bed" — not "ee".',
  I: 'Short, as in "sit" — not "eye".',
  O: 'Short, as in "hot" — not "oh".',
  U: 'Short, as in "cup" — not "you".',
  B: 'Keep it short. "buh" makes "bat" sound like "buh-a-tuh".',
  D: 'Keep it short. Not "duh".',
  K: 'Keep it short. Not "kuh".',
  P: 'Keep it short. Not "puh".',
  T: 'Keep it short. Not "tuh".',
  G: 'Hard, as in "go".',
  C: 'The hard "k" sound, as in "cat".',
  F: 'You can hold this one: "ffff". Stretching helps a child hear it.',
  L: 'You can hold this one: "llll".',
  M: 'You can hold this one: "mmmm".',
  N: 'You can hold this one: "nnnn".',
  S: 'You can hold this one: "ssss".',
  Z: 'You can hold this one: "zzzz".',
  R: 'You can hold this one: "rrrr".',
  H: 'Just the breath. Almost nothing.',
  NG: 'The sound at the END of "sing" — not "en-gee".',
  ND: 'One sound, not "en-dee". Listen for it in Ndolé.',
  MB: 'One sound, not "em-bee". Listen for it in Mbang.',
  NK: 'One sound, not "en-kay". Listen for it in Nkongsamba.',
  TH: 'Tongue between the teeth, as in "this".',
  PH: 'Says "f". Same sound as the letter F.',
  SH: 'You can hold this one: "shhh".',
  CH: 'As in "church".',
};

const SAY_FR = {
  A: 'Court, comme dans « cat » — pas le nom de la lettre.',
  E: 'Court, comme dans « bed » — pas « i ».',
  I: 'Court, comme dans « sit ».',
  O: 'Court, comme dans « hot ».',
  U: 'Court, comme dans « cup ».',
  B: 'Gardez-le court. « beu » transforme « bat » en « beu-a-teu ».',
  D: 'Gardez-le court. Pas « deu ».',
  K: 'Gardez-le court. Pas « keu ».',
  P: 'Gardez-le court. Pas « peu ».',
  T: 'Gardez-le court. Pas « teu ».',
  G: 'Dur, comme dans « go ».',
  C: 'Le son dur « k », comme dans « cat ».',
  F: 'Celui-ci se tient : « ffff ». L\'étirer aide l\'enfant à l\'entendre.',
  L: 'Celui-ci se tient : « llll ».',
  M: 'Celui-ci se tient : « mmmm ».',
  N: 'Celui-ci se tient : « nnnn ».',
  S: 'Celui-ci se tient : « ssss ».',
  Z: 'Celui-ci se tient : « zzzz ».',
  R: 'Celui-ci se tient : « rrrr ».',
  H: 'Juste le souffle. Presque rien.',
  NG: 'Le son à la FIN de « sing » — pas « èn-gé ».',
  ND: 'Un seul son, pas « èn-dé ». Écoutez-le dans Ndolé.',
  MB: 'Un seul son, pas « èm-bé ». Écoutez-le dans Mbang.',
  NK: 'Un seul son, pas « èn-ka ». Écoutez-le dans Nkongsamba.',
  TH: 'La langue entre les dents, comme dans « this ».',
  PH: 'Se dit « f ». Le même son que la lettre F.',
  SH: 'Celui-ci se tient : « shhh ».',
  CH: 'Comme dans « church ».',
};

export const SOUND_POSTS = readPhonics().map((s) => ({
  key: `sound-${s.letter.toLowerCase()}`,
  kind: 'sound',
  card: ['sound', {
    kicker: 'Sound of the day',
    letter: s.letter,
    say: s.sound,
    example: s.example,
    fr: { kicker: 'Le son du jour', sayWord: 'Dites', asIn: 'comme dans', quotes: ['«\u00a0', '\u00a0»'] },
  }],
  en: `Today's sound: ${s.letter}

Say "${s.sound}" — the sound, not the letter's name.

${SAY_EN[s.letter] || `You can hear it in ${s.example}.`}

Point at it once tonight and ask your child what it says. That is the whole exercise.

${TAGS_EN}`,
  fr: `Le son du jour : ${s.letter}

Dites « ${s.sound} » — le son, pas le nom de la lettre.

${SAY_FR[s.letter] || `On l'entend dans ${s.example}.`}

Montrez-la une fois ce soir et demandez à votre enfant ce qu'elle dit. C'est tout l'exercice.

${TAGS_FR}`,
}));

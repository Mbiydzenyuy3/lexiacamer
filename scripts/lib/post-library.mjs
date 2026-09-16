/**
 * The post library.
 *
 * Every post is written in English and French, because most of the audience
 * reads French and a page that posts only in English quietly excludes them.
 *
 * That is about the POSTS, not the product. The app teaches reading in English
 * and only its interface is translated, so no post here may imply a child can
 * learn to read French with it. Writing to someone in their language while
 * misdescribing what they would get is worse than not writing to them at all.
 *
 * Three rules hold this file together. They are easy to break and expensive to
 * break, so they are written down rather than assumed:
 *
 * 1. NOTHING IS INVENTED. A post that cites a number declares `needs`, and is
 *    skipped entirely when the data does not support it. There is no "about
 *    50" and no rounding up. The page is selling trustworthiness to parents;
 *    one made-up figure that someone checks costs more than every post here
 *    earns.
 *
 * 2. MOST POSTS DO NOT ASK FOR ANYTHING. Only posts tagged `ask` carry a call
 *    to action, and the scheduler keeps them to roughly one in three. A page
 *    that asks every time reads as an advert and people stop seeing it.
 *
 * 3. THE TIPS MUST BE USEFUL EVEN IF NOBODY INSTALLS ANYTHING. A parent who
 *    gets one good idea for helping their child read owes you attention. A
 *    parent who gets a feature list owes you nothing.
 */

export const SITE = 'https://lexiacamer.vercel.app/';
const TAGS_EN = '#Cameroon #LearnToRead #Phonics #Parenting';
const TAGS_FR = '#Cameroun #ApprendreALire #Phonetique #Parents';

/**
 * `needs(d)` gates a post on real data. `d` is whatever the generator could
 * actually read; when a table is missing or empty the field is 0 or null, and
 * the post simply does not appear in the batch.
 */
export const POSTS = [
  /* ——— The differentiator. Lead with this. ——— */
  {
    key: 'offline',
    kind: 'evergreen',
    card: ['statement', {
      kicker: 'Works offline',
      title: 'No data? She can still read.',
      sub: 'Once LexiaCamer loads the first time, it keeps working with no internet at all.',
    }],
    en: `No data? She can still read.

A lot of Cameroon has weak network, and most reading apps stop the moment the signal does.

LexiaCamer loads once. After that it works with no internet — the letter sounds, the spelling game, the stars, all of it. On the bus, in the village, at 11pm when the data bundle is finished.

Free while we build it: ${SITE}

${TAGS_EN}`,
    fr: `Pas de connexion ? Elle peut quand même lire.

Une grande partie du Cameroun a un réseau faible, et la plupart des applications de lecture s'arrêtent dès que le signal tombe.

LexiaCamer se charge une fois. Ensuite, elle fonctionne sans internet — les sons des lettres, le jeu d'orthographe, les étoiles, tout. Dans le bus, au village, à 23h quand le forfait est fini.

Gratuit pendant que nous la construisons : ${SITE}

${TAGS_FR}`,
  },

  /* ——— Tips. The reason to follow the page at all. ——— */
  {
    key: 'tip-sound-not-name',
    kind: 'tip',
    card: ['tip', {
      title: 'Say "mmm", not "em".',
      sub: 'A child who learns letter names first has to unlearn them to read.',
    }],
    en: `A small thing that makes a big difference.

When you point at M, say the sound — "mmm" — not the name, "em".

A child who knows the names says "em-ay-tee" and cannot get to "mat". A child who knows the sounds says "mmm-aaa-t" and hears the word appear.

Letter names matter later, for spelling out loud. Sounds come first.

Try it tonight with three letters: M, A, T. That is a whole word.

${TAGS_EN}`,
    fr: `Un petit détail qui change tout.

Quand vous montrez le M, dites le son — « mmm » — pas le nom, « èm ».

Un enfant qui connaît les noms dit « èm-a-té » et n'arrive jamais à « mat ». Un enfant qui connaît les sons dit « mmm-aaa-t » et entend le mot apparaître.

Les noms des lettres serviront plus tard, pour épeler à voix haute. Les sons d'abord.

Essayez ce soir avec trois lettres : M, A, T. Cela fait déjà un mot.

${TAGS_FR}`,
  },
  {
    key: 'tip-ten-minutes',
    kind: 'tip',
    card: ['tip', {
      title: 'Ten minutes beats an hour on Sunday.',
      sub: 'Reading is a habit before it is a skill.',
    }],
    en: `Ten minutes a day beats an hour on Sunday.

Reading is a habit before it is a skill. A child who reads a little every day builds something; a child who does an hour once a week mostly builds a memory of being tired.

Pick a time that already exists — after supper, before bed — and keep it short enough that they want to come back.

Stop while they are still enjoying it. That is the trick nobody tells you.

${TAGS_EN}`,
    fr: `Dix minutes par jour valent mieux qu'une heure le dimanche.

La lecture est une habitude avant d'être une compétence. Un enfant qui lit un peu chaque jour construit quelque chose ; un enfant qui fait une heure par semaine construit surtout le souvenir d'être fatigué.

Choisissez un moment qui existe déjà — après le repas, avant le coucher — et gardez-le assez court pour qu'ils aient envie de revenir.

Arrêtez pendant qu'ils s'amusent encore. C'est l'astuce que personne ne dit.

${TAGS_FR}`,
  },
  {
    key: 'tip-blend',
    kind: 'tip',
    card: ['tip', {
      title: 'Stretch the word, do not chop it.',
      sub: '"Sssuuun" is easier to hear than "s - u - n".',
    }],
    en: `If your child can say each sound but cannot hear the word, try this.

Stretch it instead of chopping it.

Not "s — u — n", with gaps. Say "sssuuunnn", one long breath, and let the word fall out at the end.

The gaps are what make it hard. A child holding three separate sounds in their head has to do the joining themselves. Stretching does the joining for them, and then one day they do it without you.

${TAGS_EN}`,
    fr: `Si votre enfant dit chaque son mais n'entend pas le mot, essayez ceci.

Étirez-le au lieu de le découper.

Pas « s — o — l », avec des silences. Dites « sssooolll », d'un seul souffle, et laissez le mot tomber à la fin.

Ce sont les silences qui rendent la tâche difficile. Un enfant qui garde trois sons séparés en tête doit faire le lien tout seul. En étirant, vous faites le lien pour lui — et un jour, il le fait sans vous.

${TAGS_FR}`,
  },

  /* ——— Honesty. Counter-intuitive, and the most effective thing here. ——— */
  {
    key: 'honest-audio',
    kind: 'honest',
    card: ['honest', {
      title: 'The letter sounds are not recorded yet.',
      sub: 'We would rather tell you now than have you find out.',
    }],
    en: `Something that is not finished, told to you before you find it.

The 34 letter sounds in LexiaCamer are not recorded yet. Right now the app uses your phone's built-in voice, and on some Android phones that sounds wrong — or does not play at all.

We are recording real voices next. Cameroonian voices, saying the sounds the way a teacher here says them.

There is a second gap, and it matters more to some of you: the lessons are English only. The app is translated into French, but the sounds and the words a child practises are English ones. A child learning to read French will not find what they need here yet.

Everything else is worth your opinion today: the spelling game, the stickers, whether a five-year-old can find their way around without help.

If you would rather wait for the sound, wait. If you would rather help us get it right, the door is open: ${SITE}

${TAGS_EN}`,
    fr: `Quelque chose qui n'est pas terminé, dit avant que vous ne le découvriez.

Les 34 sons des lettres de LexiaCamer ne sont pas encore enregistrés. Pour l'instant, l'application utilise la voix intégrée de votre téléphone, et sur certains Android cela sonne faux — ou ne se lance pas du tout.

Nous enregistrons de vraies voix ensuite. Des voix camerounaises, qui prononcent les sons comme un enseignant d'ici.

Il y a un second manque, et il compte davantage pour certains d'entre vous : les leçons sont uniquement en anglais. L'application est traduite en français, mais les sons et les mots que l'enfant travaille sont anglais. Un enfant qui apprend à lire le français n'y trouvera pas encore ce qu'il lui faut.

Tout le reste mérite votre avis dès aujourd'hui : le jeu d'orthographe, les autocollants, et si un enfant de cinq ans arrive à se repérer seul.

Si vous préférez attendre le son, attendez. Si vous préférez nous aider à bien le faire, la porte est ouverte : ${SITE}

${TAGS_FR}`,
    ask: true,
  },

  /* ——— Product, told as a benefit rather than a feature. ——— */
  {
    key: 'english-reading',
    kind: 'evergreen',
    card: ['statement', {
      kicker: 'English reading',
      title: 'Learning to read English, with the app speaking your language.',
      sub: 'The child reads English. The menus and hints are French too, so you can sit with them.',
    }],
    en: `A thing worth being clear about, because plenty of apps are not.

LexiaCamer teaches a child to read in ENGLISH. The letter sounds, the words they build, the spelling game: all English.

What is in French is the app around it. The menus, the hints, the parent view. So a parent who does not read English can still sit beside their child and help, instead of handing over a phone and hoping.

If you are looking for something to teach your child to read in French, this is not it yet, and we will say so rather than take your time.

${SITE}

${TAGS_EN}`,
    fr: `Une chose à dire clairement, parce que beaucoup d'applications ne le font pas.

LexiaCamer apprend à votre enfant à lire en ANGLAIS. Les sons des lettres, les mots qu'il construit, le jeu d'orthographe : tout est en anglais.

Ce qui est en français, c'est l'application autour. Les menus, les indices, la vue parent. Ainsi un parent qui ne lit pas l'anglais peut quand même s'asseoir à côté de son enfant et l'aider, au lieu de tendre un téléphone en espérant.

Si vous cherchez de quoi apprendre à lire en français à votre enfant, ce n'est pas encore ça, et nous préférons le dire plutôt que de vous faire perdre du temps.

${SITE}

${TAGS_FR}`,
  },

  {
    key: 'dyslexia',
    kind: 'evergreen',
    card: ['statement', {
      kicker: 'One tap',
      title: 'If the letters keep moving, change them.',
      sub: 'Dyslexia mode: a rounder font, wider spacing, more room between lines.',
    }],
    en: `Some children are not being careless. The letters genuinely will not sit still.

LexiaCamer has a dyslexia mode: one tap changes the whole app to a rounder font with wider spacing between letters and more room between lines.

It will not fix everything. For some children it makes the difference between trying and giving up, and it costs nothing to turn on and see.

${SITE}

${TAGS_EN}`,
    fr: `Certains enfants ne sont pas distraits. Les lettres refusent vraiment de tenir en place.

LexiaCamer a un mode dyslexie : une seule pression change toute l'application pour une police plus ronde, des lettres plus espacées et plus de place entre les lignes.

Cela ne règle pas tout. Pour certains enfants, c'est la différence entre essayer et abandonner, et l'activer pour voir ne coûte rien.

${SITE}

${TAGS_FR}`,
  },
  {
    key: 'price',
    kind: 'evergreen',
    card: ['statement', {
      kicker: 'No account',
      title: 'No sign-up. No password. No payment.',
      sub: 'Open the link, and your child can start. That is the whole process.',
    }],
    en: `No sign-up. No password. No payment. No app store.

Open the link and your child can start. That is the whole process.

We ask for a WhatsApp number or an email only if you want telling when the next version is ready — and for nothing else. No adverts in it, and nothing sold to anyone.

${SITE}

${TAGS_EN}`,
    fr: `Aucune inscription. Aucun mot de passe. Aucun paiement. Aucun magasin d'applications.

Ouvrez le lien et votre enfant peut commencer. C'est tout le processus.

Nous demandons un numéro WhatsApp ou un e-mail uniquement si vous voulez être prévenu quand la prochaine version est prête — et pour rien d'autre. Aucune publicité, rien de revendu à personne.

${SITE}

${TAGS_FR}`,
  },
  {
    key: 'read-only',
    kind: 'evergreen',
    card: ['statement', {
      kicker: 'A child’s record',
      title: 'Nobody can change what your child did.',
      sub: 'Not their teacher. Not their school. Not us.',
    }],
    en: `A question worth asking of anything that records your child.

In LexiaCamer, a child's record is read-only to everyone. Their teacher can see it. Their school can see their own pupils. We can see it. None of us can change it.

You see where they are doing well and where they are struggling. That is it. Nobody is marking your child, and nobody can quietly rewrite what happened.

We also never ask for your home address.

${SITE}

${TAGS_EN}`,
    fr: `Une question à poser à tout ce qui enregistre votre enfant.

Dans LexiaCamer, le dossier d'un enfant est en lecture seule pour tout le monde. Son enseignant peut le voir. Son école voit ses propres élèves. Nous pouvons le voir. Aucun de nous ne peut le modifier.

Vous voyez où il réussit et où il peine. C'est tout. Personne ne note votre enfant, et personne ne peut réécrire discrètement ce qui s'est passé.

Nous ne demandons jamais votre adresse non plus.

${SITE}

${TAGS_FR}`,
  },

  /* ——— The ask. Rationed by the scheduler. ——— */
  {
    key: 'ask-testers',
    kind: 'ask',
    ask: true,
    card: ['cta', {
      title: 'Be one of the first to test it.',
      sub: 'Ten minutes with your child, and tell us what went wrong.',
    }],
    en: `We are looking for parents and teachers to test LexiaCamer before it is finished.

What that means: open it with your child, spend ten minutes, and tell us what confused them. There is a feedback button on every screen, so you do not have to remember anything until later.

It is free, there is no account, and it takes a minute to join.

${SITE}

${TAGS_EN}`,
    fr: `Nous cherchons des parents et des enseignants pour tester LexiaCamer avant qu'elle soit terminée.

Concrètement : ouvrez-la avec votre enfant, passez dix minutes, et dites-nous ce qui l'a perdu. Il y a un bouton d'avis sur chaque écran, donc vous n'avez rien à retenir pour plus tard.

C'est gratuit, sans compte, et l'inscription prend une minute.

${SITE}

${TAGS_FR}`,
  },
  {
    key: 'ask-teachers',
    kind: 'ask',
    ask: true,
    card: ['cta', {
      title: 'Teachers: what would you want to see?',
      sub: 'We are building the class view now. Tell us before we get it wrong.',
    }],
    en: `A question for teachers.

We are building the part of LexiaCamer that shows you how your class is doing. You will see only the classes you teach, and nothing from any other school.

Before we build the wrong thing: what would you actually want on that screen? The children falling behind? The letters the whole class keeps missing? Something we have not thought of?

Tell us in the comments. We would rather hear it now than after it is built.

${TAGS_EN}`,
    fr: `Une question pour les enseignants.

Nous construisons la partie de LexiaCamer qui montre comment va votre classe. Vous ne verrez que les classes que vous enseignez, et rien d'une autre école.

Avant de construire la mauvaise chose : que voudriez-vous vraiment sur cet écran ? Les élèves en retard ? Les lettres que toute la classe rate ? Quelque chose auquel nous n'avons pas pensé ?

Dites-le en commentaire. Nous préférons l'entendre maintenant qu'une fois construit.

${TAGS_FR}`,
  },

  /* ——— Data-backed. Skipped entirely until the numbers are real. ——— */
  {
    key: 'stat-testers',
    kind: 'data',
    needs: (d) => d.testers >= 10,
    card: (d) => ['stat', {
      value: String(d.testers),
      label: 'people are testing LexiaCamer',
      sub: 'Parents, teachers and a few curious children.',
    }],
    en: (d) => `${d.testers} people are now testing LexiaCamer before it is finished.

Parents, teachers, and a few children who were handed a phone and told to break it.

Every one of them can report a problem from inside the app, and that is what decides what we build next. Not a plan we wrote months ago.

Want to be one of them? ${SITE}

${TAGS_EN}`,
    fr: (d) => `${d.testers} personnes testent maintenant LexiaCamer avant qu'elle soit terminée.

Des parents, des enseignants, et quelques enfants à qui on a donné un téléphone en leur disant de le casser.

Chacun peut signaler un problème depuis l'application, et c'est cela qui décide de la suite. Pas un plan écrit il y a des mois.

Envie d'en faire partie ? ${SITE}

${TAGS_FR}`,
    ask: true,
  },
  {
    key: 'stat-wants',
    kind: 'data',
    needs: (d) => d.topWant && d.testers >= 8,
    card: (d) => ['statement', {
      kicker: 'What parents asked for',
      title: `Most of you came for one thing: ${d.topWant.toLowerCase()}.`,
      sub: 'So that is what we are working on first.',
    }],
    en: (d) => `We asked everyone testing LexiaCamer what they most wanted it to help with.

The most common answer was ${d.topWant.toLowerCase()}.

So that is what we are working on first. Not the thing we assumed, and not the thing that would look best in a screenshot.

If you want to add your answer, it takes a minute: ${SITE}

${TAGS_EN}`,
    fr: (d) => `Nous avons demandé à tous ceux qui testent LexiaCamer ce qu'ils voulaient qu'elle les aide à faire.

La réponse la plus fréquente : ${d.topWant.toLowerCase()}.

C'est donc ce sur quoi nous travaillons en premier. Pas ce que nous avions supposé, ni ce qui ferait la plus belle capture d'écran.

Pour ajouter votre réponse, cela prend une minute : ${SITE}

${TAGS_FR}`,
    ask: true,
  },
  {
    key: 'fixed-from-feedback',
    kind: 'data',
    needs: (d) => d.feedback >= 5,
    card: (d) => ['stat', {
      value: String(d.feedback),
      label: 'things testers told us',
      sub: 'Every one of them read by a person.',
    }],
    en: (d) => `${d.feedback} pieces of feedback so far, and every one read by a person.

That is the whole reason the app is out before it is ready. We would rather find out now that a five-year-old cannot work out a screen than discover it after a thousand families have given up on it.

If something annoyed you, the button is on every screen. Nothing is too small.

${SITE}

${TAGS_EN}`,
    fr: (d) => `${d.feedback} retours pour l'instant, et chacun lu par une personne.

C'est toute la raison pour laquelle l'application est disponible avant d'être prête. Nous préférons découvrir maintenant qu'un enfant de cinq ans ne comprend pas un écran, plutôt que de l'apprendre après que mille familles aient abandonné.

Si quelque chose vous a agacé, le bouton est sur chaque écran. Rien n'est trop petit.

${SITE}

${TAGS_FR}`,
  },
];

/**
 * Copy for the free channels: WhatsApp, Facebook groups, and teachers.
 *
 * These are NOT page posts, and the difference is the whole point.
 *
 * A page post talks to people who already chose to follow you. A group post
 * interrupts 8,000 strangers in someone else's community, where a link is read
 * as spam and gets the author removed. A WhatsApp message is forwarded by a
 * parent whose own name is attached to it, so anything that reads like an
 * advert makes them look like they are selling something to their friends.
 *
 * So the rule that shapes every line below: THE VALUE IS COMPLETE WITHOUT THE
 * CLICK. A group post that teaches one real thing earns the right to be asked
 * "where is this from" -- and the answer in a comment converts better than a
 * link in the post ever would, because by then someone wanted it.
 */

export const LINK = 'https://lexiacamer.vercel.app/';

/* ————————————————————————————————————————————————————————————
   WHATSAPP
   Short enough to read without "read more". Written to be forwarded by a
   parent, so it sounds like a person recommending something, not a brand.
   ———————————————————————————————————————————————————————————— */

export const WHATSAPP = [
  {
    key: 'parent-to-parent',
    when: 'The general one. Send to family and class groups.',
    en: `I found a free app for teaching children to read — letter sounds and spelling, English and French.

Two things that make it useful here: it works offline once it loads, and there's no account or download.

It's still being built, so some parts are rough. They're asking parents to try it and say what's wrong.

${LINK}`,
    fr: `J'ai trouvé une application gratuite pour apprendre à lire aux enfants — les sons des lettres et l'orthographe, en français et en anglais.

Deux choses utiles ici : elle marche hors ligne une fois chargée, et il n'y a ni compte ni téléchargement.

Elle est encore en construction, donc certaines parties sont brutes. Ils demandent aux parents de l'essayer et de dire ce qui ne va pas.

${LINK}`,
  },
  {
    key: 'status',
    when: 'WhatsApp status. Shorter still, because nobody reads a long status.',
    en: `Free reading app for kids. Works with no internet. Still being built — they want honest feedback.

${LINK}`,
    fr: `Appli de lecture gratuite pour enfants. Marche sans internet. Encore en construction — ils veulent des avis honnêtes.

${LINK}`,
  },
];

/* ————————————————————————————————————————————————————————————
   FACEBOOK GROUPS
   No link in the post. None. The tip is the whole contribution.
   ———————————————————————————————————————————————————————————— */

export const GROUP_RULES = [
  'Read the group for a few days first. Comment on other people\'s posts before you post your own.',
  'NO LINK IN THE POST. Not at the bottom, not in the first comment, not "DM me". The post has to stand alone.',
  'Post as yourself, not as the page. People help people.',
  'If someone asks where it comes from, answer in the comments -- that is the moment, and only then.',
  'One group per day at most. The same text in six groups on one morning is how an account gets flagged.',
  'Answer every reply. A post with fifteen replies is shown to far more people than one with none.',
];

export const GROUP_POSTS = [
  {
    key: 'sound-not-name',
    en: `A small thing that changed how my daughter reads.

When you point at the letter M, say the sound — "mmm" — not the name, "em".

A child who knows the names says "èm-a-té" and never gets to "mat". A child who knows the sounds says "mmm-aaa-t" and hears the word appear.

The names matter later, for spelling out loud. The sounds come first.

Try three letters tonight: M, A, T. That is already a whole word.`,
    fr: `Une petite chose qui a changé la façon dont ma fille lit.

Quand vous montrez la lettre M, dites le son — « mmm » — pas le nom, « èm ».

Un enfant qui connaît les noms dit « èm-a-té » et n'arrive jamais à « mat ». Un enfant qui connaît les sons dit « mmm-aaa-t » et entend le mot apparaître.

Les noms serviront plus tard, pour épeler à voix haute. Les sons d'abord.

Essayez trois lettres ce soir : M, A, T. Cela fait déjà un mot.`,
  },
  {
    key: 'stretch-dont-chop',
    en: `If your child can say each sound but cannot hear the word, try this.

Stretch it instead of chopping it.

Not "s — o — l" with gaps. Say "sssooolll", one long breath, and let the word fall out at the end.

The gaps are what makes it hard. A child holding three separate sounds has to do the joining themselves. Stretching does the joining for them — and one day they do it without you.`,
    fr: `Si votre enfant dit chaque son mais n'entend pas le mot, essayez ceci.

Étirez-le au lieu de le découper.

Pas « s — o — l » avec des silences. Dites « sssooolll », d'un seul souffle, et laissez le mot tomber à la fin.

Ce sont les silences qui rendent la tâche difficile. Un enfant qui garde trois sons séparés doit faire le lien tout seul. En étirant, vous faites le lien pour lui — et un jour, il le fait sans vous.`,
  },
  {
    key: 'ten-minutes',
    en: `Ten minutes a day beats an hour on Sunday.

Reading is a habit before it is a skill. A child who reads a little every day builds something. A child who does an hour once a week mostly builds a memory of being tired.

Pick a time that already exists — after supper, before bed — and keep it short enough that they want to come back.

Stop while they are still enjoying it. That is the part nobody tells you.`,
    fr: `Dix minutes par jour valent mieux qu'une heure le dimanche.

La lecture est une habitude avant d'être une compétence. Un enfant qui lit un peu chaque jour construit quelque chose. Un enfant qui fait une heure par semaine construit surtout le souvenir d'être fatigué.

Choisissez un moment qui existe déjà — après le repas, avant le coucher — et gardez-le assez court pour qu'il ait envie de revenir.

Arrêtez pendant qu'il s'amuse encore. C'est ce que personne ne dit.`,
  },
];

/** The reply to have ready, for when someone asks. Not a pitch. */
export const WHEN_ASKED = {
  en: `I've been using a free app called LexiaCamer for the letter sounds — it works offline, which is why I can use it anywhere. It's still being built and the sounds aren't recorded yet, so it uses the phone's voice for now. Free, no account: ${LINK}`,
  fr: `J'utilise une application gratuite qui s'appelle LexiaCamer pour les sons des lettres — elle marche hors ligne, ce qui me permet de l'utiliser partout. Elle est encore en construction et les sons ne sont pas encore enregistrés, donc elle utilise la voix du téléphone pour l'instant. Gratuit, sans compte : ${LINK}`,
};

/* ————————————————————————————————————————————————————————————
   TEACHERS
   One teacher with a class of forty is worth more than five hundred page
   followers, and tells other teachers. Short, specific, asks for a small
   thing, and is honest about the state of it.
   ———————————————————————————————————————————————————————————— */

export const TEACHER = {
  en: `Good afternoon,

I am building a free reading app for children here in Cameroon — letter sounds and spelling, English and French. It works offline after it loads once, so it does not need data in the classroom.

It is not finished. The letter sounds are not recorded yet, so it uses the phone's built-in voice, which on some phones sounds wrong. I would rather tell you that now than have you find it.

Would you be willing to try it with a few children and tell me what confused them? Ten minutes is enough. There is a feedback button on every screen.

It is free, there is no account, and I am not selling anything.

${LINK}`,
  fr: `Bonjour,

Je construis une application de lecture gratuite pour les enfants ici au Cameroun — les sons des lettres et l'orthographe, en français et en anglais. Elle fonctionne hors ligne après le premier chargement, donc elle ne consomme pas de données en classe.

Elle n'est pas terminée. Les sons des lettres ne sont pas encore enregistrés, elle utilise donc la voix intégrée du téléphone, ce qui sonne faux sur certains appareils. Je préfère vous le dire maintenant plutôt que vous le laissiez découvrir.

Accepteriez-vous de l'essayer avec quelques enfants et de me dire ce qui les a perdus ? Dix minutes suffisent. Il y a un bouton d'avis sur chaque écran.

C'est gratuit, sans compte, et je ne vends rien.

${LINK}`,
};

/** Where to look. Search these on Facebook; join five to eight, not twenty. */
export const GROUP_SEARCHES = [
  'parents Cameroun', 'mamans Cameroun', 'Douala mamans', 'Yaoundé parents',
  'enseignants Cameroun', 'école primaire Cameroun', 'éducation Cameroun',
  'Cameroon parents', 'Cameroon teachers', 'homeschool Cameroon',
];

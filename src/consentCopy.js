/**
 * The exact words a parent and a child agree to.
 *
 * CONSENT_VERSION is stored with every consent row. Change it whenever any
 * wording below changes: a record must always point at the words that person
 * actually saw, and git keeps each version recoverable.
 *
 * No pronouns for the child. Gender is asked AFTER consent, so the copy repeats
 * the name instead of guessing.
 */
export const CONSENT_VERSION = '2026-09-29';

/** French elision: "d'Amina", "d'Hervé", "de Kofi". */
export const de = (name) =>
  (/^[aeiouyhàâäéèêëîïôöûùü]/iu.test(name) ? `d'${name}` : `de ${name}`);

const en = {
  title: 'Before we save anything',
  intro: (n) => `To show you ${n}'s progress on your account, we need to store some of it on our server. Here is exactly what that means.`,
  storeTitle: 'What we store',
  store: (n) => [
    `${n}'s first name and avatar and, if you give them on the next screen, ${n}'s birth date and gender`,
    `What ${n} does in the app: words spelled, sounds practised, stars earned`,
    'Your email, which you used to sign in, and your name and phone number if you give them on the next screen',
    `Anonymous totals for research, like which sounds children of ${n}'s age find hard. They never name ${n}, and only count groups too big to pick anyone out.`,
  ],
  neverTitle: 'What we never do',
  never: [
    'Sell it, or use it for advertising',
    'Show it to other parents',
    'Show it to a school, unless you choose that yourself on the next screen',
    'Ask for your home address',
  ],
  whereTitle: 'Where it is kept:',
  where: 'on Supabase servers in Ireland (European Union). Only your account can read it.',
  controlTitle: 'You stay in control:',
  control: (n) => `you can delete all of it at any time from the Parents page. ${n}'s stars stay on this phone.`,
  noTitle: 'If you say no:',
  no: (n) => `${n} keeps using everything on this phone, even offline. Only the Parents page needs this.`,
  checkbox: (n) => `I am ${n}'s parent or legal guardian, and I agree to LexiaCamer storing the information above.`,
  agree: 'Agree and continue',
  notNow: 'Not now',
  handPhone: (n) => `Hand the phone to ${n}`,
  childAsk: 'Your grown-up wants to see your stars and the words you learn. Is that OK with you?',
  childYes: 'Yes!',
  childNo: 'No thanks',
  childSaidNo: (n) => `${n} said not yet. Nothing has been saved.`,
  askAgain: 'Ask again',
  schoolBox: (n) => `Let ${n}'s school see ${n}'s progress, and your name and phone number, once the school joins LexiaCamer: only ${n}'s teachers and head teacher. You can turn this off at any time.`,
  dataTitle: 'Your data',
  download: (n) => `Download a copy of ${n}'s data`,
  stopSchool: (n) => `Stop sharing with ${n}'s school`,
  stopSchoolDone: 'Done. The school can no longer see this.',
  delete: (n) => `Delete ${n}'s data from LexiaCamer`,
  deleteConfirm: (n) => `This deletes ${n}'s name and learning history from our server. It cannot be undone. ${n}'s stars stay on this phone.`,
  deleteAccountToo: 'Also delete my account and my email',
  confirmDelete: 'Delete',
  cancel: 'Cancel',
  needInternet: 'You need internet to do this.',
  failed: 'That did not work. Check your connection and try again.',
  eraseNeedsInternet: 'This phone is linked to your account. Connect to the internet so the server copy is deleted too.',
};

const fr = {
  title: "Avant d'enregistrer quoi que ce soit",
  intro: (n) => `Pour vous montrer les progrès ${de(n)} sur votre compte, nous devons en conserver une partie sur notre serveur. Voici exactement ce que cela signifie.`,
  storeTitle: 'Ce que nous conservons',
  store: (n) => [
    `Le prénom et l'avatar ${de(n)} et, si vous les indiquez à l'écran suivant, sa date de naissance et son genre`,
    // "Ce que fait Amina", not "Ce que Amina fait": inversion is correct French
    // for every name, where "que" before a vowel would need eliding.
    `Ce que fait ${n} dans l'application : mots épelés, sons pratiqués, étoiles gagnées`,
    "Votre adresse e-mail, utilisée pour vous connecter, et votre nom et votre numéro de téléphone si vous les indiquez à l'écran suivant",
    `Des totaux anonymes pour la recherche, par exemple les sons difficiles pour les enfants de l'âge ${de(n)}. Ils ne nomment jamais ${n} et ne comptent que des groupes trop grands pour reconnaître quelqu'un.`,
  ],
  neverTitle: 'Ce que nous ne faisons jamais',
  never: [
    'Vendre ces informations ou les utiliser pour de la publicité',
    "Les montrer à d'autres parents",
    "Les montrer à une école, sauf si vous le choisissez vous-même à l'écran suivant",
    "Vous demander l'adresse de votre domicile",
  ],
  whereTitle: 'Où elles sont conservées :',
  where: 'sur les serveurs de Supabase en Irlande (Union européenne). Seul votre compte peut les lire.',
  controlTitle: 'Vous gardez le contrôle :',
  control: (n) => `vous pouvez tout supprimer à tout moment depuis la page Parents. Les étoiles ${de(n)} restent sur ce téléphone.`,
  noTitle: 'Si vous refusez :',
  no: (n) => `${n} continue d'utiliser toute l'application sur ce téléphone, même hors ligne. Seule la page Parents en a besoin.`,
  checkbox: (n) => `Je suis le parent ou le tuteur légal ${de(n)}, et j'accepte que LexiaCamer conserve les informations ci-dessus.`,
  agree: 'Accepter et continuer',
  notNow: 'Pas maintenant',
  handPhone: (n) => `Donnez le téléphone à ${n}`,
  childAsk: "Ton parent aimerait voir tes étoiles et les mots que tu apprends. Tu es d'accord ?",
  childYes: 'Oui !',
  childNo: 'Non merci',
  childSaidNo: (n) => `${n} a dit pas encore. Rien n'a été enregistré.`,
  askAgain: 'Demander à nouveau',
  schoolBox: (n) => `Autoriser l'école ${de(n)} à voir ses progrès, ainsi que votre nom et votre numéro de téléphone, une fois que l'école aura rejoint LexiaCamer : seulement ses enseignants et le directeur. Vous pouvez désactiver cela à tout moment.`,
  dataTitle: 'Vos données',
  download: (n) => `Télécharger une copie des données ${de(n)}`,
  stopSchool: (n) => `Arrêter le partage avec l'école ${de(n)}`,
  stopSchoolDone: "C'est fait. L'école ne peut plus voir ces informations.",
  delete: (n) => `Supprimer les données ${de(n)} de LexiaCamer`,
  deleteConfirm: (n) => `Cela supprime le nom ${de(n)} et son historique d'apprentissage de notre serveur. C'est définitif. Les étoiles ${de(n)} restent sur ce téléphone.`,
  deleteAccountToo: 'Supprimer aussi mon compte et mon e-mail',
  confirmDelete: 'Supprimer',
  cancel: 'Annuler',
  needInternet: 'Il faut une connexion internet pour faire cela.',
  failed: "Cela n'a pas fonctionné. Vérifiez votre connexion et réessayez.",
  eraseNeedsInternet: 'Ce téléphone est relié à votre compte. Connectez-vous à internet pour que la copie sur le serveur soit aussi supprimée.',
};

const copies = { en, fr };
export const copyFor = (lang) => copies[lang] || copies.en;

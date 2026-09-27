#!/usr/bin/env node
/**
 * The recording script for the letter sounds.
 *
 *   npm run recording-guide
 *
 * Writes content/recording/script.md: every sound to record, in order, with
 * what to say, what NOT to say, and the filename to save it as.
 *
 * Generated from phonicsData rather than typed out, so it cannot drift from
 * what the app actually asks for. If a sound is added to the app, it appears
 * here on the next run; if this list and the app disagree, this file is wrong
 * by construction and the app is right.
 *
 * This is the highest-value hour left in the project and it costs nothing. The
 * audio is the one thing every channel has to apologise for in advance -- the
 * landing page, the honest post, the teacher message and the reply to have
 * ready in a group all carry a caveat that exists only because these files do
 * not. Recording them deletes that paragraph from four places at once.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/* Read phonicsData out of the source rather than importing i18n.js, which
   pulls in browser-shaped modules this script has no use for. */
const src = readFileSync(resolve(ROOT, 'src/i18n.js'), 'utf8');
const from = src.indexOf('export const phonicsData');
const body = src.slice(from, src.indexOf('\n];', from));

const SOUNDS = body.split('{').slice(1).map((e) => {
  const get = (k) => (e.match(new RegExp(`${k}: "([^"]+)"`)) || [])[1] || '';
  return { letter: get('letter'), sound: get('sound'), example: get('example'), category: get('category') };
}).filter((x) => x.letter);

/** How to say each one aloud. The hard cases are named individually. */
const HOW = {
  // Vowels: the SHORT sound, the one that appears in a three-letter word.
  A: 'as in "cat" — short, open. Not the letter name "ay".',
  E: 'as in "bed" — short. Not "ee".',
  I: 'as in "sit" — short. Not "eye".',
  O: 'as in "hot" — short, round. Not "oh".',
  U: 'as in "cup" — short. Not "you".',
  // The stop consonants are where most recordings go wrong.
  B: 'a short "b". Resist saying "buh" — clip it as short as you can.',
  C: 'the hard "k" sound, as in "cat".',
  D: 'a short "d". Not "duh".',
  G: 'the hard "g", as in "go". Not "juh".',
  J: 'as in "jam".',
  K: 'a short "k". Not "kuh".',
  P: 'a short "p". Not "puh".',
  T: 'a short "t". Not "tuh".',
  // These can be held, which makes them much easier for a child to hear.
  F: 'hold it: "ffff". Easy to stretch, so stretch it.',
  L: 'hold it: "llll".',
  M: 'hold it: "mmmm". The one every parent already knows.',
  N: 'hold it: "nnnn".',
  R: 'hold it: "rrrr".',
  S: 'hold it: "ssss".',
  V: 'hold it: "vvvv".',
  Z: 'hold it: "zzzz".',
  H: 'just the breath: "h". Almost nothing.',
  W: 'as in "wet".',
  Y: 'as in "yes".',
  CH: 'as in "church".',
  SH: 'hold it: "shhh".',
  TH: 'as in "this" — voiced, the tongue between the teeth.',
  PH: 'the "f" sound. Say "ffff", the same as F.',
  NG: 'as at the END of "sing". Not "en-gee".',
  ND: 'the blend at the start of Ndole. One sound, not "en-dee".',
  MB: 'the blend at the start of Mbang. One sound, not "em-bee".',
  NK: 'the blend at the start of Nkongsamba. One sound, not "en-kay".',
};

const lines = [
  '# Recording the letter sounds',
  '',
  `${SOUNDS.length} sounds. One sitting, about an hour. No studio, no money.`,
  '',
  '## Before you start',
  '',
  '- **A quiet room at night.** Traffic and generators are the enemy, not your phone.',
  '- **Phone voice recorder is fine.** A cheap phone in a quiet room beats a good microphone in a noisy one.',
  '- **Hold the phone slightly below your chin**, a hand-width away, not in front of your mouth. That removes the puff on P, B and T.',
  '- **Record all of them in one go**, in this order, leaving two seconds of silence between each. Split them afterwards.',
  '- **Say each one three times** with a gap. You keep the best one and it costs nothing.',
  '',
  '## The one rule',
  '',
  'Say the **sound**, never the letter **name**. "mmm", not "em". "ssss", not "ess".',
  '',
  'And keep the stop sounds short. The instinct is to say "buh" for B, but a',
  'child who learns "buh" reads "bat" as "buh-a-tuh" and cannot hear the word.',
  'Clip it: as close to a bare "b" as your mouth will make.',
  '',
  '## A child\'s voice is worth more than yours',
  '',
  'If you can get a Cameroonian child of 7 or 8 to record these instead, do.',
  'Children copy other children more readily than they copy adults, and the',
  'accent will be the one your learners actually hear at school.',
  '',
  '---',
  '',
];

const CATS = [
  ['vowels', 'Vowels', 'Short sounds only. These five carry most of early reading.'],
  ['consonants', 'Consonants', 'Keep the stops short. Stretch the ones that can be stretched.'],
  ['blends', 'Blends', 'Two letters, ONE sound. The last four are the Cameroonian ones.'],
];

for (const [cat, title, note] of CATS) {
  const items = SOUNDS.filter((s) => s.category === cat);
  if (!items.length) continue;
  lines.push(`## ${title} (${items.length})`, '', note, '',
    '| # | Tile | Say | Example word | Save as |',
    '|---|---|---|---|---|');
  items.forEach((s, i) => {
    const n = String(SOUNDS.indexOf(s) + 1).padStart(2, '0');
    lines.push(`| ${n} | **${s.letter}** | ${HOW[s.letter] || `the "${s.sound}" sound`} | ${s.example} | \`${s.letter.toLowerCase()}.mp3\` |`);
    if (i === items.length - 1) lines.push('');
  });
}

lines.push(
  '---',
  '',
  '## After recording',
  '',
  `Save the ${SOUNDS.length} clips into \`public/sounds/\` using the filenames above,`,
  'trimmed so each starts immediately — a half-second of silence at the front',
  'feels like a broken button to a five-year-old.',
  '',
  'Keep them small. These are precached for offline use, and every kilobyte is',
  'downloaded once by someone on a weak connection. Mono, 48kbps mp3 is plenty',
  'for a single phoneme; the whole set should come to a couple of megabytes.',
  '',
  'Then tell me, and I will wire them into speech.js so a recorded clip plays',
  'when one exists and the phone voice remains the fallback when it does not.',
  '',
  '## What this deletes',
  '',
  'The moment these exist, the same paragraph comes out of four places:',
  '',
  '- the honest panel on the landing page, in both languages',
  '- the `honest-audio` post',
  '- the teacher message in `content/outreach/`',
  '- the reply to have ready when someone asks in a group',
  '',
  'Nothing else you can do this month removes a caveat from four channels at once.',
  '',
);

const dir = resolve(ROOT, 'content', 'recording');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, 'script.md'), lines.join('\n'));

const byCat = CATS.map(([c, t]) => `${SOUNDS.filter((s) => s.category === c).length} ${t.toLowerCase()}`).join(', ');
console.log(`\n  ${SOUNDS.length} sounds (${byCat})`);
console.log(`  written to content/recording/script.md\n`);

#!/usr/bin/env node
/**
 * Copy for the free channels: WhatsApp, Facebook groups, and teachers.
 *
 *   npm run outreach
 *
 * Writes content/outreach/:
 *   whatsapp.txt     messages a parent can forward without embarrassment
 *   groups.md        group posts, the rules for posting them, and where to look
 *   teacher.txt      a direct message to one teacher
 *
 * WHY THIS IS SEPARATE FROM `npm run posts`.
 *
 * A page post talks to people who already follow you. With twelve followers
 * that is not distribution, it is a filing cabinet -- the page's job right now
 * is to look real when somebody checks, not to reach anyone.
 *
 * Reach comes from places where people already gather: groups, WhatsApp, and
 * classrooms. Each of those punishes the thing a page post does happily. A
 * link in a group post reads as spam and gets the author removed. A marketing
 * sentence forwarded on WhatsApp makes the parent who forwarded it look like
 * they are selling to their friends. So the copy has to be written for the
 * room, and that is a different file rather than a flag on the same one.
 *
 * Costs nothing and needs no key: none of this touches the database.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  WHATSAPP, GROUP_POSTS, GROUP_RULES, GROUP_SEARCHES, WHEN_ASKED, TEACHER, LINK,
} from './lib/outreach-library.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const dir = resolve(ROOT, 'content', 'outreach');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

/* ——— WhatsApp ——— */

const wa = ['LexiaCamer — WhatsApp', '='.repeat(24), '',
  'Send these to family groups and class groups, and use the short one as a',
  'status. They are written to be forwarded BY a parent, so they sound like a',
  'person recommending something rather than a brand advertising. Do not add',
  'emojis or exclamation marks to them; that is what makes a forward look like',
  'a chain message.', ''];

for (const m of WHATSAPP) {
  wa.push('-'.repeat(60), `${m.key.toUpperCase()}  —  ${m.when}`, '-'.repeat(60), '');
  wa.push('[EN]', '', m.en, '', '[FR]', '', m.fr, '');
}
writeFileSync(resolve(dir, 'whatsapp.txt'), wa.join('\n'));

/* ——— Groups ——— */

const g = [
  '# LexiaCamer — Facebook groups',
  '',
  'This is the highest-leverage free channel you have. One useful post in a',
  'group of 8,000 parents reaches more people than a month of posting to a page',
  'with twelve followers.',
  '',
  '## The rules, and they matter more than the copy',
  '',
  ...GROUP_RULES.map((r) => `- ${r}`),
  '',
  'The reason for the no-link rule is not politeness. A post that teaches one',
  'real thing earns the right to be asked where it came from, and an answer in',
  'the comments converts far better than a link in the post -- because by then',
  'somebody actually wanted it.',
  '',
  '## Where to look',
  '',
  'Search Facebook for these. Join five to eight, not twenty, and read each one',
  'for a few days before you post anything.',
  '',
  ...GROUP_SEARCHES.map((s) => `- \`${s}\``),
  '',
  '## When somebody asks where it came from',
  '',
  'Have this ready. It names the missing audio, because the first impression',
  'should not be a surprise.',
  '',
  '```', WHEN_ASKED.en, '```',
  '',
  '```', WHEN_ASKED.fr, '```',
  '',
  '---',
  '',
  '## The posts',
  '',
  'One per week at most, one group per day. The same text in six groups on a',
  'single morning is how an account gets flagged.',
  '',
];

GROUP_POSTS.forEach((p, i) => {
  g.push(`### ${i + 1}. ${p.key}`, '');
  g.push('<details open><summary><b>EN</b></summary>', '', '```', p.en, '```', '</details>', '');
  g.push('<details><summary><b>FR</b></summary>', '', '```', p.fr, '```', '</details>', '');
  g.push('---', '');
});
writeFileSync(resolve(dir, 'groups.md'), g.join('\n'));

/* ——— Teachers ——— */

const t = ['LexiaCamer — message to a teacher', '='.repeat(34), '',
  'One teacher with a class of forty is worth more than five hundred page',
  'followers, and tells other teachers. That is how education products spread',
  'here.',
  '',
  'Send it to people you actually have some connection to first. Change the',
  'first line so it is obviously written to them and not pasted; a message that',
  'reads as a template gets the reply a template deserves.',
  '',
  'It names the unrecorded audio on purpose. A teacher who finds that out in',
  'front of a class will not answer your next message.',
  '',
  '-'.repeat(60), '[EN]', '-'.repeat(60), '', TEACHER.en, '',
  '-'.repeat(60), '[FR]', '-'.repeat(60), '', TEACHER.fr, ''];
writeFileSync(resolve(dir, 'teacher.txt'), t.join('\n'));

console.log(`
  Written to content/outreach/

    whatsapp.txt   ${WHATSAPP.length} messages, EN + FR
    groups.md      ${GROUP_POSTS.length} posts, the posting rules, ${GROUP_SEARCHES.length} groups to search
    teacher.txt    one message, EN + FR

  All free. Nothing here needs a key, a budget, or a Meta app.
  Link used throughout: ${LINK}
`);

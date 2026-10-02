import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Play, Quote, CircleCheck, ChartLine, ShieldCheck, Check, Star,
} from 'lucide-react';
import landing, { FACEBOOK_URL, HERO_LETTERS, BOARD_LETTERS } from './landingCopy';

/**
 * Landing: the page at /.
 *
 * Most visitors arrive from the Facebook page, on an Android phone, having
 * never heard of this. They have thirty seconds of patience and one real
 * question underneath the obvious ones: is it safe to hand this to my child?
 *
 * "Trusted" and "secure" do not answer that; a scam says them too. What does
 * is being specific: the real app screens, the real voice a parent can play
 * from the hero, and why the app was built. No invented numbers, no reviews.
 *
 * ONE call to action, everywhere: start learning. It opens the app directly.
 *
 * The hero photo is a stock photo (Pexels 28593055, Pexels License). Stock
 * licences carry no model release, so nothing on this page may suggest the
 * children in it use the app, or that one of them is the child in the story.
 */

// Plays the owner's recorded letter sound. Deliberately not speech.js: that
// would pull the speech engine into the first paint of the page most people
// see first, to play three clips.
function useClipPlayer() {
  const current = useRef(null);
  useEffect(() => () => current.current?.pause(), []);
  return (sound, folder, onDone) => {
    try {
      current.current?.pause();
      const audio = new Audio(`/audio/phonics/${folder}/${sound}.mp3`);
      current.current = audio;
      audio.addEventListener('ended', onDone);
      audio.addEventListener('error', onDone);
      audio.play().catch(onDone);
    } catch { onDone(); }
  };
}

export default function Landing({ onStart }) {
  const [lang, setLang] = useState('en');
  const [voice, setVoice] = useState('standard');
  const [playing, setPlaying] = useState(null);
  const play = useClipPlayer();
  const t = landing[lang];

  const playLetter = (sound, folder, key) => {
    setPlaying(key);
    play(sound, folder, () => setPlaying((k) => (k === key ? null : k)));
  };

  const scrollTo = (id) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth', block: 'start',
    });
  };

  const letterLabel = (s) => s.toUpperCase();

  return (
    <div className="lp" lang={lang}>
      {/* ——— Header ——— */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <a className="lp-logo" href="#top" aria-label="LexiaCamer">
            <img src="/pwa-192x192.png" alt="" className="lp-logo-img" />
            <span className="lp-logo-text">exiaCamer</span>
          </a>

          <div className="lp-header-right">
            <div className="lp-lang" role="group" aria-label="Language">
              <button type="button" className={lang === 'en' ? 'is-on' : ''}
                      onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
              <button type="button" className={lang === 'fr' ? 'is-on' : ''}
                      onClick={() => setLang('fr')} aria-pressed={lang === 'fr'}>FR</button>
            </div>
            <button type="button" className="lp-btn lp-btn-primary lp-btn-sm" onClick={onStart}>
              {t.navCta}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ——— Hero ——— */}
        <section className="lp-hero">
          <div className="lp-hero-media">
            {/* Mirrored in the file itself so the faces sit on the right, away
                from the headline. */}
            <img className="lp-hero-img"
                 src="/landing/hero-1024.webp"
                 srcSet="/landing/hero-640.webp 640w, /landing/hero-1024.webp 1024w, /landing/hero-1920.webp 1920w"
                 sizes="100vw" alt={t.heroAlt} fetchpriority="high" />
          </div>
          <div className="lp-wrap lp-hero-inner">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">{t.eyebrow}</p>
              <h1 className="lp-h1">
                {t.heroTitleA}<span className="lp-underline">{t.heroTitleB}</span>
              </h1>
              <p className="lp-lead">{t.heroLead}</p>

              <div className="lp-hero-actions">
                <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onStart}>
                  {t.heroCta} <ArrowRight size={18} />
                </button>
                <button type="button" className="lp-btn lp-btn-ghost lp-btn-lg" onClick={() => scrollTo('how')}>
                  {t.heroSecondary}
                </button>
              </div>

              <ul className="lp-reassure">
                {t.reassure.map((r) => <li key={r}>{r}</li>)}
              </ul>

              <div className="lp-hear">
                <div>
                  <p className="lp-hear-title">{t.hearTitle}</p>
                  <p className="lp-hear-sub">{t.hearSub}</p>
                </div>
                <div className="lp-hear-chips">
                  {HERO_LETTERS.map((s) => (
                    <button type="button" key={s}
                            className={`lp-chip${s.length > 1 ? ' is-blend' : ''}${playing === `hero-${s}` ? ' is-on' : ''}`}
                            aria-label={`${t.playSound}: ${letterLabel(s)}`}
                            onClick={() => playLetter(s, 'standard', `hero-${s}`)}>
                      {letterLabel(s)}
                      <Play size={9} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— Why this app exists ——— */}
        <section className="lp-story">
          <div className="lp-wrap lp-narrow">
            <h2 className="lp-h2">{t.storyTitle}</h2>
            <div className="lp-story-body">
              <Quote className="lp-story-quote" size={64} aria-hidden="true" />
              <p className="lp-story-lead">{t.storyLead}</p>
              {t.story.map((p) => <p key={p}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* ——— Ten minutes a day ——— */}
        <section className="lp-wrap lp-section" id="how">
          <h2 className="lp-h2 lp-center">{t.howTitle}</h2>
          <div className="lp-steps">
            {t.steps.map((s, i) => (
              <div className={`lp-step s${i + 1}`} key={s.img}>
                <div className="lp-step-text">
                  <div className="lp-step-head">
                    <span className="lp-step-n">{i + 1}</span>
                    <h3 className="lp-h3">{s.title}</h3>
                  </div>
                  <p>{s.body}</p>
                </div>
                <div className="lp-shot">
                  <img src={`/landing/${s.img}.webp`} alt={s.alt} loading="lazy"
                       width="390" height={s.img === 'phonics-lab' ? 995 : s.img === 'word-forge' ? 916 : 844} />
                </div>
              </div>
            ))}
          </div>
          <div className="lp-stickers">
            <span className="lp-step-n s4">4</span>
            <div>
              <h3 className="lp-h3">{t.stickersTitle}</h3>
              <p><Star size={16} aria-hidden="true" /> {t.stickersBody}</p>
            </div>
          </div>
        </section>

        {/* ——— Hear the difference: plays the real Standard and Native clips ——— */}
        <section className="lp-wrap lp-section">
          <div className="lp-diff">
            <div className="lp-diff-text">
              <h2 className="lp-h2">{t.diffTitle}</h2>
              <p>{t.diffBody}</p>
              <ul className="lp-diff-facts">
                {t.diffFacts.map((f) => <li key={f}><CircleCheck size={16} aria-hidden="true" /> {f}</li>)}
              </ul>
            </div>
            <div className="lp-board">
              <div className="lp-board-toggle" role="group" aria-label={t.diffTitle}>
                {[['standard', t.diffStandard], ['native', t.diffNative]].map(([id, label]) => (
                  <button type="button" key={id} className={voice === id ? 'is-on' : ''}
                          aria-pressed={voice === id} onClick={() => setVoice(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="lp-board-grid">
                {BOARD_LETTERS.map((s) => (
                  <button type="button" key={s}
                          className={playing === `board-${s}` ? 'is-on' : ''}
                          aria-label={`${t.playSound}: ${letterLabel(s)}`}
                          onClick={() => playLetter(s, voice, `board-${s}`)}>
                    {letterLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ——— For parents ——— */}
        <section className="lp-wrap lp-section" id="parents">
          <h2 className="lp-h2">{t.parentsTitle}</h2>
          <div className="lp-parents">
            {t.parents.map((p, i) => {
              const Icon = i === 0 ? ChartLine : ShieldCheck;
              return (
                <div className={`lp-card c${i}`} key={p.title}>
                  <Icon size={28} aria-hidden="true" />
                  <h3 className="lp-h3">{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ——— Made for real life ——— */}
        <section className="lp-wrap lp-section lp-real">
          <h2 className="lp-h2">{t.realTitle}</h2>
          <ul className="lp-real-list">
            {t.real.map((r) => <li key={r}><Check size={22} aria-hidden="true" /> <span>{r}</span></li>)}
          </ul>
        </section>

        {/* ——— Price ——— */}
        <section className="lp-wrap">
          <p className="lp-price">{t.price}</p>
        </section>

        {/* ——— Final call to action ——— */}
        <section className="lp-wrap lp-section lp-center lp-final">
          <h2 className="lp-h2">{t.finalTitle}</h2>
          <button type="button" className="lp-btn lp-btn-primary lp-btn-xl" onClick={onStart}>
            {t.finalCta}
          </button>
          <p className="lp-questions">
            {t.questions}{' '}
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">{t.facebookCta}</a>.
          </p>
        </section>
      </main>

      {/* ——— Footer ——— */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <span className="lp-logo lp-logo-muted" role="img" aria-label="LexiaCamer">
            <img src="/pwa-192x192.png" alt="" className="lp-logo-img" />
            <span className="lp-logo-text" aria-hidden="true">exiaCamer</span>
          </span>
          <nav className="lp-footer-links">
            {/* Points at the data section on this page: there is no separate
                policy page, and a dead link in a trust page's footer is an own goal. */}
            <a href="#parents">{t.footerPrivacy}</a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">{t.footerFacebook}</a>
            <button type="button" onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}>
              {t.otherLang}
            </button>
          </nav>
          <span className="lp-made">© {new Date().getFullYear()} LexiaCamer · {t.footerMade}</span>
        </div>
      </footer>
    </div>
  );
}

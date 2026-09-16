import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Check, FlaskConical, Volume2, MessageSquare, WifiOff,
  Languages, Sun, ShieldCheck, Type, Hammer, Star, Settings as SettingsIcon,
  BookOpen, Smartphone, Gamepad2, BarChart3,
} from 'lucide-react';
import landing, { FACEBOOK_URL, SCHOOL_COUNT } from './landingCopy';

/**
 * Landing — the page at /.
 *
 * Most visitors arrive from the Facebook page, on an Android phone, having
 * never heard of this. They have thirty seconds of patience and one real
 * question underneath the obvious ones: is it safe to hand this to my
 * five-year-old?
 *
 * You cannot answer that by saying "trusted" or "secure" — a scam says that
 * too. You answer it by being specific and by naming your own weakness first,
 * which is why the amber panel about the missing audio sits directly under the
 * hero rather than buried near the footer. A product that tells you what is
 * broken before you find it is doing something a fake will not do.
 *
 * ONE call to action, everywhere: become an early tester. Teachers and schools
 * are described but never linked, because those dashboards do not exist yet and
 * a button leading nowhere costs more trust than the section wins.
 */

const ICONS = [Type, Hammer, Star, SettingsIcon];
const HOW_ICONS = [Smartphone, Gamepad2, BarChart3];
const INSIDE_ICONS = [Type, Hammer, Star, BookOpen];
const BUILT_ICONS = [WifiOff, Languages, Sun];

export default function Landing({ onStart }) {
  const [lang, setLang] = useState('en');
  // Gates the reveal animation. The hidden state is applied by THIS class, not
  // by .lp-reveal alone, so a browser without IntersectionObserver, a visitor
  // who asked for less motion, or a JS error can never leave sections blank —
  // they just render, immediately and visibly. Hiding content in CSS and
  // relying on JS to bring it back is how a marketing page ends up empty for
  // the people least able to debug it.
  const [animate, setAnimate] = useState(false);
  const t = landing[lang];

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') return undefined;
    setAnimate(true);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    const els = document.querySelectorAll('.lp-reveal');
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  const scrollTo = (id) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth', block: 'start',
    });
  };

  return (
    <div className={`lp${animate ? ' lp-animate' : ''}`} lang={lang}>
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
            <button className="lp-btn lp-btn-primary lp-btn-sm" onClick={onStart}>
              {t.navCta}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ——— Hero ——— */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-badge"><FlaskConical size={14} /> {t.badge}</span>
              <h1 className="lp-h1">{t.heroTitle}</h1>
              <p className="lp-lead">{t.heroLead}</p>

              <div className="lp-hero-actions">
                <button className="lp-btn lp-btn-primary" onClick={onStart}>
                  {t.heroCta} <ArrowRight size={18} />
                </button>
                <button className="lp-btn lp-btn-quiet" onClick={() => scrollTo('inside')}>
                  {t.heroSecondary}
                </button>
              </div>

              <ul className="lp-reassure">
                {t.reassure.map((r) => (
                  <li key={r}><Check size={15} /> {r}</li>
                ))}
              </ul>
            </div>

            {/* A drawn mock, not a screenshot: it stays truthful when the app
                changes, costs no bytes, and is readable on a slow connection. */}
            <div className="lp-phone" aria-hidden="true">
              <div className="lp-phone-screen">
                <div className="lp-mock-greet">{t.mockGreeting}</div>
                <div className="lp-mock-sub">{t.mockSub}</div>
                <div className="lp-mock-stats">
                  {t.mockStats.map((s) => (
                    <div className="lp-mock-stat" key={s.label}>
                      <div className="lp-mock-stat-v">{s.value}</div>
                      <div className="lp-mock-stat-l">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="lp-mock-grid">
                  {t.mockTiles.map((tile, i) => {
                    const Icon = ICONS[i];
                    return (
                      <div className={`lp-mock-tile t${i}`} key={tile}>
                        <span className="lp-mock-puck"><Icon size={16} /></span>
                        <span className="lp-mock-tile-label">{tile}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— The honest panel. Highest-value block on the page. ——— */}
        <section className="lp-wrap">
          <div className="lp-honest lp-reveal">
            <p className="lp-honest-title"><Volume2 size={18} /> {t.honestTitle}</p>
            <p>
              {t.honestBody1a}<strong>{t.honestBody1b}</strong>{t.honestBody1c}
            </p>
            <p>{t.honestBody2}</p>
            <p className="lp-honest-last">{t.honestBody3}</p>
          </div>
        </section>

        {/* ——— How it works ——— */}
        <section className="lp-wrap lp-section">
          <h2 className="lp-h2">{t.howTitle}</h2>
          <ol className="lp-steps">
            {t.how.map((s, i) => {
              const Icon = HOW_ICONS[i];
              return (
                <li className="lp-step lp-reveal" key={s.title}>
                  <span className="lp-step-n">{i + 1}</span>
                  <div className="lp-step-body">
                    <h3 className="lp-h3">{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                  <span className="lp-step-icon" aria-hidden="true"><Icon size={26} /></span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ——— What is inside ——— */}
        <section className="lp-wrap lp-section" id="inside">
          <h2 className="lp-h2">{t.insideTitle}</h2>
          <div className="lp-cards">
            {t.inside.map((f, i) => {
              const Icon = INSIDE_ICONS[i];
              return (
                <div className={`lp-card lp-reveal c${i}`} key={f.title}>
                  <span className="lp-puck"><Icon size={22} /></span>
                  <h3 className="lp-h3">{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ——— Built for Cameroon ——— */}
        <section className="lp-band">
          <div className="lp-wrap lp-band-grid">
            <div>
              <h2 className="lp-h2">{t.builtTitle}</h2>
              <ul className="lp-facts">
                {t.built.map((b, i) => {
                  const Icon = BUILT_ICONS[i];
                  return (
                    <li key={b.title}>
                      <span className="lp-fact-icon"><Icon size={18} /></span>
                      <div>
                        <strong>{b.title}</strong>
                        <p>{b.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="lp-bignum lp-reveal">
              <div className="lp-bignum-v">{SCHOOL_COUNT}</div>
              <div className="lp-bignum-l">{t.schoolsLabel}</div>
              <div className="lp-bignum-s">{t.schoolsSub}</div>
            </div>
          </div>
        </section>

        {/* ——— Who sees what. Described, never linked. ——— */}
        <section className="lp-wrap lp-section">
          <h2 className="lp-h2">{t.audienceTitle}</h2>
          <div className="lp-aud">
            {t.audiences.map((a) => (
              <div className="lp-aud-col" key={a.title}>
                <h3 className="lp-h3">{a.title}</h3>
                <p>{a.body}</p>
              </div>
            ))}
          </div>
          <p className="lp-note">{t.audienceNote}</p>
        </section>

        {/* ——— Privacy and price ——— */}
        <section className="lp-wrap lp-section" id="privacy">
          <div className="lp-privacy lp-reveal">
            <h2 className="lp-h2 lp-h2-left">
              <ShieldCheck size={22} /> {t.privacyTitle}
            </h2>
            <p className="lp-privacy-lead">{t.privacyLead}</p>
            <div className="lp-privacy-cols">
              {t.privacyBody.map((p) => <p key={p}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* ——— Contact. One channel, and it is real. ——— */}
        <section className="lp-wrap lp-section lp-center">
          <h2 className="lp-h2">{t.contactTitle}</h2>
          <a className="lp-btn lp-btn-primary" href={FACEBOOK_URL}
             target="_blank" rel="noopener noreferrer">
            <MessageSquare size={18} /> {t.contactCta}
          </a>
          <p className="lp-contact-body">{t.contactBody}</p>
          <p className="lp-note">{t.contactReply}</p>
        </section>
      </main>

      {/* ——— Final call to action ——— */}
      <section className="lp-final">
        <div className="lp-wrap lp-center">
          <h2 className="lp-final-title">{t.finalTitle}</h2>
          <button className="lp-btn lp-btn-invert" onClick={onStart}>
            {t.finalCta} <ArrowRight size={18} />
          </button>
          <p className="lp-final-note">{t.finalNote}</p>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-grid">
          <div>
            <span className="lp-logo" role="img" aria-label="LexiaCamer">
              <img src="/pwa-192x192.png" alt="" className="lp-logo-img" />
              <span className="lp-logo-text" aria-hidden="true">exiaCamer</span>
            </span>
            <p className="lp-footer-blurb">{t.footerBlurb}</p>
          </div>
          <div>
            <h3 className="lp-footer-h">{t.footerLanguage}</h3>
            <button className="lp-footer-link" onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}>
              {t.otherLang}
            </button>
          </div>
          <div>
            <h3 className="lp-footer-h">{t.footerLinks}</h3>
            {/* Points at the section on this page, not a policy that does not
                exist. A dead link in the footer of a trust page is a own goal. */}
            <a className="lp-footer-link" href="#privacy">{t.footerPrivacy}</a>
            <a className="lp-footer-link" href={FACEBOOK_URL}
               target="_blank" rel="noopener noreferrer">{t.footerFacebook}</a>
          </div>
        </div>
        <div className="lp-wrap lp-footer-base">
          <span>© {new Date().getFullYear()} LexiaCamer</span>
          <span>{t.footerMade}</span>
        </div>
      </footer>
    </div>
  );
}

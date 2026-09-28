import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { copyFor } from '../consentCopy';

/**
 * Consent before a child's data leaves the phone, in two parts:
 *
 *   1. The parent reads what is stored, where, and how to undo it, and ticks
 *      an unticked box. "Not now" costs nothing: the child keeps the app.
 *   2. The child is asked in their own words. The law wants a minor's OK in
 *      addition to the parent's, and a child who says no is not overruled.
 *
 * Nothing is sent from here. onAgree(true) lets App link the child, and the
 * server records the consent in the same transaction that creates the child.
 */
export default function ParentConsent({ lang, childName, childDeclined, onAgree, onBack }) {
  const c = copyFor(lang);
  const n = childName || (lang === 'fr' ? 'votre enfant' : 'your child');
  const [step, setStep] = useState(childDeclined ? 'declined' : 'parent');
  const [ticked, setTicked] = useState(false);

  return (
    <div className="screen">
      <div className="focus-back">
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="auth-card consent-card">
        {step === 'parent' && (
          <>
            <h2 className="onb-title">{c.title}</h2>
            <p className="onb-sub">{c.intro(n)}</p>

            <h3 className="consent-h">{c.storeTitle}</h3>
            <ul className="consent-list">{c.store(n).map((s) => <li key={s}>{s}</li>)}</ul>

            <h3 className="consent-h">{c.neverTitle}</h3>
            <ul className="consent-list">{c.never.map((s) => <li key={s}>{s}</li>)}</ul>

            <p className="consent-p"><strong>{c.whereTitle}</strong> {c.where}</p>
            <p className="consent-p"><strong>{c.controlTitle}</strong> {c.control(n)}</p>
            <p className="consent-p"><strong>{c.noTitle}</strong> {c.no(n)}</p>

            <label className="consent-check">
              <input type="checkbox" checked={ticked}
                     onChange={(e) => setTicked(e.target.checked)} />
              <span>{c.checkbox(n)}</span>
            </label>

            <div className="onb-actions">
              <button type="button" className="btn btn-ghost" onClick={onBack}>{c.notNow}</button>
              <button type="button" className="btn btn-primary" disabled={!ticked}
                      onClick={() => setStep('child')}>
                <ShieldCheck size={18} /> {c.agree}
              </button>
            </div>
          </>
        )}

        {step === 'child' && (
          <>
            <p className="consent-hand">{c.handPhone(n)}</p>
            <h2 className="onb-title consent-child-ask">{c.childAsk}</h2>
            <div className="onb-actions">
              {/* App keeps this screen mounted after a no, so switch the step
                  here: the childDeclined prop only sets the FIRST step. */}
              <button type="button" className="btn btn-ghost"
                      onClick={() => { setStep('declined'); onAgree(false); }}>
                {c.childNo}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onAgree(true)}>
                {c.childYes}
              </button>
            </div>
          </>
        )}

        {step === 'declined' && (
          <>
            <p className="onb-sub">{c.childSaidNo(n)}</p>
            <div className="onb-actions">
              <button type="button" className="btn btn-ghost" onClick={onBack}>{c.notNow}</button>
              <button type="button" className="btn btn-primary" onClick={() => setStep('child')}>
                {c.askAgain}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

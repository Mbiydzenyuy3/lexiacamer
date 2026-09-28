import { describe, it, expect } from 'vitest';
import { CONSENT_VERSION, copyFor, de } from './consentCopy';

describe('consentCopy', () => {
  it('elides "de" before a vowel or h, as French requires', () => {
    expect(de('Amina')).toBe("d'Amina");
    expect(de('Hervé')).toBe("d'Hervé");
    expect(de('Émile')).toBe("d'Émile");
    expect(de('Kofi')).toBe('de Kofi');
  });

  it('has the same keys in English and French', () => {
    expect(Object.keys(copyFor('fr')).sort()).toEqual(Object.keys(copyFor('en')).sort());
  });

  it('falls back to English for an unknown language', () => {
    expect(copyFor('xx')).toBe(copyFor('en'));
  });

  it('names the child instead of using a pronoun', () => {
    const text = copyFor('en').store('Amina').join(' ');
    expect(text).toContain('What Amina does');
    expect(text).not.toMatch(/\b(she|he|her|his)\b/i);
  });

  it('carries a version that fits the database column', () => {
    expect(CONSENT_VERSION.length).toBeGreaterThan(0);
    expect(CONSENT_VERSION.length).toBeLessThanOrEqual(20);
  });

  it('never leaves "que" unelided before a vowel-initial name in French', () => {
    const fr = copyFor('fr');
    const all = [fr.intro('Amina'), ...fr.store('Amina'), fr.control('Amina'),
                 fr.no('Amina'), fr.checkbox('Amina'), fr.childSaidNo('Amina'),
                 fr.schoolBox('Amina'), fr.deleteConfirm('Amina')].join(' ');
    expect(all).not.toMatch(/\b(que|de|le|la) [AEIOUYH]/);
  });

  it('lists everything onboarding stores, in both languages', () => {
    const en = copyFor('en').store('Amina').join(' ');
    expect(en).toMatch(/\bage\b/);
    expect(en).toMatch(/gender/);
    expect(en).toMatch(/your name/i);
    expect(en).toMatch(/phone number if you give it/i);
    expect(en).not.toMatch(/birth date|if you give them/);
    const fr = copyFor('fr').store('Amina').join(' ');
    expect(fr).toMatch(/l'âge/);
    expect(fr).toMatch(/genre/);
    expect(fr).toMatch(/votre nom/i);
    expect(fr).toMatch(/numéro de téléphone si vous l'indiquez/i);
    expect(fr).not.toMatch(/date de naissance|si vous les indiquez/);
  });

  it('tells the parent the school would see their name and phone', () => {
    expect(copyFor('en').schoolBox('Amina')).toMatch(/your name and phone/i);
    expect(copyFor('fr').schoolBox('Amina')).toMatch(/votre nom et votre numéro/i);
  });

  it('discloses the anonymous research totals', () => {
    expect(copyFor('en').store('Amina').join(' ')).toMatch(/anonymous/i);
    expect(copyFor('fr').store('Amina').join(' ')).toMatch(/anonymes/i);
  });
});

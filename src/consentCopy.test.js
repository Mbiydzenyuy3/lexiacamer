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
});

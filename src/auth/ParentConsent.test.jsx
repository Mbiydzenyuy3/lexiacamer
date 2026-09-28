import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ParentConsent from './ParentConsent';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host, root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (props) => act(() => root.render(
  <ParentConsent lang="en" childName="Amina" childDeclined={false}
                 onAgree={() => {}} onBack={() => {}} {...props} />));
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const click = (el) => act(() => el.click());

describe('ParentConsent', () => {
  it('cannot agree until the box is ticked', () => {
    render();
    expect(button('Agree and continue').disabled).toBe(true);
    click(host.querySelector('input[type="checkbox"]'));
    expect(button('Agree and continue').disabled).toBe(false);
  });

  it('asks the child after the parent agrees, and records their yes', () => {
    const onAgree = vi.fn();
    render({ onAgree });
    click(host.querySelector('input[type="checkbox"]'));
    click(button('Agree and continue'));
    expect(onAgree).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Hand the phone to Amina');
    click(button('Yes!'));
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onAgree).toHaveBeenCalledWith(true);
  });

  it('records the child\'s no as a no', () => {
    const onAgree = vi.fn();
    render({ onAgree });
    click(host.querySelector('input[type="checkbox"]'));
    click(button('Agree and continue'));
    click(button('No thanks'));
    expect(onAgree).toHaveBeenCalledWith(false);
    expect(host.textContent).toContain('Amina said not yet');
  });

  it('"Not now" sends nothing', () => {
    const onAgree = vi.fn(); const onBack = vi.fn();
    render({ onAgree, onBack });
    click(button('Not now'));
    expect(onBack).toHaveBeenCalled();
    expect(onAgree).not.toHaveBeenCalled();
  });

  it('after a child\'s no, the parent can ask again', () => {
    render({ childDeclined: true });
    expect(host.textContent).toContain('Amina said not yet');
    click(button('Ask again'));
    expect(host.textContent).toContain('Is that OK with you?');
  });

  it('speaks French with correct elision', () => {
    render({ lang: 'fr' });
    expect(host.textContent).toContain("tuteur légal d'Amina");
  });
});

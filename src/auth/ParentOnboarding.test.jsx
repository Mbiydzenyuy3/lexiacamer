import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const rpc = vi.fn(async () => ({ data: null, error: null }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc: (...a) => rpc(...a) } }));
const giveSchoolConsent = vi.fn(async () => {});
vi.mock('../lib/dataRights', () => ({ giveSchoolConsent: (...a) => giveSchoolConsent(...a) }));

const { default: ParentOnboarding } = await import('./ParentOnboarding');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host, root;
beforeEach(() => {
  rpc.mockClear(); giveSchoolConsent.mockClear();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('ParentOnboarding', () => {
  it('shares nothing with a school unless the parent ticks the box', async () => {
    const onDone = vi.fn();
    act(() => root.render(
      <ParentOnboarding lang="en" studentId="s1" initialChildName="Amina"
                        onBack={() => {}} onDone={onDone} />));
    expect(host.querySelector('#onb-school')).toBeNull();
    await act(async () => { button('Continue').click(); });
    await flush();
    const called = rpc.mock.calls.map((c) => c[0]);
    expect(called).not.toContain('claim_school_place');
    expect(called).not.toContain('note_school_interest');
    expect(giveSchoolConsent).not.toHaveBeenCalled();
  });

  it('shows the school picker only once the box is ticked', () => {
    act(() => root.render(
      <ParentOnboarding lang="en" studentId="s1" initialChildName="Amina"
                        onBack={() => {}} onDone={() => {}} />));
    act(() => host.querySelector('.consent-check input').click());
    expect(host.querySelector('#onb-school')).not.toBeNull();
  });

  it('has two steps and never asks for an address', async () => {
    const onDone = vi.fn();
    act(() => root.render(
      <ParentOnboarding lang="en" studentId="s1" initialChildName="Amina"
                        onBack={() => {}} onDone={onDone} />));
    await act(async () => { button('Continue').click(); });
    await flush();
    await act(async () => { button('Continue').click(); });
    await flush();
    expect(onDone).toHaveBeenCalled();
    expect(host.textContent).not.toMatch(/Where you are|Neighbourhood|Street/);
  });
});

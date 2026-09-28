import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const rpc = vi.fn(async (fn) => {
  if (fn === 'search_schools_all') {
    return { data: [{ id: 'sch1', name: 'School A', town: 'Douala', on_platform: true, directory_id: null }], error: null };
  }
  if (fn === 'list_classes') return { data: [{ id: 'c1', name: 'Class A1' }], error: null };
  return { data: null, error: null };
});
vi.mock('../lib/supabase', () => ({ supabase: { rpc: (...a) => rpc(...a) } }));
const giveSchoolConsent = vi.fn(async () => {});
const stopSchoolSharing = vi.fn(async () => {});
vi.mock('../lib/dataRights', () => ({
  giveSchoolConsent: (...a) => giveSchoolConsent(...a),
  stopSchoolSharing: (...a) => stopSchoolSharing(...a),
}));

const { default: ParentOnboarding } = await import('./ParentOnboarding');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host, root;
beforeEach(() => {
  rpc.mockClear(); giveSchoolConsent.mockClear(); stopSchoolSharing.mockClear();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(text));
const flush = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const type = (el, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
const render = (props = {}) => act(() => root.render(
  <ParentOnboarding lang="en" studentId="s1" initialChildName="Amina"
                    onBack={() => {}} onDone={() => {}} {...props} />));
const fillChild = (age = '8') => {
  type(host.querySelector('#onb-age'), age);
  act(() => button('Girl').click());
};
const called = () => rpc.mock.calls.map((c) => c[0]);

describe('ParentOnboarding', () => {
  it('needs the child\'s age and gender before continuing', () => {
    render();
    expect(button('Continue').disabled).toBe(true);
    type(host.querySelector('#onb-age'), '8');
    expect(button('Continue').disabled).toBe(true);
    act(() => button('Girl').click());
    expect(button('Continue').disabled).toBe(false);
  });

  it('refuses an age outside childhood', () => {
    render();
    fillChild('45');
    expect(button('Continue').disabled).toBe(true);
  });

  it('asks for an age, not a birth date, and stores it as an estimated date', async () => {
    render();
    expect(host.querySelector('input[type="date"]')).toBeNull();
    fillChild('8');
    await act(async () => { button('Continue').click(); });
    await flush();
    const args = rpc.mock.calls.find((c) => c[0] === 'update_student_details')[1];
    expect(Number(args.p_dob.slice(0, 4))).toBe(new Date().getFullYear() - 8);
    expect(args.p_gender).toBe('female');
  });

  it('shares nothing with a school unless the parent ticks the box', async () => {
    render();
    expect(host.querySelector('#onb-school')).toBeNull();
    fillChild();
    await act(async () => { button('Continue').click(); });
    await flush();
    expect(called()).not.toContain('claim_school_place');
    expect(called()).not.toContain('note_school_interest');
    expect(giveSchoolConsent).not.toHaveBeenCalled();
  });

  it('shows the school picker only once the box is ticked', () => {
    render();
    act(() => host.querySelector('.consent-check input').click());
    expect(host.querySelector('#onb-school')).not.toBeNull();
  });

  it('withdraws school consent if the parent goes back and unticks the box', async () => {
    render();
    fillChild();
    act(() => host.querySelector('.consent-check input').click());
    act(() => host.querySelector('#onb-school').focus());
    await flush(300);
    await act(async () => { button('School A').click(); });
    await flush();
    const sel = host.querySelector('#onb-class');
    act(() => { sel.value = 'c1'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => { button('Continue').click(); });
    await flush();
    expect(giveSchoolConsent).toHaveBeenCalledWith('s1');
    expect(called()).toContain('claim_school_place');
    await act(async () => { button('Back').click(); });
    act(() => host.querySelector('.consent-check input').click());
    await act(async () => { button('Continue').click(); });
    await flush();
    expect(stopSchoolSharing).toHaveBeenCalledWith('s1');
  });

  it('needs the parent\'s name but not their phone, and never asks for an address', async () => {
    const onDone = vi.fn();
    render({ onDone });
    fillChild();
    await act(async () => { button('Continue').click(); });
    await flush();
    expect(button('Continue').disabled).toBe(true);
    type(host.querySelector('#onb-parent'), 'Ngozi Mbeki');
    expect(button('Continue').disabled).toBe(false);
    await act(async () => { button('Continue').click(); });
    await flush();
    expect(onDone).toHaveBeenCalled();
    expect(host.textContent).not.toMatch(/Where you are|Neighbourhood|Street/);
  });
});

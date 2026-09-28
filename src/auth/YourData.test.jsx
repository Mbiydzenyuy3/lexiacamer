import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const api = {
  exportChild: vi.fn(async () => ({ child: 'Amina' })),
  stopSchoolSharing: vi.fn(async () => {}),
  deleteChildData: vi.fn(async () => {}),
  deleteMyAccount: vi.fn(async () => {}),
  hasSchoolSharing: vi.fn(async () => false),
};
vi.mock('../lib/dataRights', () => ({
  exportChild: (...a) => api.exportChild(...a),
  stopSchoolSharing: (...a) => api.stopSchoolSharing(...a),
  deleteChildData: (...a) => api.deleteChildData(...a),
  deleteMyAccount: (...a) => api.deleteMyAccount(...a),
  hasSchoolSharing: (...a) => api.hasSchoolSharing(...a),
}));
const { default: YourData } = await import('./YourData');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => {
  Object.values(api).forEach((f) => f.mockClear());
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });

const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const render = (props = {}) => act(() => root.render(
  <YourData lang="en" studentId="s1" childName="Amina" isOffline={false}
            onChildDeleted={() => {}} onAccountDeleted={() => {}} {...props} />));

describe('YourData', () => {
  it('deletes the account in one step, so a failure leaves nothing half-done', async () => {
    api.deleteMyAccount.mockRejectedValueOnce(new Error('network'));
    const onChildDeleted = vi.fn(); const onAccountDeleted = vi.fn();
    render({ onChildDeleted, onAccountDeleted });
    await flush();
    await act(async () => { button("Delete Amina's data").click(); });
    act(() => host.querySelector('.consent-check input').click());
    await act(async () => { button('Delete').click(); });
    await flush();
    // The account deletion also deletes the child (0021, test C28), so the
    // child delete is not called separately; on failure, nothing changed and
    // the parent can simply try again.
    expect(api.deleteChildData).not.toHaveBeenCalled();
    expect(onChildDeleted).not.toHaveBeenCalled();
    expect(onAccountDeleted).not.toHaveBeenCalled();
    expect(host.textContent).toContain('That did not work');
  });

  it('treats a child already deleted elsewhere as deleted', async () => {
    api.deleteChildData.mockRejectedValueOnce({ code: '42501', message: 'not a guardian of this student' });
    const onChildDeleted = vi.fn();
    render({ onChildDeleted });
    await flush();
    await act(async () => { button("Delete Amina's data").click(); });
    await act(async () => { button('Delete').click(); });
    await flush();
    expect(onChildDeleted).toHaveBeenCalled();
  });

  it('keeps the download link alive until the browser has taken the file', async () => {
    const revoke = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = revoke;
    render();
    await flush();
    vi.useFakeTimers();
    await act(async () => { button('Download').click(); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(revoke).not.toHaveBeenCalled();
    act(() => { vi.runAllTimers(); });
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });
});

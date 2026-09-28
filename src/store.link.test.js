import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('./lib/supabase', () => ({
  supabase: { rpc: (...a) => rpc(...a) },
  isBackendConfigured: true,
}));

const { linkChild, syncOutbox, startLink, defaultState } = await import('./store');

const consented = (extra = {}) => ({
  ...defaultState(),
  user: { name: 'Amina', avatar: 'lion' },
  consent: { version: '2026-09-29', childAssent: true },
  ...extra,
});

beforeEach(() => rpc.mockReset());

describe('linkChild when the server copy is gone', () => {
  it('forgets the link when the child no longer exists for this parent', async () => {
    rpc.mockResolvedValue({ data: null,
      error: { code: '42501', message: 'no current access to this student' } });
    const next = await linkChild(consented({ studentId: 's1' }));
    expect(next.studentId).toBeNull();
    expect(next.consent).toBeNull();
  });

  it('keeps the link when the session merely expired', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'not authenticated' } });
    const next = await linkChild(consented({ studentId: 's1' }));
    expect(next.studentId).toBe('s1');
    expect(next.consent).not.toBeNull();
  });
});

describe('syncOutbox with a dead device token', () => {
  it('drops the token, keeps the events, so the next link can re-issue or forget', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'invalid device token' } });
    const s = consented({ studentId: 's1', deviceToken: 't',
      outbox: [{ id: 'e1', kind: 'word_completed', occurred_at: new Date().toISOString() }] });
    const next = await syncOutbox(s);
    expect(next.deviceToken).toBeNull();
    expect(next.outbox).toHaveLength(1);
  });
});

describe('startLink', () => {
  const ctx = (state) => ({ stateRef: { current: state }, linkingRef: { current: null }, write: vi.fn() });

  it('records the new ids immediately, so a re-run cannot create the child twice', async () => {
    const c = ctx(consented());
    const link = vi.fn(async (st) => ({ ...st, studentId: 's1', deviceToken: 't' }));
    await startLink(c, link);
    expect(c.stateRef.current.studentId).toBe('s1');
    expect(c.write).toHaveBeenCalledWith(expect.objectContaining({ studentId: 's1' }));
    await startLink(c, link);
    expect(link.mock.calls[1][0].studentId).toBe('s1');
  });

  it('shares one call between overlapping starts', async () => {
    const c = ctx(consented());
    const link = vi.fn(async (st) => ({ ...st, studentId: 's1', deviceToken: 't' }));
    await Promise.all([startLink(c, link), startLink(c, link)]);
    expect(link).toHaveBeenCalledTimes(1);
  });
});

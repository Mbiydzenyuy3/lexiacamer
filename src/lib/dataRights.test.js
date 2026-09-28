import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('./supabase', () => ({ supabase: { rpc: (...a) => rpc(...a) } }));

const { deleteChildData, stopSchoolSharing, giveSchoolConsent } = await import('./dataRights');

beforeEach(() => rpc.mockReset());

describe('dataRights', () => {
  it('deleting a child withdraws progress_sync for that child', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await deleteChildData('s1');
    expect(rpc).toHaveBeenCalledWith('withdraw_consent',
      { p_student_id: 's1', p_purpose: 'progress_sync' });
  });

  it('stopping school sharing withdraws school_share only', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await stopSchoolSharing('s1');
    expect(rpc).toHaveBeenCalledWith('withdraw_consent',
      { p_student_id: 's1', p_purpose: 'school_share' });
  });

  it('school consent is recorded with the current wording version', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await giveSchoolConsent('s1');
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_purpose: 'school_share' });
    expect(rpc.mock.calls[0][1].p_version).toBeTruthy();
  });

  it('a server error is thrown, never swallowed', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'nope' } });
    await expect(deleteChildData('s1')).rejects.toBeTruthy();
  });
});

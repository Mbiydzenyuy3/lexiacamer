/**
 * What a parent can do with their child's server data. Every call throws on
 * failure: a parent who pressed "delete" must never be told it worked when it
 * did not.
 */
import { supabase } from './supabase';
import { CONSENT_VERSION } from '../consentCopy';

async function call(fn, args) {
  if (!supabase) throw new Error('no backend');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

export const exportChild = (studentId) =>
  call('export_student', { p_student_id: studentId });

export const giveSchoolConsent = (studentId) =>
  call('give_consent', {
    p_student_id: studentId, p_purpose: 'school_share', p_version: CONSENT_VERSION,
  });

export const stopSchoolSharing = (studentId) =>
  call('withdraw_consent', { p_student_id: studentId, p_purpose: 'school_share' });

export const deleteChildData = (studentId) =>
  call('withdraw_consent', { p_student_id: studentId, p_purpose: 'progress_sync' });

export const deleteMyAccount = () => call('delete_my_account', {});

export async function hasSchoolSharing(studentId) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('consents')
    .select('id')
    .eq('student_id', studentId)
    .eq('purpose', 'school_share')
    .is('withdrawn_at', null)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

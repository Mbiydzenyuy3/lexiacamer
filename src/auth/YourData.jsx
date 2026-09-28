import React, { useEffect, useState } from 'react';
import { Download, Trash2, School } from 'lucide-react';
import { copyFor } from '../consentCopy';
import {
  exportChild, stopSchoolSharing, deleteChildData, deleteMyAccount, hasSchoolSharing,
} from '../lib/dataRights';
import { isGoneOnServer } from '../store';

/**
 * A parent's rights over the server copy, on the page they already use.
 * Every action needs the network and says so, rather than failing silently.
 */
export default function YourData({ lang, studentId, childName, isOffline, onChildDeleted, onAccountDeleted }) {
  const c = copyFor(lang);
  const n = childName || (lang === 'fr' ? 'votre enfant' : 'your child');
  const [sharing, setSharing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [alsoAccount, setAlsoAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!studentId || isOffline) return undefined;
    let off = false;
    hasSchoolSharing(studentId).then((v) => { if (!off) setSharing(v); }).catch(() => {});
    return () => { off = true; };
  }, [studentId, isOffline]);

  if (!studentId) return null;

  const run = async (fn) => {
    if (isOffline) { setMessage(c.needInternet); return; }
    setBusy(true);
    setMessage('');
    try { await fn(); } catch { setMessage(c.failed); } finally { setBusy(false); }
  };

  const download = () => run(async () => {
    const data = await exportChild(studentId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexiacamer-${n.replace(/[^\p{L}\p{N}_-]+/gu, '-')}.json`;
    a.click();
    // Not straight away: some Android browsers read the file after click()
    // returns, and a revoked link makes the download silently fail.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const stopSharing = () => run(async () => {
    await stopSchoolSharing(studentId);
    setSharing(false);
    setMessage(c.stopSchoolDone);
  });

  const remove = () => run(async () => {
    if (alsoAccount) {
      // One server step: deleting the account deletes the child with it. If it
      // fails, nothing has changed and the parent can simply try again.
      await deleteMyAccount();
      onAccountDeleted();
      return;
    }
    try {
      await deleteChildData(studentId);
    } catch (err) {
      // Already deleted, from another phone say: the result the parent wanted.
      if (!isGoneOnServer(err)) throw err;
    }
    onChildDeleted();
  });

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3 className="consent-h" style={{ marginTop: 0 }}>{c.dataTitle}</h3>

      <button type="button" className="btn btn-ghost your-data-btn" onClick={download} disabled={busy}>
        <Download size={18} /> {c.download(n)}
      </button>

      {sharing && (
        <button type="button" className="btn btn-ghost your-data-btn" onClick={stopSharing} disabled={busy}>
          <School size={18} /> {c.stopSchool(n)}
        </button>
      )}

      {!confirming ? (
        <button type="button" className="btn btn-ghost your-data-btn your-data-danger"
                onClick={() => setConfirming(true)} disabled={busy}>
          <Trash2 size={18} /> {c.delete(n)}
        </button>
      ) : (
        <div className="your-data-confirm">
          <p className="consent-p">{c.deleteConfirm(n)}</p>
          <label className="consent-check">
            <input type="checkbox" checked={alsoAccount}
                   onChange={(e) => setAlsoAccount(e.target.checked)} />
            <span>{c.deleteAccountToo}</span>
          </label>
          <div className="onb-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>
              {c.cancel}
            </button>
            <button type="button" className="btn your-data-danger-solid" onClick={remove} disabled={busy}>
              {c.confirmDelete}
            </button>
          </div>
        </div>
      )}

      {message && <p role="status" className="consent-p">{message}</p>}
    </div>
  );
}

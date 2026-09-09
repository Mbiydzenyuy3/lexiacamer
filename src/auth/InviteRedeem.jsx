import React, { useState, useEffect, useCallback } from 'react';
import { Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import SignIn from './SignIn';

/**
 * InviteRedeem: where /invite/<token> lands.
 *
 * An invite is the only route into a school's data, so this screen does as
 * little as possible. It does not reveal who the invite is for or which school
 * it belongs to before sign-in: the person holding the link already knows,
 * and anyone else should learn nothing from it.
 *
 * Redeeming requires being signed in AS the invited address. That is enforced
 * in redeem_invite(), not here, so a forwarded link fails for whoever receives
 * it even if they reach this screen.
 */
export default function InviteRedeem({ t, token, onDone, onBack }) {
  const { session } = useAuth();
  const [state, setState] = useState('idle');   // idle | working | done | failed
  const [message, setMessage] = useState('');

  const redeem = useCallback(async () => {
    if (!supabase || !token) return;
    setState('working');
    const { error } = await supabase.rpc('redeem_invite', { p_token: token });
    if (error) {
      setState('failed');
      // The server deliberately gives one message for invalid, expired, used
      // and wrong-recipient. Repeat that here rather than guessing which.
      setMessage(
        'This invitation could not be used. It may have expired, already been '
        + 'used, or been issued to a different email address. Ask for a new one.'
      );
      return;
    }
    setState('done');
  }, [token]);

  // Redeem as soon as there is a session. A director who signs in should not
  // then have to find a second button.
  useEffect(() => {
    if (session && state === 'idle') redeem();
  }, [session, state, redeem]);

  if (!session) {
    return (
      <>
        <div className="auth-card" style={{ marginBottom: '-0.5rem' }}>
          <p className="auth-intro">
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 3 }} />
            <span>
              You have been invited to join a school on LexiaCamer. Sign in with
              the email address the invitation was sent to.
            </span>
          </p>
        </div>
        <SignIn t={t} onBack={onBack} />
      </>
    );
  }

  return (
    <div className="screen">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {state === 'working' && <p className="auth-status">Accepting your invitation...</p>}

        {state === 'done' && (
          <>
            <div className="invite-icon is-ok"><Check size={32} /></div>
            <h2 className="onb-title">You are in</h2>
            <p className="onb-sub">
              Your school is set up. You can see your classes and how your
              pupils are getting on.
            </p>
            <button className="btn btn-primary onb-next" onClick={onDone}>
              Go to my school
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="invite-icon is-bad"><AlertTriangle size={32} /></div>
            <h2 className="onb-title">That invitation did not work</h2>
            <p className="auth-error" role="alert">{message}</p>
            <button className="btn btn-ghost onb-next" onClick={onBack}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isBackendConfigured } from '../lib/supabase';

/**
 * AuthProvider — the ADULT session only.
 *
 * Children never sign in. Kid mode runs with no account at all, which is both
 * the right thing for a 5-year-old and what keeps the app usable on a school
 * device with no connection. Everything here gates the parent/teacher side.
 *
 * With no backend configured this provides a null session and nothing breaks —
 * the offline path stays the default rather than becoming a fallback.
 */

const AuthContext = createContext({
  session: null,
  user: null,
  loading: false,
  available: false,
  signInWithOtp: async () => ({ error: new Error('no backend') }),
  verifyOtp: async () => ({ error: new Error('no backend') }),
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isBackendConfigured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data?.session ?? null);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    available: isBackendConfigured,

    // Sends a 6-digit code. shouldCreateUser is true because a parent's first
    // sign-in IS their sign-up — there is no separate registration step.
    signInWithOtp: async (email) => {
      if (!supabase) return { error: new Error('no backend configured') };
      return supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
    },

    verifyOtp: async (email, token) => {
      if (!supabase) return { error: new Error('no backend configured') };
      return supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'email',
      });
    },

    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
    },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

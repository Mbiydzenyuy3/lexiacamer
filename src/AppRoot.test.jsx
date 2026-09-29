import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import mainSource from './main.jsx?raw';

vi.mock('./lib/supabase', () => ({
  isBackendConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}));

// Stands in for the real App: shows whether it can see parent sign-in.
vi.mock('./App', async () => {
  const { useAuth } = await import('./auth/AuthProvider');
  return { default: function FakeApp() { return <p>{useAuth().available ? 'auth-on' : 'auth-off'}</p>; } };
});

const { default: AppRoot } = await import('./AppRoot');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('AppRoot', () => {
  it('gives the app parent sign-in when a backend is configured', async () => {
    const host = document.createElement('div');
    const root = createRoot(host);
    await act(async () => { root.render(<AppRoot />); });
    expect(host.textContent).toBe('auth-on');
    act(() => root.unmount());
  });

  it('is what the entry point loads, so a merge cannot drop sign-in again', () => {
    // 47fe657 took main's main.jsx and silently lost <AuthProvider>: every
    // screen then saw "no sign-in", and the Parents page opened for anyone.
    expect(mainSource).toMatch(/import\('\.\/AppRoot'\)/);
    expect(mainSource).not.toMatch(/import\('\.\/App'\)/);
  });
});

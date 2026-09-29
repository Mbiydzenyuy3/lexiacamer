import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import App from './App';

/**
 * The app with parent sign-in around it.
 *
 * AuthProvider lives here, inside the lazily loaded app chunk, and not in
 * main.jsx: it pulls in the Supabase client, and main.jsx keeps a first visit
 * down to the landing page on a weak connection. Without this wrapper every
 * screen sees "sign-in not available", and the Parents page opens for anyone.
 */
export default function AppRoot() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

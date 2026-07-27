import React from 'react';

/**
 * Catches any runtime render error so a single bug can't white-screen the whole
 * app — important because LexiaCamer runs embedded inside a partner platform.
 * Shows a calm, child-friendly recovery screen with a reload button. Progress is
 * saved in localStorage, so reloading keeps the child's stars/streak/words.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep a console trail for debugging; a real backend can log this later.
    console.error('LexiaCamer crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          background: 'var(--bg-body, #f0fdf4)',
          color: 'var(--text-primary, #1a2e05)',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }} aria-hidden="true">🌱</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Oops! Let's try that again
        </h1>
        <p style={{ maxWidth: '22rem', lineHeight: 1.6, marginBottom: '1.5rem', opacity: 0.8 }}>
          Something went wrong, but your stars and progress are safe. Tap the button to start fresh.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: '0.9rem 1.75rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#ffffff',
            background: 'var(--color-primary, #059669)',
            border: 'none',
            borderRadius: '9999px',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(5,150,105,0.3)',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}

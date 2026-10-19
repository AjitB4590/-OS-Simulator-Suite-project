/**
 * Application Error Boundary Component.
 * Catches JavaScript errors anywhere in its child component tree,
 * logs errors, and displays a resilient fallback UI instead of crashing the whole app.
 */

import React from 'react';
import { Card } from './Card.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep error logging for development diagnostics
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    try {
      localStorage.removeItem('ossim.memory.last_state.v1');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card title="Module Error Encountered" subtitle="A component error was safely intercepted">
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }} role="alert">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-rose)' }}>
              Simulation Exception
            </h3>
            <p style={{ maxWidth: '500px', margin: '0 auto 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              An unexpected error occurred while rendering this module. You can reset the module state or reload the page.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  maxWidth: '600px',
                  margin: '0 auto 1.5rem',
                  padding: '0.75rem',
                  background: 'var(--surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                  textAlign: 'left',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={this.handleReset}>
                Try Again
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
                Reload App
              </button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

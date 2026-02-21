'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              background: 'var(--background-color, #fff)',
              borderRadius: 20,
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
              padding: '2.5rem 2rem',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">
              ⚠
            </div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-color, #0f172a)',
                marginBottom: '0.5rem',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--text-light, #475569)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem 1.25rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#fff',
                background: 'var(--primary-color, #0052a3)',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

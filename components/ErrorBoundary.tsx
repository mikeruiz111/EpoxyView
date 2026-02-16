import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2em', color: '#ea580c', marginBottom: '20px' }}>Oops! Something went wrong.</h1>
          <p style={{ marginBottom: '20px', color: '#94a3b8' }}>An unexpected error occurred. Please try reloading the application.</p>
          <details style={{
            background: '#1e293b',
            border: '1px solid #334155',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '600px',
            marginBottom: '20px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              color: '#cbd5e1',
              marginTop: '10px',
              fontFamily: 'monospace'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '1em',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#ea580c',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

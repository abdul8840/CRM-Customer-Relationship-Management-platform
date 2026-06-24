import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
    if (window.Sentry) window.Sentry.captureException(error, { extra: info });
  }
  reset = () => { this.setState({ hasError: false, error: null }); window.location.href = '/'; };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-app">
          <div className="max-w-md text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-fg mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={this.reset} className="px-4 py-2 rounded-lg bg-[rgb(var(--primary))] text-white font-medium">Go to home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
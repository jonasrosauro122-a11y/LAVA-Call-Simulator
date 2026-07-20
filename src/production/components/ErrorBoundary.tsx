import { Component, type ErrorInfo, type ReactNode } from 'react';
import { metrics } from '../observability';
import { ErrorState } from './StateViews';

interface Props { children: ReactNode; fallback?: ReactNode; scope?: string; }
interface State { hasError: boolean; message?: string; }

// App-level error boundary — catches render errors, records them to observability, and
// shows a professional recovery UI instead of a blank screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    metrics.recordError(this.props.scope ?? 'react', `${error.message} @ ${info.componentStack?.split('\n')[1]?.trim() ?? ''}`);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-ink-100 dark:bg-ink-950">
          <ErrorState title="This view hit an error" message={this.state.message} onRetry={() => this.setState({ hasError: false })} />
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-[var(--color-brand-sand)] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[var(--color-brand-cream)] rounded-3xl p-8 border border-[var(--color-brand-stone)] text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-2">
                應用程式發生錯誤
              </h2>
              <p className="text-sm text-[var(--color-brand-espresso)]/60">
                {this.state.error?.message || '發生未預期的錯誤，請稍後再試。'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[var(--color-brand-espresso)] text-white rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-black transition-colors"
            >
              <RotateCcw size={18} />
              <span>重新載入</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

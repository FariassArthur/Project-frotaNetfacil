import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Algo deu errado</h2>
          <p className="text-[var(--text-muted)]">{this.state.error?.message || 'Erro inesperado'}</p>
          <button
            className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white shadow-lg"
            style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255, 125, 40, 0.2)' }}
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          >
            Voltar ao início
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

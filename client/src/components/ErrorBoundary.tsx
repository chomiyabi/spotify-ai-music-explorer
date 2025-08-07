import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // エラー報告サービスにログを送信
    // 例: Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRestart = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">申し訳ございません</h1>
            <p className="error-message">
              アプリケーションで予期しないエラーが発生しました
            </p>
            
            <div className="error-actions">
              <button
                onClick={this.handleRestart}
                className="error-button primary"
              >
                <span className="button-icon">🔄</span>
                再試行
              </button>
              <button
                onClick={this.handleReload}
                className="error-button secondary"
              >
                <span className="button-icon">↻</span>
                ページを再読み込み
              </button>
            </div>

            {/* 開発環境でのみエラー詳細を表示 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>エラー詳細（開発者向け）</summary>
                <div className="error-stack">
                  <h3>エラー:</h3>
                  <pre>{this.state.error?.toString()}</pre>
                  
                  <h3>スタックトレース:</h3>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="error-help">
              <h3>お困りですか？</h3>
              <ul className="help-list">
                <li>🔄 ページを再読み込みしてください</li>
                <li>🌐 インターネット接続を確認してください</li>
                <li>🧹 ブラウザのキャッシュをクリアしてください</li>
                <li>📱 別のブラウザで試してみてください</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
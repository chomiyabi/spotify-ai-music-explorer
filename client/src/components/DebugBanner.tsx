import React, { useState, useEffect } from 'react';

interface DebugLog {
  timestamp: string;
  type: 'info' | 'error' | 'warn' | 'success';
  message: string;
}

const DebugBanner: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // API URLを取得
    const isProd = window.location.hostname !== 'localhost';
    const url = isProd 
      ? 'https://spotify-ai-music-explorer-production.railway.app'
      : (process.env.REACT_APP_API_URL || 'http://localhost:5001');
    setApiUrl(url);

    // デバッグ情報を追加
    addLog('info', `Host: ${window.location.hostname}`);
    addLog('info', `API URL: ${url}`);
    addLog('info', `User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    addLog('info', `Screen: ${window.screen.width}x${window.screen.height}`);
    
    // グローバルエラーハンドラー
    const handleError = (event: ErrorEvent) => {
      addLog('error', `Error: ${event.message}`);
    };

    // Promiseエラーハンドラー
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `Promise Rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // console.logをインターセプト
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      if (message.includes('API') || message.includes('DJ') || message.includes('Audio')) {
        addLog('info', message.substring(0, 200));
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('error', message.substring(0, 200));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('warn', message.substring(0, 200));
    };

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const addLog = (type: DebugLog['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), { timestamp, type, message }]);
  };

  // APIヘルスチェック
  const checkAPIHealth = async () => {
    addLog('info', 'Checking API health...');
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      if (response.ok) {
        const data = await response.json();
        addLog('success', `API Health: ${JSON.stringify(data)}`);
      } else {
        addLog('error', `API Health Check Failed: ${response.status}`);
      }
    } catch (error: any) {
      addLog('error', `API Connection Failed: ${error.message}`);
    }
  };

  // DJ APIテスト
  const testDJAPI = async () => {
    addLog('info', 'Testing DJ API...');
    try {
      const response = await fetch(`${apiUrl}/api/dj/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      addLog('info', `DJ Response Status: ${response.status}`);
      addLog('info', `DJ Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      if (response.ok) {
        const blob = await response.blob();
        addLog('success', `DJ Audio Size: ${blob.size} bytes`);
      } else {
        addLog('error', `DJ API Failed: ${response.status}`);
      }
    } catch (error: any) {
      addLog('error', `DJ API Error: ${error.message}`);
    }
  };

  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'error': return '#ff4444';
      case 'warn': return '#ffaa00';
      case 'success': return '#00aa00';
      default: return '#0088ff';
    }
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile && window.location.hostname === 'localhost') {
    return null; // ローカル開発環境では非表示
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      zIndex: 9999,
      fontSize: '10px',
      fontFamily: 'monospace',
      maxHeight: isExpanded ? '50vh' : '40px',
      transition: 'max-height 0.3s ease',
      borderTop: '2px solid #00ff00',
    }}>
      <div style={{
        padding: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: isExpanded ? '1px solid #333' : 'none',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#00ff00', fontWeight: 'bold' }}>🐛 DEBUG</span>
          <span style={{ color: '#ffaa00' }}>{apiUrl.replace('https://', '').substring(0, 30)}...</span>
          <span style={{ color: '#00aaff' }}>{isMobile ? '📱 Mobile' : '💻 Desktop'}</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={checkAPIHealth}
            style={{
              padding: '2px 8px',
              backgroundColor: '#004400',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Health
          </button>
          <button
            onClick={testDJAPI}
            style={{
              padding: '2px 8px',
              backgroundColor: '#440044',
              color: '#ff00ff',
              border: '1px solid #ff00ff',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Test DJ
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '2px 8px',
              backgroundColor: '#003366',
              color: '#00aaff',
              border: '1px solid #00aaff',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? '▼ Hide' : '▲ Show'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          padding: '8px',
          overflowY: 'auto',
          maxHeight: 'calc(50vh - 40px)',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                padding: '2px 4px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderLeft: `3px solid ${getLogColor(log.type)}`,
              }}>
                <span style={{ color: '#666' }}>[{log.timestamp}]</span>
                <span style={{ color: getLogColor(log.type), marginLeft: '8px' }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DebugBanner;
import React, { useEffect, useState } from 'react';

const MobileDebug: React.FC = () => {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    // API URLと環境情報を収集
    const apiUrl = process.env.REACT_APP_API_URL || 'NOT_SET';
    const fullApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    
    setInfo({
      apiUrl: apiUrl,
      fullApiUrl: fullApiUrl,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      protocol: window.location.protocol,
      host: window.location.host,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });

    // ヘルスチェックを実行
    fetch(`${fullApiUrl}/health`)
      .then(res => {
        setInfo(prev => ({
          ...prev,
          healthStatus: res.status,
          healthOk: res.ok
        }));
        return res.text();
      })
      .then(text => {
        setInfo(prev => ({
          ...prev,
          healthResponse: text
        }));
      })
      .catch(error => {
        setInfo(prev => ({
          ...prev,
          healthError: error.message
        }));
      });
  }, []);

  // 常に表示（モバイルの場合）
  if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !window.location.search.includes('debug')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 0, 0, 0.9)',
      color: 'white',
      padding: '5px',
      fontSize: '10px',
      fontFamily: 'monospace',
      zIndex: 10000,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all'
    }}>
      <div>🔍 Debug Info:</div>
      <div>API: {info.apiUrl}</div>
      <div>Health: {info.healthOk ? '✅' : '❌'} {info.healthError || info.healthStatus || 'checking...'}</div>
      <div>Protocol: {info.protocol}</div>
      {info.healthError && <div style={{color: 'yellow'}}>Error: {info.healthError}</div>}
    </div>
  );
};

export default MobileDebug;
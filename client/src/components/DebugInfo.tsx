import React, { useEffect, useState } from 'react';
import apiService from '../services/api';

const DebugInfo: React.FC = () => {
  const [debugData, setDebugData] = useState<any>({
    apiUrl: process.env.REACT_APP_API_URL || 'Not set',
    nodeEnv: process.env.NODE_ENV,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    healthCheck: 'Checking...',
    error: null
  });

  useEffect(() => {
    // ヘルスチェック
    apiService.healthCheck()
      .then(response => {
        setDebugData(prev => ({
          ...prev,
          healthCheck: 'OK',
          healthResponse: response
        }));
      })
      .catch(error => {
        setDebugData(prev => ({
          ...prev,
          healthCheck: 'Failed',
          error: error.message,
          errorDetails: {
            status: error.response?.status,
            data: error.response?.data,
            config: {
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              method: error.config?.method
            }
          }
        }));
      });
  }, []);

  // デバッグモードの確認（URLに ?debug=true があるか）
  const isDebugMode = window.location.search.includes('debug=true') || 
                      window.location.search.includes('debug') ||
                      window.location.hash.includes('debug');
  
  if (!isDebugMode) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '10px',
      fontSize: '10px',
      fontFamily: 'monospace',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 9999
    }}>
      <div>Debug Info:</div>
      <pre style={{ margin: 0 }}>{JSON.stringify(debugData, null, 2)}</pre>
    </div>
  );
};

export default DebugInfo;
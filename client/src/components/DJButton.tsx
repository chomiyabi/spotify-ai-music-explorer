import React, { useState, useRef, useEffect } from 'react';

type DJState = 'idle' | 'loading' | 'playing' | 'paused';

interface DJButtonProps {
  onPlay?: () => void;
  className?: string;
}

const DJButton: React.FC<DJButtonProps> = ({ onPlay, className = '' }) => {
  const [state, setState] = useState<DJState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentArtists, setCurrentArtists] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const playbackMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  // 音声一時停止
  const pauseAudio = () => {
    console.log('=== PAUSE AUDIO CALLED ===');
    
    if (audioRef.current) {
      console.log('Pausing audio element');
      audioRef.current.pause();
      setState('paused');
    }
    
    console.log('=== PAUSE AUDIO COMPLETED ===');
  };
  
  // 音声再開
  const resumeAudio = () => {
    console.log('=== RESUME AUDIO CALLED ===');
    
    if (audioRef.current) {
      console.log('Resuming audio element');
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio: resumed successfully');
          setState('playing');
        }).catch((error) => {
          console.error('Audio resume error:', error);
          setError(`音声の再開に失敗しました: ${error.message}`);
        });
      }
    }
    
    console.log('=== RESUME AUDIO COMPLETED ===');
  };

  // DJボタンをクリックした時の処理
  const handleDJClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('=== DJ BUTTON CLICKED ===');
    console.log('Current state:', state);
    
    if (state === 'playing') {
      console.log('=== PAUSE BUTTON PRESSED ===');
      pauseAudio();
      return;
    }
    
    if (state === 'paused') {
      console.log('=== RESUME BUTTON PRESSED ===');
      resumeAudio();
      return;
    }

    if (state === 'loading') {
      console.log('Currently loading, ignoring click');
      return;
    }

    try {
      setState('loading');
      setError(null);
      isManuallyStoppedRef.current = false; // 新しい再生開始時にフラグをリセット
      onPlay?.();

      console.log('Requesting DJ voice generation...');
      
      // DJ統合APIを呼び出し
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const apiUrl = `${API_BASE_URL}/api/dj/play`;
      
      console.log('Calling DJ API:', apiUrl);
      console.log('=== MOBILE DEBUG: FETCH REQUEST START ===');
      console.log('User Agent:', navigator.userAgent);
      console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (fetchError: any) {
        console.error('=== FETCH ERROR ===');
        console.error('Error Type:', fetchError.name);
        console.error('Error Message:', fetchError.message);
        console.error('API URL:', apiUrl);
        console.error('Full Error:', fetchError);
        
        // ネットワークエラーの詳細な情報を提供
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
          throw new Error('ネットワークエラー: APIサーバーに接続できません。Railway環境変数が設定されているか確認してください。');
        } else if (fetchError.message.includes('CORS')) {
          throw new Error('CORS エラー: サーバー設定を確認してください。');
        } else if (fetchError.message.includes('NetworkError')) {
          throw new Error('ネットワークエラー: インターネット接続を確認してください。');
        } else {
          throw new Error(`接続エラー: ${fetchError.message}`);
        }
      }

      console.log('=== MOBILE DEBUG: FETCH RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Status Text:', response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // より詳細なHTTPエラーメッセージ
        if (response.status === 500) {
          const errorText = await response.text();
          console.error('Server Error Response:', errorText);
          throw new Error('サーバーエラー: AI DJ機能が一時的に利用できません。Railway環境変数を確認してください。');
        } else if (response.status === 503) {
          throw new Error('サービス利用不可: サーバーがメンテナンス中の可能性があります。');
        } else if (response.status === 404) {
          throw new Error('エンドポイントが見つかりません: APIルートを確認してください。');
        } else {
          throw new Error(`HTTP エラー ${response.status}: ${response.statusText}`);
        }
      }

      // レスポンスヘッダーからアーティスト情報を取得
      const artists = response.headers.get('X-DJ-Artists');
      if (artists) {
        setCurrentArtists(artists);
      }

      // レスポンスの詳細情報をログ出力
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response type:', response.type);

      // 音声データをBlobとして取得
      console.log('=== MOBILE DEBUG: AUDIO BLOB PROCESSING ===');
      const audioBlob = await response.blob();
      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);
      console.log('Audio blob valid:', audioBlob.size > 0);
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Audio URL created:', audioUrl);
      console.log('Blob URL valid:', audioUrl.startsWith('blob:'));

      // 古いAudio要素をクリーンアップ
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      console.log('=== MOBILE DEBUG: AUDIO ELEMENT SETUP ===');
      const audio = new Audio();
      audioRef.current = audio;
      
      // 音声再生の設定（モバイル対応）
      audio.preload = 'auto';
      audio.volume = 0.8;
      audio.crossOrigin = 'anonymous'; // CORS対応
      
      // モバイルブラウザ対応の設定
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      console.log('Audio element configured:', {
        preload: audio.preload,
        volume: audio.volume,
        crossOrigin: audio.crossOrigin,
        playsinline: audio.getAttribute('playsinline'),
        webkitPlaysinline: audio.getAttribute('webkit-playsinline')
      });

      // 音声イベントリスナーを設定
      const handleCanPlay = () => {
        console.log('Audio: canplay event fired, isManuallyStoppedRef:', isManuallyStoppedRef.current);
        
        // 手動停止された場合は再生しない
        if (isManuallyStoppedRef.current) {
          console.log('Audio: canplay ignored - manually stopped');
          return;
        }
        
        console.log('Audio: canplay - attempting to play');
        setIsAudioLoaded(true);
        setState('playing');
        
        // 再生開始（モバイル対応）
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Audio: play started successfully');
          }).catch((error) => {
            console.error('Audio play error:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              code: error.code
            });
            
            // モバイルブラウザでの自動再生失敗時の対応
            if (error.name === 'NotAllowedError') {
              setError('音声再生にはユーザー操作が必要です。もう一度ボタンを押してください。');
            } else {
              setError(`音声の再生に失敗しました: ${error.message}`);
            }
            setState('idle');
          });
        }
      };

      const handleTimeUpdate = () => {
        if (audio && !isNaN(audio.currentTime)) {
          const newCurrentTime = audio.currentTime;
          const newDuration = audio.duration || 0;
          
          setCurrentTime(newCurrentTime);
          if (!isNaN(newDuration) && newDuration > 0) {
            setDuration(newDuration);
          }
          
          console.log(`Time update: ${newCurrentTime.toFixed(1)}s / ${newDuration.toFixed(1)}s`);
        }
      };

      const handleLoadedMetadata = () => {
        if (audio && !isNaN(audio.duration)) {
          const newDuration = audio.duration;
          setDuration(newDuration);
          console.log('Audio: loadedmetadata - duration:', newDuration);
        }
      };

      const handleEnded = () => {
        console.log('Audio: ended normally');
        isManuallyStoppedRef.current = false; // 正常終了時にフラグをリセット
        setState('idle');
        setIsAudioLoaded(false);
        setCurrentTime(0);
        setDuration(0);
        URL.revokeObjectURL(audioUrl);
        
        // プレイバック監視を停止
        if (playbackMonitorRef.current) {
          clearInterval(playbackMonitorRef.current);
          playbackMonitorRef.current = null;
        }
        
        audioRef.current = null;
      };

      const handleError = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        console.error('Audio error event:', e);
        console.error('Audio error code:', target.error?.code);
        console.error('Audio error message:', target.error?.message);
        
        // 手動停止によるエラーの場合は無視
        if (isManuallyStoppedRef.current && target.error?.code === 4) {
          console.log('Ignoring error - audio was manually stopped');
          return;
        }
        
        setError(`音声の読み込みに失敗しました (Code: ${target.error?.code})`);
        isManuallyStoppedRef.current = false;
        setState('idle');
        setIsAudioLoaded(false);
        setCurrentTime(0);
        setDuration(0);
        
        // プレイバック監視を停止
        if (playbackMonitorRef.current) {
          clearInterval(playbackMonitorRef.current);
          playbackMonitorRef.current = null;
        }
        
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      const handlePause = () => {
        console.log('Audio: paused');
        if (isManuallyStoppedRef.current) {
          console.log('Audio paused manually by user');
        }
      };

      const handleStalled = () => {
        console.log('Audio: stalled - network issue detected');
      };

      const handleSuspend = () => {
        console.log('Audio: suspend - loading suspended');
      };

      // イベントリスナーを追加
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('stalled', handleStalled);
      audio.addEventListener('suspend', handleSuspend);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      audio.addEventListener('loadstart', () => {
        console.log('Audio: loadstart');
      });

      audio.addEventListener('loadeddata', () => {
        console.log('Audio: loadeddata - ready to play');
      });

      // 音声ソースを設定
      console.log('=== MOBILE DEBUG: AUDIO SOURCE SETUP ===');
      audio.src = audioUrl;
      console.log('Audio src set:', audio.src);
      console.log('Audio readyState before load:', audio.readyState);
      console.log('Audio networkState before load:', audio.networkState);
      
      console.log('Starting audio load...');
      audio.load();
      
      console.log('Audio readyState after load:', audio.readyState);
      console.log('Audio networkState after load:', audio.networkState);

      // デバッグ用: 音声要素をDOMに一時的に追加（本番環境でも有効）
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true') {
        audio.style.position = 'fixed';
        audio.style.top = '10px';
        audio.style.right = '10px';
        audio.style.zIndex = '9999';
        audio.style.backgroundColor = 'white';
        audio.style.border = '2px solid #green';
        document.body.appendChild(audio);
        
        // 10秒後に削除
        setTimeout(() => {
          if (document.body.contains(audio)) {
            document.body.removeChild(audio);
          }
        }, 10000);
      }

    } catch (error: any) {
      console.error('DJ API error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        status: error.status,
        type: error.type
      });
      
      // エラーの種類に応じた適切なメッセージ
      let errorMessage = 'AI DJ機能でエラーが発生しました';
      
      if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
        errorMessage = 'ネットワークエラーです。接続を確認してください。';
      } else if (error.status === 500) {
        errorMessage = 'サーバーエラーです。しばらく待ってから再試行してください。';
      } else if (error.status === 429) {
        errorMessage = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setState('idle');
    }
  };

  // コンポーネントがアンマウントされる時のクリーンアップ
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (playbackMonitorRef.current) {
        clearInterval(playbackMonitorRef.current);
        playbackMonitorRef.current = null;
      }
    };
  }, []);

  // ボタンの状態クラスを決定
  const getButtonStateClass = () => {
    switch (state) {
      case 'loading':
        return 'loading';
      case 'playing':
        return 'playing';
      case 'paused':
        return 'paused';
      default:
        return 'idle';
    }
  };

  // ボタン内のテキストを状態に応じて決定
  const renderButtonContent = () => {
    switch (state) {
      case 'loading':
        return '⏳';
      case 'playing':
        return '⏹️';
      case 'paused':
        return '▶️';
      default:
        return '🎙️';
    }
  };

  // ボタンの表示テキストを状態に応じて決定
  const getButtonText = () => {
    switch (state) {
      case 'loading':
        return '音声生成中...';
      case 'playing':
        return '停止';
      case 'paused':
        return '再開';
      default:
        return 'AI DJ';
    }
  };

  return (
    <section className="ai-dj-section">
      <div className="container">
        <h2 className="section-title">
          <span className="ai-icon">🎙️</span>
          AI ラジオDJ
        </h2>
        <p className="section-description">
          今日の人気楽曲を元にAIが生成したオリジナルのDJトークを音声でお届け
        </p>

        {/* DJコントロールエリア */}
        <div className="dj-control-area">
          {/* メインDJボタン */}
          <button
            onClick={handleDJClick}
            disabled={state === 'loading'}
            className={`dj-main-button ${getButtonStateClass()}`}
            title={state === 'idle' ? 'AI DJを開始' : state === 'loading' ? '音声生成中...' : state === 'playing' ? '一時停止' : '再開'}
            style={{ 
              cursor: state === 'playing' ? 'pointer' : (state === 'loading' ? 'not-allowed' : 'pointer'),
              pointerEvents: 'auto'
            }}
          >
            <div className="dj-button-icon">
              {renderButtonContent()}
            </div>
            <div className="dj-button-label">
              {getButtonText()}
            </div>
          </button>

          {/* 再生状態表示 */}
          {state !== 'idle' && (
            <div className="dj-status-display">
              {state === 'loading' && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>AI DJトーク生成中...</span>
                </div>
              )}
              
              {(state === 'playing' || state === 'paused') && (
                <div className="playing-info">
                  <div className="audio-waves">
                    <span className="wave"></span>
                    <span className="wave"></span>
                    <span className="wave"></span>
                    <span className="wave"></span>
                  </div>
                  <div className="playing-text">
                    <div className="now-playing">🎵 {state === 'playing' ? 'ON AIR' : 'STOP'}</div>
                    {currentArtists && (
                      <div className="artist-info">今日のトップ: {currentArtists}</div>
                    )}
                    <div className="time-display">
                      {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI DJ機能の説明 */}
        <div className="ai-features">
          <h3 className="features-title">AI DJ機能の特徴</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎵</div>
              <div className="feature-content">
                <h4>リアルタイム楽曲分析</h4>
                <p>Spotifyの最新チャートから人気楽曲を自動取得</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🗣️</div>
              <div className="feature-content">
                <h4>AI音声生成</h4>
                <p>楽曲情報を元にオリジナルのDJトークを生成</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📻</div>
              <div className="feature-content">
                <h4>本格ラジオ体験</h4>
                <p>プロのDJのような自然な音声でお届け</p>
              </div>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* デバッグ情報（開発環境・モバイルデバッグ時） */}
        {(process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true') && (
          <div className="debug-info" style={{
            background: '#333',
            color: '#fff',
            padding: '10px',
            margin: '10px 0',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div>State: {state} | Audio: {isAudioLoaded ? 'loaded' : 'not loaded'}</div>
            <div>User Agent: {navigator.userAgent}</div>
            <div>Is Mobile: {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Yes' : 'No'}</div>
            <div>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:5001'}</div>
            <div>Debug Mode: {process.env.REACT_APP_DEBUG || 'false'}</div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DJButton;
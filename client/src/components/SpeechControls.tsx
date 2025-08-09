import React, { useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface SpeechControlsProps {
  text: string;
  className?: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

const SpeechControls: React.FC<SpeechControlsProps> = ({
  text,
  className = '',
  onSpeechStart,
  onSpeechEnd
}) => {
  const {
    speak,
    pause,
    resume,
    stop,
    speaking,
    paused,
    supported,
    voices,
    settings,
    updateSettings,
    progress
  } = useSpeechSynthesis();

  const [showSettings, setShowSettings] = useState(false);

  const handleSpeak = () => {
    if (!speaking) {
      onSpeechStart?.();
      speak(text);
    } else if (paused) {
      resume();
    } else {
      pause();
    }
  };

  const handleStop = () => {
    stop();
    onSpeechEnd?.();
  };

  if (!supported) {
    return (
      <div className={`speech-controls unsupported ${className}`}>
        <span className="speech-unsupported-message">
          ❌ お使いのブラウザは音声読み上げに対応していません
        </span>
      </div>
    );
  }

  return (
    <div className={`speech-controls ${className}`}>
      {/* メイン制御ボタン */}
      <div className="speech-main-controls">
        <button 
          className={`speech-button ${speaking ? 'speaking' : ''} ${paused ? 'paused' : ''}`}
          onClick={handleSpeak}
          disabled={!text.trim()}
          title={speaking ? (paused ? '再開' : '一時停止') : '音声再生'}
        >
          {speaking ? (paused ? '▶️' : '⏸️') : '🔊'}
          <span className="speech-button-text">
            {speaking ? (paused ? '再開' : '一時停止') : '音声再生'}
          </span>
        </button>

        {speaking && (
          <button 
            className="speech-button stop"
            onClick={handleStop}
            title="停止"
          >
            ⏹️
            <span className="speech-button-text">停止</span>
          </button>
        )}

        <button 
          className={`speech-button settings ${showSettings ? 'active' : ''}`}
          onClick={() => setShowSettings(!showSettings)}
          title="音声設定"
        >
          ⚙️
          <span className="speech-button-text">設定</span>
        </button>
      </div>

      {/* 進捗バー */}
      {speaking && progress.total > 0 && (
        <div className="speech-progress">
          <div className="speech-progress-bar">
            <div 
              className="speech-progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="speech-progress-text">
            {progress.current} / {progress.total} 文字 ({progress.percentage}%)
          </div>
        </div>
      )}

      {/* 設定パネル */}
      {showSettings && (
        <div className="speech-settings-panel">
          <h4 className="speech-settings-title">🎵 音声設定</h4>
          
          {/* 速度設定 */}
          <div className="speech-setting-group">
            <label className="speech-setting-label">
              速度: {settings.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.rate}
              onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
              className="speech-setting-slider"
            />
            <div className="speech-setting-marks">
              <span>遅い</span>
              <span>標準</span>
              <span>速い</span>
            </div>
          </div>

          {/* 音程設定 */}
          <div className="speech-setting-group">
            <label className="speech-setting-label">
              音程: {settings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
              className="speech-setting-slider"
            />
            <div className="speech-setting-marks">
              <span>低い</span>
              <span>標準</span>
              <span>高い</span>
            </div>
          </div>

          {/* 音量設定 */}
          <div className="speech-setting-group">
            <label className="speech-setting-label">
              音量: {Math.round(settings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="speech-setting-slider"
            />
            <div className="speech-setting-marks">
              <span>静か</span>
              <span>標準</span>
              <span>大音量</span>
            </div>
          </div>

          {/* 音声選択 */}
          {voices.length > 0 && (
            <div className="speech-setting-group">
              <label className="speech-setting-label">音声:</label>
              <select
                value={settings.voice?.name || ''}
                onChange={(e) => {
                  const selectedVoice = voices.find(v => v.name === e.target.value);
                  updateSettings({ voice: selectedVoice || null });
                }}
                className="speech-setting-select"
              >
                {voices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* プリセット */}
          <div className="speech-setting-group">
            <label className="speech-setting-label">プリセット:</label>
            <div className="speech-presets">
              <button 
                className="speech-preset-button"
                onClick={() => updateSettings({ rate: 0.85, pitch: 1.05, volume: 0.9 })}
                title="DJ風の親しみやすい設定"
              >
                🎙️ DJ風
              </button>
              <button 
                className="speech-preset-button"
                onClick={() => updateSettings({ rate: 1.1, pitch: 0.95, volume: 0.95 })}
                title="ニュースアナウンサー風の明瞭な設定"
              >
                📰 ニュース風
              </button>
              <button 
                className="speech-preset-button"
                onClick={() => updateSettings({ rate: 0.75, pitch: 1.15, volume: 0.85 })}
                title="ゆっくりで聞き取りやすい設定"
              >
                🐢 ゆっくり
              </button>
              <button 
                className="speech-preset-button"
                onClick={() => updateSettings({ rate: 1.3, pitch: 0.9, volume: 1.0 })}
                title="速くて効率的な設定"
              >
                🚀 早口
              </button>
              <button 
                className="speech-preset-button"
                onClick={() => updateSettings({ rate: 1.0, pitch: 1.0, volume: 1.0 })}
                title="標準設定に戻す"
              >
                🔄 標準
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechControls;
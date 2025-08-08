import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../context/AppContext';

interface TrackDetailModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ExtendedTrackInfo {
  duration_ms?: number;
  key?: number;
  mode?: number;
  tempo?: number;
  time_signature?: number;
  acousticness?: number;
  danceability?: number;
  energy?: number;
  instrumentalness?: number;
  liveness?: number;
  loudness?: number;
  speechiness?: number;
  valence?: number;
  release_date?: string;
  total_tracks?: number;
  label?: string;
  genres?: string[];
}

const TrackDetailModal: React.FC<TrackDetailModalProps> = ({ track, isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [extendedInfo, setExtendedInfo] = useState<ExtendedTrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 外部クリックでモーダルを閉じる
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 楽曲詳細情報の取得（将来のAPI拡張用）
  useEffect(() => {
    if (track && isOpen) {
      // 現時点では基本情報のみ表示
      // 将来的にSpotify API の /tracks/{id} や /audio-features/{id} を呼び出し
      setExtendedInfo({
        duration_ms: 30000, // プレビューは30秒
        release_date: '2024',
        // その他の情報は現在取得できないため空にしておく
      });
    }
  }, [track, isOpen]);

  const handlePreviewPlay = async () => {
    if (!track?.preview_url || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Audio play failed:', error);
      }
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '不明';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPopularityColor = (popularity?: number) => {
    if (!popularity) return '#666';
    if (popularity >= 80) return '#1DB954';
    if (popularity >= 60) return '#1ed760';
    if (popularity >= 40) return '#FFA500';
    return '#FF6B6B';
  };

  const getPopularityText = (popularity?: number) => {
    if (!popularity) return '不明';
    if (popularity >= 80) return '大人気';
    if (popularity >= 60) return '人気';
    if (popularity >= 40) return '注目';
    return '新進';
  };

  if (!isOpen || !track) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      {/* オーディオ要素 */}
      {track.preview_url && (
        <audio 
          ref={audioRef}
          src={track.preview_url}
          onEnded={handleAudioEnd}
          preload="none"
        />
      )}
      
      <div className="track-detail-modal" ref={modalRef}>
        {/* ヘッダー */}
        <div className="modal-header">
          <h2 className="modal-title">楽曲詳細</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="modal-content">
          <div className="track-hero">
            {/* アルバムアートワーク（大） */}
            <div className="track-artwork">
              {track.image ? (
                <img 
                  src={track.image} 
                  alt={track.name}
                  className="artwork-image"
                />
              ) : (
                <div className="artwork-placeholder">
                  <span className="music-icon">🎵</span>
                </div>
              )}
            </div>

            {/* 基本情報 */}
            <div className="track-info">
              <h3 className="track-name">{track.name}</h3>
              <p className="track-artist">{track.artists}</p>
              <p className="track-album">{track.album}</p>
              
              {/* 人気度 */}
              {track.popularity !== undefined && (
                <div className="popularity-section">
                  <div className="popularity-indicator">
                    <span 
                      className="popularity-dot"
                      style={{ backgroundColor: getPopularityColor(track.popularity) }}
                    ></span>
                    <span className="popularity-label">
                      {getPopularityText(track.popularity)} ({track.popularity}/100)
                    </span>
                  </div>
                  <div className="popularity-bar">
                    <div 
                      className="popularity-fill"
                      style={{ 
                        width: `${track.popularity}%`,
                        backgroundColor: getPopularityColor(track.popularity)
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* プレビュー再生 */}
              {track.preview_url && (
                <div className="preview-section">
                  <button 
                    className={`preview-play-btn-large ${isPlaying ? 'playing' : ''}`}
                    onClick={handlePreviewPlay}
                  >
                    <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                    <span className="play-text">
                      {isPlaying ? '停止' : '30秒プレビュー再生'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 詳細情報セクション */}
          <div className="track-details-sections">
            <div className="detail-section">
              <h4 className="section-title">基本情報</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">楽曲名</span>
                  <span className="detail-value">{track.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">アーティスト</span>
                  <span className="detail-value">{track.artists}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">アルバム</span>
                  <span className="detail-value">{track.album}</span>
                </div>
                {track.position && (
                  <div className="detail-item">
                    <span className="detail-label">ランキング</span>
                    <span className="detail-value">#{track.position}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">人気度</span>
                  <span className="detail-value">
                    {track.popularity ? `${track.popularity}/100` : '不明'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">プレビュー</span>
                  <span className="detail-value">
                    {track.preview_url ? '利用可能' : '利用不可'}
                  </span>
                </div>
              </div>
            </div>

            {/* 将来の拡張用: オーディオ特徴 */}
            {extendedInfo && (
              <div className="detail-section">
                <h4 className="section-title">追加情報</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">長さ</span>
                    <span className="detail-value">
                      {formatDuration(extendedInfo.duration_ms)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">リリース年</span>
                    <span className="detail-value">
                      {extendedInfo.release_date || '不明'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="modal-actions">
            <button 
              className="action-btn spotify-btn-large"
              onClick={() => {
                if (track.external_url) {
                  window.open(track.external_url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              <span className="btn-icon">♫</span>
              <span className="btn-text">Spotifyで開く</span>
            </button>
            
            {track.preview_url && (
              <button 
                className={`action-btn preview-btn-large ${isPlaying ? 'playing' : ''}`}
                onClick={handlePreviewPlay}
              >
                <span className="btn-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                <span className="btn-text">
                  {isPlaying ? '停止' : 'プレビュー再生'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDetailModal;
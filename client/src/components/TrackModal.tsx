import React, { useEffect } from 'react';
import { Track } from '../context/AppContext';

interface TrackModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

const TrackModal: React.FC<TrackModalProps> = ({ track, isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSpotifyClick = () => {
    if (track.external_url) {
      window.open(track.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  const getGenreFromArtists = (artists: string) => {
    // 簡単なジャンル推定ロジック
    const artistLower = artists.toLowerCase();
    if (artistLower.includes('bts') || artistLower.includes('blackpink')) return 'K-POP';
    if (artistLower.includes('mrs') || artistLower.includes('green apple')) return 'J-POP';
    if (artistLower.includes('billie') || artistLower.includes('eilish')) return 'Pop';
    return 'その他';
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
        
        <div className="modal-header">
          <div className="modal-image">
            {track.image ? (
              <img src={track.image} alt={track.name} />
            ) : (
              <div className="modal-image-placeholder">
                <span className="music-icon-large">🎵</span>
              </div>
            )}
          </div>
          
          <div className="modal-info">
            <h2 className="modal-title">{track.name}</h2>
            <p className="modal-artists">{track.artists}</p>
            <p className="modal-album">{track.album}</p>
            
            {track.position && (
              <div className="modal-position">
                ランキング #{track.position}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-stats">
            <div className="stat-grid">
              {track.popularity !== undefined && (
                <div className="stat-item">
                  <label>人気度</label>
                  <div className="popularity-bar">
                    <div 
                      className="popularity-fill"
                      style={{ width: `${track.popularity}%` }}
                    ></div>
                    <span className="popularity-value">{track.popularity}/100</span>
                  </div>
                </div>
              )}
              
              <div className="stat-item">
                <label>ジャンル</label>
                <span className="stat-value">{getGenreFromArtists(track.artists)}</span>
              </div>
              
              <div className="stat-item">
                <label>プレビュー</label>
                <span className="stat-value">
                  {track.preview_url ? '利用可能' : '利用不可'}
                </span>
              </div>
              
              {track.external_url && (
                <div className="stat-item">
                  <label>Spotify ID</label>
                  <span className="stat-value track-id">
                    {track.id}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              className="modal-btn primary"
              onClick={handleSpotifyClick}
            >
              <span className="btn-icon">♫</span>
              Spotifyで再生
            </button>
            
            {track.preview_url && (
              <button className="modal-btn secondary">
                <span className="btn-icon">▶️</span>
                30秒プレビュー
              </button>
            )}
            
            <button className="modal-btn tertiary">
              <span className="btn-icon">💾</span>
              お気に入りに追加
            </button>
          </div>
        </div>
        
        <div className="modal-footer">
          <p className="modal-disclaimer">
            このデータはSpotify Web APIから取得されています。
            実際の楽曲情報と異なる場合があります。
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrackModal;
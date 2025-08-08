import React, { useState, useRef, memo } from 'react';
import { Track } from '../context/AppContext';

interface EnhancedTrackCardProps {
  track: Track;
  showPosition?: boolean;
  onTrackSelect?: (track: Track) => void;
}

const EnhancedTrackCard: React.FC<EnhancedTrackCardProps> = ({ 
  track, 
  showPosition = true,
  onTrackSelect 
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpotifyClick = () => {
    if (track.external_url) {
      window.open(track.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePreviewPlay = async () => {
    if (!track.preview_url) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio play failed:', error);
        }
      }
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleCardClick = () => {
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTrackSelect) {
      onTrackSelect(track);
    }
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

  return (
    <div 
      className="enhanced-track-card"
      onClick={handleCardClick}
    >
      {/* Audio element for preview */}
      {track.preview_url && (
        <audio 
          ref={audioRef}
          src={track.preview_url}
          onEnded={handleAudioEnd}
          preload="none"
        />
      )}

      {/* Position badge */}
      {showPosition && track.position && (
        <div className="position-badge">
          #{track.position}
        </div>
      )}

      {/* Main card content */}
      <div className="card-header">
        <div className="track-image-container">
          {track.image ? (
            <>
              <img 
                src={track.image} 
                alt={track.name}
                onLoad={() => setIsImageLoaded(true)}
                className={`track-image ${isImageLoaded ? 'loaded' : ''}`}
              />
              {!isImageLoaded && <div className="image-skeleton"></div>}
              
              {/* Overlay with play button */}
              <div className="image-overlay">
                {track.preview_url && (
                  <button 
                    className={`preview-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewPlay();
                    }}
                    title={isPlaying ? '一時停止' : 'プレビュー再生'}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="track-image-placeholder">
              <span className="music-icon">🎵</span>
            </div>
          )}
        </div>
        
        <div className="track-main-info">
          <h3 className="track-title" title={track.name}>
            {track.name}
          </h3>
          <p className="track-artists" title={track.artists}>
            {track.artists}
          </p>
          <p className="track-album" title={track.album}>
            {track.album}
          </p>
        </div>
      </div>

      {/* Expandable details section */}
      <div className="card-details">
        <div className="track-stats">
          {track.popularity !== undefined && (
            <div className="popularity-indicator">
              <span 
                className="popularity-dot"
                style={{ backgroundColor: getPopularityColor(track.popularity) }}
              ></span>
              <span className="popularity-text">
                {getPopularityText(track.popularity)} ({track.popularity}/100)
              </span>
            </div>
          )}
        </div>
        
        <div className="card-actions">
          <button 
            className="action-btn spotify-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSpotifyClick();
            }}
            title="Spotifyで開く"
          >
            <span className="btn-icon">♫</span>
            <span className="btn-text">Spotifyで開く</span>
          </button>
          
          {track.preview_url && (
            <button 
              className={`action-btn preview-btn ${isPlaying ? 'playing' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewPlay();
              }}
              title={isPlaying ? '停止' : '30秒プレビュー'}
            >
              <span className="btn-icon">{isPlaying ? '⏸️' : '▶️'}</span>
              <span className="btn-text">
                {isPlaying ? '停止' : 'プレビュー'}
              </span>
            </button>
          )}
          
          <button 
            className="action-btn details-btn"
            onClick={handleDetailsClick}
            title="詳細表示"
          >
            <span className="btn-icon">ⓘ</span>
            <span className="btn-text">詳細</span>
          </button>
        </div>
      </div>

      {/* Progress bar for preview playback */}
      {isPlaying && track.preview_url && (
        <div className="playback-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(EnhancedTrackCard, (prevProps, nextProps) => {
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.showPosition === nextProps.showPosition
  );
});
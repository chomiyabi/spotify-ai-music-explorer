import React from 'react';
import { Track } from '../context/AppContext';

interface TrackCardProps {
  track: Track;
  showPosition?: boolean;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, showPosition = true }) => {
  const handleSpotifyClick = () => {
    if (track.external_url) {
      window.open(track.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="track-card">
      {showPosition && track.position && (
        <div className="track-position">#{track.position}</div>
      )}
      
      <div className="track-image">
        {track.image ? (
          <img src={track.image} alt={track.name} />
        ) : (
          <div className="track-image-placeholder">🎵</div>
        )}
      </div>
      
      <div className="track-info">
        <h3 className="track-name">{track.name}</h3>
        <p className="track-artists">{track.artists}</p>
        <p className="track-album">{track.album}</p>
        
        {track.popularity && (
          <div className="track-popularity">
            人気度: {track.popularity}/100
          </div>
        )}
      </div>
      
      <div className="track-actions">
        {track.external_url && (
          <button 
            className="spotify-button"
            onClick={handleSpotifyClick}
            title="Spotifyで開く"
          >
            <span className="spotify-icon">♫</span>
            再生
          </button>
        )}
        
        {track.preview_url && (
          <button 
            className="preview-button"
            title="プレビュー再生"
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
};

export default TrackCard;
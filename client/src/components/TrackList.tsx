import React from 'react';
import { useAppContext } from '../context/AppContext';
import TrackCard from './TrackCard';
import LoadingSpinner from './LoadingSpinner';
import { LoadingGrid } from './LoadingCard';

const TrackList: React.FC = () => {
  const { state } = useAppContext();

  if (state.isLoading) {
    return (
      <div className="track-list-container">
        <LoadingSpinner size="large" message="データを取得中..." />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>エラーが発生しました</h3>
          <p>{state.error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!state.currentData || !state.currentData.tracks || state.currentData.tracks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-message">
          <h3>データがありません</h3>
          <p>プリセットボタンをクリックして音楽データを取得してください</p>
        </div>
      </div>
    );
  }

  const { currentData } = state;

  return (
    <div className="track-list-container">
      <div className="playlist-header">
        <h2 className="playlist-title">{currentData.playlist_name}</h2>
        {currentData.playlist_description && (
          <p className="playlist-description">{currentData.playlist_description}</p>
        )}
        <div className="playlist-stats">
          <span className="track-count">
            {currentData.tracks?.length || 0} 曲
          </span>
          {currentData.total && (
            <span className="total-count">
              / 全 {currentData.total} 曲
            </span>
          )}
        </div>
      </div>

      <div className="track-grid">
        {currentData.tracks?.map((track, index) => (
          <TrackCard 
            key={track.id || index} 
            track={track} 
            showPosition={true}
          />
        )) || []}
      </div>
    </div>
  );
};

export default TrackList;
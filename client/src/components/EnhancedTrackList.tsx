import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Track } from '../context/AppContext';
import EnhancedTrackCard from './EnhancedTrackCard';
import TrackModal from './TrackModal';
import TrackFilter, { FilterOptions } from './TrackFilter';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';
import { LoadingGrid } from './LoadingCard';

const EnhancedTrackList: React.FC = () => {
  const { state } = useAppContext();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // 表示用のトラック一覧（デフォルトで人気度順にソート、フィルター適用後は適用後のデータ）
  const displayTracks = useMemo(() => {
    const originalTracks = state.currentData?.tracks || [];
    if (originalTracks.length === 0) {
      return [];
    }

    // フィルターが実際に何らかの変更を含んでいる場合のみフィルター結果を使用
    const hasActiveFilters = filterOptions && (
      filterOptions.searchQuery ||
      filterOptions.minPopularity > 0 ||
      filterOptions.showPreviewOnly ||
      filterOptions.sortBy !== 'popularity' ||
      filterOptions.sortOrder !== 'desc'
    );

    if (hasActiveFilters && filteredTracks.length >= 0) {
      // フィルターが適用されている場合はフィルター結果を返す
      return filteredTracks;
    }
    
    // デフォルトで人気度降順にソートして表示
    return [...originalTracks].sort((a, b) => {
      const popularityA = a.popularity || 0;
      const popularityB = b.popularity || 0;
      return popularityB - popularityA; // 降順（高い人気度が先）
    });
  }, [filteredTracks, filterOptions, state.currentData?.tracks]);

  // ページネーション用の計算（displayTracksベース）
  const totalPages = Math.ceil(displayTracks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTracks = displayTracks.slice(startIndex, endIndex);

  const handleTrackSelect = useCallback((track: Track) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTrack(null);
  }, []);

  const handleFilterChange = useCallback((newFilteredTracks: Track[], newFilterOptions: FilterOptions) => {
    setFilteredTracks(newFilteredTracks);
    setFilterOptions(newFilterOptions);
    setCurrentPage(1); // フィルター変更時はページを1に戻す
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // スムーズスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  if (state.isLoading) {
    return (
      <div className="enhanced-track-list-container">
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
    <div className="enhanced-track-list-container">
      <div className="playlist-header">
        <h2 className="playlist-title">{currentData.playlist_name}</h2>
        {currentData.playlist_description && (
          <p className="playlist-description">{currentData.playlist_description}</p>
        )}
        <div className="playlist-stats">
          <span className="track-count">
            {displayTracks.length} 曲
            {filteredTracks.length > 0 && filteredTracks.length !== currentData.tracks?.length && (
              <span className="filtered-count">
                {' '}(全 {currentData.tracks?.length} 曲中)
              </span>
            )}
          </span>
          {currentData.total && (
            <span className="total-count">
              / 全 {currentData.total} 曲
            </span>
          )}
        </div>
      </div>

      {/* フィルター */}
      <TrackFilter
        tracks={currentData.tracks || []}
        onFilterChange={handleFilterChange}
      />

      {/* ページネーション（上部） */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={displayTracks.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* トラックグリッド */}
      <div className="enhanced-track-grid">
        {currentTracks.map((track, index) => (
          <EnhancedTrackCard
            key={track.id || `${startIndex + index}`}
            track={track}
            showPosition={true}
            onTrackSelect={handleTrackSelect}
          />
        ))}
      </div>

      {/* 空の状態（フィルター結果） */}
      {displayTracks.length > 0 && currentTracks.length === 0 && (
        <div className="empty-filter-state">
          <div className="empty-message">
            <h3>フィルター条件に一致する楽曲がありません</h3>
            <p>フィルター条件を変更してお試しください</p>
          </div>
        </div>
      )}

      {/* ページネーション（下部） */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={displayTracks.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* 統計情報 */}
      {displayTracks.length > 0 && (
        <div className="list-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <label>表示中</label>
              <span className="stat-value">
                {Math.min(startIndex + 1, displayTracks.length)} - {Math.min(endIndex, displayTracks.length)}
              </span>
            </div>
            <div className="stat-item">
              <label>総楽曲数</label>
              <span className="stat-value">{displayTracks.length}曲</span>
            </div>
            <div className="stat-item">
              <label>平均人気度</label>
              <span className="stat-value">
                {Math.round(
                  displayTracks
                    .filter(t => t.popularity)
                    .reduce((sum, t) => sum + (t.popularity || 0), 0) /
                  displayTracks.filter(t => t.popularity).length || 0
                )}
              </span>
            </div>
            <div className="stat-item">
              <label>プレビュー利用可能</label>
              <span className="stat-value">
                {displayTracks.filter(t => t.preview_url).length}曲
              </span>
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      <TrackModal
        track={selectedTrack}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default EnhancedTrackList;
import React, { useState } from 'react';
import { Track } from '../context/AppContext';

export interface FilterOptions {
  sortBy: 'position' | 'popularity' | 'name' | 'artists';
  sortOrder: 'asc' | 'desc';
  minPopularity: number;
  searchQuery: string;
  showPreviewOnly: boolean;
}

interface TrackFilterProps {
  tracks: Track[];
  onFilterChange: (filteredTracks: Track[], filterOptions: FilterOptions) => void;
}

const TrackFilter: React.FC<TrackFilterProps> = ({ tracks, onFilterChange }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'popularity', // デフォルトで人気度順
    sortOrder: 'desc',    // デフォルトで降順
    minPopularity: 0,
    searchQuery: '',
    showPreviewOnly: false,
  });
  const [isExpanded, setIsExpanded] = useState(false); // デフォルトで折りたたみ

  const applyFilters = (newOptions: FilterOptions) => {
    let filtered = [...tracks];

    // 検索クエリでフィルタリング
    if (newOptions.searchQuery) {
      const query = newOptions.searchQuery.toLowerCase();
      filtered = filtered.filter(track =>
        track.name.toLowerCase().includes(query) ||
        track.artists.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
      );
    }

    // 人気度でフィルタリング
    if (newOptions.minPopularity > 0) {
      filtered = filtered.filter(track =>
        (track.popularity || 0) >= newOptions.minPopularity
      );
    }

    // プレビューありのみ表示
    if (newOptions.showPreviewOnly) {
      filtered = filtered.filter(track => track.preview_url);
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (newOptions.sortBy) {
        case 'position':
          aValue = a.position || 999;
          bValue = b.position || 999;
          break;
        case 'popularity':
          aValue = a.popularity || 0;
          bValue = b.popularity || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'artists':
          aValue = a.artists.toLowerCase();
          bValue = b.artists.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return newOptions.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return newOptions.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    onFilterChange(filtered, newOptions);
  };

  const updateFilter = (updates: Partial<FilterOptions>) => {
    const newOptions = { ...filterOptions, ...updates };
    setFilterOptions(newOptions);
    applyFilters(newOptions);
  };

  const resetFilters = () => {
    const defaultOptions: FilterOptions = {
      sortBy: 'popularity', // デフォルトで人気度順
      sortOrder: 'desc',    // デフォルトで降順
      minPopularity: 0,
      searchQuery: '',
      showPreviewOnly: false,
    };
    setFilterOptions(defaultOptions);
    // リセット時はフィルターを無効化して、EnhancedTrackListのデフォルトソートを使用
    onFilterChange([], defaultOptions);
  };

  return (
    <div className="track-filter">
      <div className="filter-header">
        <button
          className={`filter-toggle ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="フィルター設定を開く"
        >
          <span className="filter-icon">⚙️</span>
          <span className="filter-text">フィルター・ソート</span>
          <span className="toggle-arrow">{isExpanded ? '▼' : '▶'}</span>
        </button>
        
        {(filterOptions.searchQuery || 
          filterOptions.minPopularity > 0 || 
          filterOptions.showPreviewOnly ||
          filterOptions.sortBy !== 'popularity' ||
          filterOptions.sortOrder !== 'desc') && (
          <button className="reset-filters" onClick={resetFilters}>
            リセット
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filter-content">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="searchQuery">キーワード検索</label>
              <input
                id="searchQuery"
                type="text"
                placeholder="楽曲名、アーティスト、アルバムで検索"
                value={filterOptions.searchQuery}
                onChange={(e) => updateFilter({ searchQuery: e.target.value })}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="sortBy">ソート項目</label>
              <select
                id="sortBy"
                value={filterOptions.sortBy}
                onChange={(e) => updateFilter({ sortBy: e.target.value as FilterOptions['sortBy'] })}
                className="sort-select"
              >
                <option value="position">ランキング順位</option>
                <option value="popularity">人気度</option>
                <option value="name">楽曲名</option>
                <option value="artists">アーティスト名</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sortOrder">ソート順</label>
              <select
                id="sortOrder"
                value={filterOptions.sortOrder}
                onChange={(e) => updateFilter({ sortOrder: e.target.value as FilterOptions['sortOrder'] })}
                className="sort-select"
              >
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minPopularity">
                最低人気度: {filterOptions.minPopularity}
              </label>
              <input
                id="minPopularity"
                type="range"
                min="0"
                max="100"
                value={filterOptions.minPopularity}
                onChange={(e) => updateFilter({ minPopularity: Number(e.target.value) })}
                className="popularity-slider"
              />
              <div className="slider-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <div className="filter-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filterOptions.showPreviewOnly}
                  onChange={(e) => updateFilter({ showPreviewOnly: e.target.checked })}
                />
                <span className="checkbox-text">プレビューありのみ表示</span>
              </label>
            </div>
          </div>

          <div className="filter-stats">
            <span className="stats-text">
              {tracks.length} 件中 表示中
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackFilter;
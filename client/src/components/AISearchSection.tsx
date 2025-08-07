import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import apiService from '../services/api';

const AISearchSection: React.FC = () => {
  const { dispatch } = useAppContext();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleAISearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_DATA' });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await apiService.aiSearch(searchQuery);

      if (response && response.success) {
        dispatch({ type: 'SET_DATA', payload: response });
        
        // 検索履歴に追加
        setSearchHistory(prev => {
          const newHistory = [searchQuery, ...prev.filter(item => item !== searchQuery)];
          return newHistory.slice(0, 5); // 最新5件まで保持
        });
        
        setQuery(''); // 検索後にクリア
      } else {
        const errorMessage = response?.error || 'AI検索でエラーが発生しました';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('AI Search error:', error);
      let errorMessage = 'AI検索でエラーが発生しました';
      
      if (error.response) {
        errorMessage = error.response.data?.error || `サーバーエラー: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'ネットワークエラー: サーバーに接続できません';
      } else {
        errorMessage = error.message || '予期しないエラーが発生しました';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      setIsSearching(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAISearch(query);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const suggestedQueries = [
    '雨の日に聞きたい音楽',
    '90年代の懐かしい邦楽',
    'ワークアウトにぴったりな曲',
    '米津玄師のような曲',
    '感動的なバラード',
    'K-POPの人気曲',
    'ジブリ映画の音楽',
    'ドライブで聞きたい洋楽'
  ];

  return (
    <section className="ai-search-section">
      <div className="container">
        <h2 className="section-title">
          <span className="ai-icon">🤖</span>
          AI自然言語検索
        </h2>
        <p className="section-description">
          「雨の日に聞きたい音楽」「90年代の懐かしいJ-POP」など、自然な日本語で音楽を検索
        </p>
        
        {/* AI検索フォーム */}
        <form onSubmit={handleSubmit} className="ai-search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: 元気が出る洋楽を教えて"
              className="ai-search-input"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className={`ai-search-button ${isSearching ? 'searching' : ''}`}
            >
              {isSearching ? (
                <>
                  <span className="search-spinner"></span>
                  AI検索中...
                </>
              ) : (
                <>
                  <span className="search-icon">🔍</span>
                  AI検索
                </>
              )}
            </button>
          </div>
        </form>

        {/* 検索履歴 */}
        {searchHistory.length > 0 && (
          <div className="search-history">
            <h3 className="history-title">最近の検索</h3>
            <div className="history-chips">
              {searchHistory.map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyQuery)}
                  className="history-chip"
                  disabled={isSearching}
                >
                  <span className="history-icon">🕒</span>
                  {historyQuery}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 検索例 */}
        <div className="search-suggestions">
          <h3 className="suggestions-title">検索例</h3>
          <div className="suggestions-grid">
            {suggestedQueries.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAISearch(suggestion)}
                className="suggestion-chip"
                disabled={isSearching}
              >
                <span className="suggestion-icon">💡</span>
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* AI検索の特徴説明 */}
        <div className="ai-features">
          <h3 className="features-title">AI検索の特徴</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <div className="feature-content">
                <h4>自然言語理解</h4>
                <p>日本語の曖昧な表現も理解して最適な検索を実行</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-content">
                <h4>インテリジェント検索</h4>
                <p>ジャンル、気分、年代を自動で判別して検索</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <div className="feature-content">
                <h4>個性的な提案</h4>
                <p>あなたの検索意図に合わせた楽曲を発見</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISearchSection;
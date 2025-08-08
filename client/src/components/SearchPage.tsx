import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PresetSection from './PresetSection';
import AISearchSection from './AISearchSection';
import EnhancedTrackList from './EnhancedTrackList';
import { useAppContext } from '../context/AppContext';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleBackToHome = () => {
    navigate('/');
  };

  // 検索結果が更新されたときに自動スクロール
  useEffect(() => {
    if (state.currentData && resultsRef.current) {
      // ローディング完了後に少し遅延してスクロール
      const scrollTimeout = setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);

      return () => clearTimeout(scrollTimeout);
    }
  }, [state.currentData]);

  return (
    <div className="search-page">
      {/* ナビゲーションヘッダー */}
      <div className="search-nav">
        <button className="back-btn" onClick={handleBackToHome}>
          <span className="back-icon">←</span>
          <span className="back-text">ホームに戻る</span>
        </button>
        <h1 className="search-title">音楽検索</h1>
      </div>

      {/* 検索セクション */}
      <div className="search-sections">
        <PresetSection />
        <AISearchSection />
      </div>

      {/* 結果表示 */}
      {state.currentData && (
        <div className="results-section" ref={resultsRef}>
          <EnhancedTrackList />
        </div>
      )}

      {/* 検索未実行時のプレースホルダー */}
      {!state.currentData && !state.isLoading && (
        <div className="search-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">🔍</div>
            <h3 className="placeholder-title">検索を開始してください</h3>
            <p className="placeholder-text">
              上のプリセットボタンをクリックするか、AI検索で自然言語検索を試してみてください
            </p>
            <div className="placeholder-examples">
              <h4>検索例：</h4>
              <ul>
                <li>"リラックスできるジャズ"</li>
                <li>"エネルギッシュなロック"</li>
                <li>"2000年代のヒット曲"</li>
                <li>"勉強に集中できる音楽"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
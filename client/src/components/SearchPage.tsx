import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PresetSection from './PresetSection';
import AISearchSection from './AISearchSection';
import EnhancedTrackList from './EnhancedTrackList';
import DJButton from './DJButton';
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
    if (state.currentData && resultsRef.current && !state.isLoading) {
      // ローディング完了後に遅延してスクロール（デスクトップ対応）
      const scrollTimeout = setTimeout(() => {
        if (resultsRef.current) {
          console.log('Scrolling to results section'); // デバッグ用
          
          // 複数の方法でスクロールを試行
          try {
            // Method 1: scrollIntoView
            resultsRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } catch (error) {
            console.log('scrollIntoView failed, trying alternative method');
            
            // Method 2: window.scrollTo
            const rect = resultsRef.current.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - 100; // 100px offset
            
            window.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        }
      }, 600); // 遅延を600msに増加

      return () => clearTimeout(scrollTimeout);
    }
  }, [state.currentData, state.isLoading]);

  // 追加のスクロール処理: isLoadingがfalseになったときも実行
  useEffect(() => {
    if (!state.isLoading && state.currentData && resultsRef.current) {
      const scrollTimeout = setTimeout(() => {
        if (resultsRef.current) {
          console.log('Additional scroll attempt after loading complete');
          
          const rect = resultsRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset + rect.top - 80;
          
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }, 200);

      return () => clearTimeout(scrollTimeout);
    }
  }, [state.isLoading, state.currentData]);

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
        
        {/* AI DJ セクション */}
        <div className="dj-section bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl mt-6 border border-green-200 dark:border-green-700">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              🎙️ AI DJ
            </h2>
            <p className="text-sm md:text-base text-green-700 dark:text-green-300">
              今日の人気楽曲を元にAIが生成したオリジナルDJトークをお楽しみください
            </p>
          </div>
          
          <div className="flex justify-center">
            <DJButton 
              onPlay={() => console.log('AI DJ started')}
              className="dj-button-container"
            />
          </div>
        </div>
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
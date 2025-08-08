import React from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeSection from './WelcomeSection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartSearch = () => {
    navigate('/search');
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Spotify Music Visualizer</h1>
          <p className="hero-subtitle">
            AIを使って自然言語で音楽を検索し、Spotifyの豊富な楽曲データを可視化して探索できます。
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">🎵</span>
              <span className="feature-text">AIによる自然言語検索</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">詳細な楽曲分析と可視化</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎧</span>
              <span className="feature-text">プレビュー再生機能</span>
            </div>
          </div>
          <button className="hero-cta-btn" onClick={handleStartSearch}>
            音楽検索を始める
          </button>
        </div>
        
        <div className="hero-image">
          <div className="hero-visualization">
            <div className="viz-circle"></div>
            <div className="viz-circle"></div>
            <div className="viz-circle"></div>
          </div>
        </div>
      </div>

      <WelcomeSection />
      
      <div className="cta-section">
        <h2>今すぐ音楽の世界を探索しましょう</h2>
        <p>プリセットまたはAI検索で、あなたの音楽体験を拡張してください。</p>
        <button className="cta-btn" onClick={handleStartSearch}>
          検索ページへ進む
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';

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
              <div className="feature-content">
                <span className="feature-title">AIによる自然言語検索</span>
                <span className="feature-description">「リラックスできるジャズ」「エネルギッシュなロック」など、自然な言葉で音楽を検索。AIが感情やムードを理解して最適な楽曲を提案します。</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div className="feature-content">
                <span className="feature-title">詳細な楽曲分析と可視化</span>
                <span className="feature-description">人気度、ジャンル、アーティスト情報を美しいカード形式で表示。フィルタリングやソート機能で理想の楽曲を素早く発見できます。</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎧</span>
              <div className="feature-content">
                <span className="feature-title">プレビュー再生機能</span>
                <span className="feature-description">気になる楽曲は30秒プレビューで即座に試聴。Spotifyへ直接アクセスしてフル再生も可能です。</span>
              </div>
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
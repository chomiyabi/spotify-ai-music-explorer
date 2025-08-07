import React from 'react';

const WelcomeSection: React.FC = () => {
  return (
    <div className="text-center mb-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-6">
          音楽データの世界へようこそ
        </h2>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          Spotifyの豊富な音楽データを使って、世界中の音楽トレンドを探索しましょう。
          <br />
          プリセットボタンでワンクリック検索、またはAI検索で自由にデータを発見できます。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-spotify-light rounded-lg p-6">
            <div className="text-spotify-green text-3xl mb-4">🎵</div>
            <h3 className="text-lg font-semibold text-white mb-2">プリセット検索</h3>
            <p className="text-gray-400 text-sm">
              人気のプレイリストやランキングをワンクリックで取得
            </p>
          </div>
          
          <div className="bg-spotify-light rounded-lg p-6">
            <div className="text-spotify-green text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI検索</h3>
            <p className="text-gray-400 text-sm">
              自然言語で質問して、最適な音楽データを発見
            </p>
          </div>
          
          <div className="bg-spotify-light rounded-lg p-6">
            <div className="text-spotify-green text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">データ可視化</h3>
            <p className="text-gray-400 text-sm">
              美しいカード形式で音楽情報を直感的に表示
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
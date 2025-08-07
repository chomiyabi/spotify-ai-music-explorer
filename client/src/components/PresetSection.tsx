import React from 'react';
import PresetButton from './PresetButton';
import { useAppContext } from '../context/AppContext';
import apiService from '../services/api';

const PresetSection: React.FC = () => {
  const { dispatch } = useAppContext();

  const handlePresetClick = async (type: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_DATA' });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      let response;
      
      switch (type) {
        case 'viral-jp':
          response = await apiService.getViralTracks('jp');
          break;
        case 'global-top':
          response = await apiService.getGlobalTop();
          break;
        case 'artists-jp':
          response = await apiService.getTopArtists('jp');
          break;
        case 'new-releases':
          response = await apiService.getNewReleases();
          break;
        case 'workout':
          response = await apiService.getWorkoutPlaylists();
          break;
        case 'us-artists':
          response = await apiService.getUSArtists();
          break;
        case 'kpop':
          response = await apiService.getKPOPTracks();
          break;
        case 'anime':
          response = await apiService.getAnimeSongs();
          break;
        case 'latest-singles':
          response = await apiService.getLatestSingles();
          break;
        case 'podcasts':
          response = await apiService.getPodcasts();
          break;
        default:
          throw new Error('Unknown preset type');
      }

      if (response && response.success) {
        dispatch({ type: 'SET_DATA', payload: response });
        // 成功メッセージを表示（短時間）
        setTimeout(() => {
          dispatch({ type: 'CLEAR_ERROR' });
        }, 3000);
      } else {
        const errorMessage = response?.error || 'データの取得に失敗しました';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Preset fetch error:', error);
      let errorMessage = 'データの取得に失敗しました';
      
      if (error.response) {
        // サーバーからのレスポンスエラー
        errorMessage = error.response.data?.error || `サーバーエラー: ${error.response.status}`;
      } else if (error.request) {
        // ネットワークエラー
        errorMessage = 'ネットワークエラー: サーバーに接続できません';
      } else {
        // その他のエラー
        errorMessage = error.message || '予期しないエラーが発生しました';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const presetButtons = [
    {
      id: 'viral-jp',
      title: '日本のバイラル Top 50',
      description: '日本で話題の楽曲ランキング',
      icon: '🇯🇵'
    },
    {
      id: 'global-top',
      title: '世界の Top 50',
      description: 'グローバルヒットチャート',
      icon: '🌍'
    },
    {
      id: 'artists-jp',
      title: '日本の Top アーティスト',
      description: '人気アーティストランキング',
      icon: '🎤'
    },
    {
      id: 'new-releases',
      title: '最新リリース',
      description: '新着アルバム・シングル',
      icon: '🆕'
    },
    {
      id: 'workout',
      title: 'ワークアウト向けプレイリスト',
      description: '運動にぴったりな楽曲',
      icon: '💪'
    },
    {
      id: 'us-artists',
      title: 'アメリカの Top アーティスト',
      description: 'アメリカで人気のアーティスト',
      icon: '🇺🇸'
    },
    {
      id: 'kpop',
      title: 'K-POP ジャンル人気プレイリスト',
      description: '韓国発の人気K-POPトラック',
      icon: '🇰🇷'
    },
    {
      id: 'anime',
      title: 'アニメソング人気プレイリスト',
      description: 'アニメ主題歌・挿入歌',
      icon: '🎌'
    },
    {
      id: 'latest-singles',
      title: '最新リリースシングル',
      description: '最新のシングル楽曲',
      icon: '🎵'
    },
    {
      id: 'podcasts',
      title: '今日のポッドキャストランキング',
      description: '人気ポッドキャスト番組',
      icon: '🎙️'
    }
  ];

  return (
    <section className="preset-section">
      <div className="container">
        <h2 className="section-title">プリセット検索</h2>
        <p className="section-description">
          ワンクリックで人気のプレイリストやランキングを取得
        </p>
        
        <div className="preset-grid">
          {presetButtons.map((preset) => (
            <PresetButton
              key={preset.id}
              title={preset.title}
              description={preset.description}
              icon={preset.icon}
              onClick={() => handlePresetClick(preset.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PresetSection;
import { Router, Request, Response } from 'express';
import spotifyAuth from '../services/spotifyAuth';
import claudeService from '../services/claudeService';

const router = Router();

// AI自然言語検索エンドポイント
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '検索クエリが必要です'
      });
    }

    // Step 1: Claude AIでクエリを解釈
    const interpretation = await claudeService.interpretMusicQuery(query);
    console.log('AI Query interpretation:', interpretation);

    // Step 2: 解釈された内容をもとにSpotify検索クエリを構築
    const spotifyQueries = buildSpotifyQueries(interpretation);
    console.log('Spotify search queries:', spotifyQueries);

    let allTracks: any[] = [];

    // Step 3: 複数のクエリで検索実行
    for (const searchQuery of spotifyQueries) {
      try {
        const results = await spotifyAuth.makeSpotifyRequest('/search', {
          q: searchQuery,
          type: 'track',
          market: 'JP',
          limit: 15
        });

        if (results.tracks && results.tracks.items) {
          allTracks = allTracks.concat(results.tracks.items);
        }
      } catch (searchError) {
        console.log(`Search failed for query "${searchQuery}":`, searchError);
      }
    }

    // Step 4: 重複除去と結果の整理
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );

    const tracks = uniqueTracks.map((track: any, index: number) => ({
      position: index + 1,
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      popularity: track.popularity,
      release_date: track.album.release_date
    }));

    // 人気度でソート
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);

    res.json({
      success: true,
      query: query,
      interpretation: interpretation,
      playlist_name: `AI検索結果: "${query}"`,
      playlist_description: generateDescription(query, interpretation),
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 50),
      ai_suggestions: interpretation.suggestions || []
    });

  } catch (error: any) {
    console.error('AI search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI検索でエラーが発生しました'
    });
  }
});

// AI検索クエリ解釈テスト用エンドポイント
router.post('/interpret', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '検索クエリが必要です'
      });
    }

    const interpretation = await claudeService.interpretMusicQuery(query);

    res.json({
      success: true,
      query: query,
      interpretation: interpretation,
      spotify_queries: buildSpotifyQueries(interpretation)
    });

  } catch (error: any) {
    console.error('AI interpret error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'クエリ解釈でエラーが発生しました'
    });
  }
});

// 解釈された内容からSpotify検索クエリを構築する関数
function buildSpotifyQueries(interpretation: any): string[] {
  const queries: string[] = [];

  // 基本的な検索項目
  if (interpretation.searchTerms && interpretation.searchTerms.length > 0) {
    queries.push(interpretation.searchTerms.join(' '));
  }

  // ジャンル指定検索
  if (interpretation.genre) {
    queries.push(`genre:"${interpretation.genre}"`);
    
    // ジャンルと気分を組み合わせ
    if (interpretation.mood) {
      queries.push(`genre:"${interpretation.genre}" ${interpretation.mood}`);
    }
  }

  // アーティスト指定検索
  if (interpretation.artist) {
    queries.push(`artist:"${interpretation.artist}"`);
    queries.push(interpretation.artist);
  }

  // 年代指定検索
  if (interpretation.decade) {
    let yearRange = '';
    switch (interpretation.decade) {
      case '1980s':
        yearRange = 'year:1980-1989';
        break;
      case '1990s':
        yearRange = 'year:1990-1999';
        break;
      case '2000s':
        yearRange = 'year:2000-2009';
        break;
      case '2010s':
        yearRange = 'year:2010-2019';
        break;
      default:
        yearRange = `year:${interpretation.decade}`;
    }
    
    if (yearRange) {
      queries.push(yearRange);
      if (interpretation.genre) {
        queries.push(`${yearRange} genre:"${interpretation.genre}"`);
      }
    }
  }

  // 気分指定検索
  if (interpretation.mood) {
    const moodQueries = getMoodQueries(interpretation.mood);
    queries.push(...moodQueries);
  }

  // 最低限のクエリを確保
  if (queries.length === 0) {
    queries.push(interpretation.searchTerms?.[0] || 'popular');
  }

  return queries.slice(0, 5); // 最大5クエリに制限
}

// 気分に基づく検索クエリ生成
function getMoodQueries(mood: string): string[] {
  const moodMap: { [key: string]: string[] } = {
    'sad': ['melancholy', 'emotional', 'ballad', 'slow'],
    'happy': ['upbeat', 'cheerful', 'energetic', 'party'],
    'chill': ['relaxing', 'ambient', 'lo-fi', 'downtempo'],
    'energetic': ['upbeat', 'high-energy', 'dance', 'workout'],
    'romantic': ['love', 'romantic', 'ballad', 'intimate'],
    'nostalgic': ['vintage', 'classic', 'nostalgic', 'retro']
  };

  return moodMap[mood] || [mood];
}

// 検索結果の説明文生成
function generateDescription(originalQuery: string, interpretation: any): string {
  let description = `「${originalQuery}」の検索結果`;

  const details: string[] = [];

  if (interpretation.genre) {
    details.push(`ジャンル: ${interpretation.genre}`);
  }

  if (interpretation.mood) {
    details.push(`雰囲気: ${interpretation.mood}`);
  }

  if (interpretation.decade) {
    details.push(`年代: ${interpretation.decade}`);
  }

  if (interpretation.language) {
    details.push(`言語: ${interpretation.language}`);
  }

  if (details.length > 0) {
    description += ` (${details.join(', ')})`;
  }

  return description;
}

export default router;
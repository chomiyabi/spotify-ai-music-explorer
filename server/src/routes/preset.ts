import { Router, Request, Response } from 'express';
import spotifyAuth from '../services/spotifyAuth';

const router = Router();

// 日本のバイラル Top 50
router.get('/viral-jp', async (req: Request, res: Response) => {
  try {
    // バイラルトラックの検索（日本市場）
    const viralResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'year:2024',
      type: 'track',
      market: 'JP',
      limit: 50
    });
    
    const tracks = viralResults.tracks.items.map((track: any, index: number) => ({
      position: index + 1,
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      popularity: track.popularity
    }));
    
    // 人気度でソート
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);

    res.json({
      success: true,
      playlist_name: '日本のバイラル Top 50',
      playlist_description: '日本で話題になっている楽曲',
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 50)
    });
  } catch (error: any) {
    console.error('Viral JP error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch viral tracks' 
    });
  }
});

// 世界の Top 50
router.get('/global-top', async (req: Request, res: Response) => {
  try {
    const globalResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'year:2024',
      type: 'track',
      market: 'US',
      limit: 50
    });
    
    const tracks = globalResults.tracks.items.map((track: any, index: number) => ({
      position: index + 1,
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      popularity: track.popularity
    }));
    
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);

    res.json({
      success: true,
      playlist_name: '世界の Top 50',
      playlist_description: 'グローバルヒットチャート',
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 50)
    });
  } catch (error: any) {
    console.error('Global top error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch global top tracks' 
    });
  }
});

// 日本の Top アーティスト
router.get('/artists-jp', async (req: Request, res: Response) => {
  try {
    // 日本の人気アーティストを検索
    const artistResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'genre:j-pop OR genre:jpop OR market:JP',
      type: 'artist',
      market: 'JP',
      limit: 20
    });
    
    const artists = artistResults.artists.items.map((artist: any, index: number) => ({
      position: index + 1,
      id: artist.id,
      name: artist.name,
      genres: artist.genres.join(', ') || 'その他',
      image: artist.images[0]?.url,
      external_url: artist.external_urls.spotify,
      popularity: artist.popularity,
      followers: artist.followers.total
    }));
    
    // 人気度でソート
    artists.sort((a: any, b: any) => b.popularity - a.popularity);

    res.json({
      success: true,
      playlist_name: '日本の Top アーティスト',
      playlist_description: '日本で人気のアーティスト',
      total_tracks: artists.length,
      tracks: artists.slice(0, 10)
    });
  } catch (error: any) {
    console.error('Artists JP error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch Japanese artists' 
    });
  }
});

// 最新リリース
router.get('/new-releases', async (req: Request, res: Response) => {
  try {
    const newReleases = await spotifyAuth.makeSpotifyRequest('/browse/new-releases', {
      country: 'JP',
      limit: 20
    });
    
    const albums = newReleases.albums.items.map((album: any, index: number) => ({
      position: index + 1,
      id: album.id,
      name: album.name,
      artists: album.artists.map((artist: any) => artist.name).join(', '),
      album: album.name,
      image: album.images[0]?.url,
      external_url: album.external_urls.spotify,
      release_date: album.release_date,
      total_tracks: album.total_tracks
    }));

    res.json({
      success: true,
      playlist_name: '最新リリース',
      playlist_description: '新着アルバム・シングル',
      total_tracks: albums.length,
      tracks: albums
    });
  } catch (error: any) {
    console.error('New releases error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch new releases' 
    });
  }
});

// ワークアウト向けプレイリスト
router.get('/workout', async (req: Request, res: Response) => {
  try {
    // ワークアウト関連の楽曲を検索
    const workoutResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'workout OR fitness OR gym OR running',
      type: 'track',
      market: 'JP',
      limit: 30
    });
    
    const tracks = workoutResults.tracks.items.map((track: any, index: number) => ({
      position: index + 1,
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      popularity: track.popularity,
      energy: track.energy || 0.8 // 仮想的なエネルギー値
    }));
    
    // エネルギッシュな楽曲を優先してソート
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);

    res.json({
      success: true,
      playlist_name: 'ワークアウト向けプレイリスト',
      playlist_description: '運動にぴったりなエネルギッシュな楽曲',
      total_tracks: tracks.length,
      tracks: tracks
    });
  } catch (error: any) {
    console.error('Workout error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch workout playlist' 
    });
  }
});

// アメリカの Top アーティスト
router.get('/us-artists', async (req: Request, res: Response) => {
  try {
    // より広範囲でアメリカの人気楽曲を検索してアーティストを抽出
    const trackResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'year:2024',
      type: 'track',
      market: 'US',
      limit: 50
    });
    
    // トラックからアーティスト情報を抽出し、重複を排除
    const artistMap = new Map();
    
    trackResults.tracks.items.forEach((track: any) => {
      track.artists.forEach((artist: any) => {
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, {
            position: artistMap.size + 1,
            id: artist.id,
            name: artist.name,
            artists: artist.name,
            album: `人気楽曲: ${track.name}`,
            image: track.album.images[0]?.url,
            external_url: artist.external_urls.spotify,
            popularity: track.popularity,
            track_name: track.name
          });
        }
      });
    });
    
    const artists = Array.from(artistMap.values())
      .sort((a: any, b: any) => b.popularity - a.popularity);

    res.json({
      success: true,
      playlist_name: 'アメリカの Top アーティスト',
      playlist_description: 'アメリカで人気のアーティストランキング',
      total_tracks: artists.length,
      tracks: artists.slice(0, 15)
    });
  } catch (error: any) {
    console.error('US Artists error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch US artists' 
    });
  }
});

// K-POP ジャンルの人気プレイリスト
router.get('/kpop', async (req: Request, res: Response) => {
  try {
    // K-POP関連の楽曲を複数の検索方法で取得
    const searches = [
      'BTS',
      'BLACKPINK', 
      'NewJeans',
      'TWICE',
      'SEVENTEEN',
      'aespa'
    ];
    
    let allTracks: any[] = [];
    
    for (const query of searches) {
      try {
        const results = await spotifyAuth.makeSpotifyRequest('/search', {
          q: query,
          type: 'track',
          market: 'JP', // 日本市場で利用可能なK-POPを取得
          limit: 10
        });
        
        allTracks = allTracks.concat(results.tracks.items);
      } catch (searchError) {
        console.log(`Search failed for ${query}:`, searchError);
      }
    }
    
    // 重複を除去
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
      playlist_name: 'K-POP ジャンル人気プレイリスト',
      playlist_description: '韓国発の人気K-POPトラック',
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 30)
    });
  } catch (error: any) {
    console.error('K-POP error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch K-POP tracks' 
    });
  }
});

// アニメソングの人気プレイリスト
router.get('/anime', async (req: Request, res: Response) => {
  try {
    // アニメソング関連の楽曲を検索
    const animeResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'anime OR opening OR ending OR 主題歌 OR アニメ OR OST',
      type: 'track',
      market: 'JP',
      limit: 35
    });
    
    const tracks = animeResults.tracks.items.map((track: any, index: number) => ({
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
      playlist_name: 'アニメソング人気プレイリスト',
      playlist_description: '人気アニメ主題歌・挿入歌コレクション',
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 25)
    });
  } catch (error: any) {
    console.error('Anime error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch anime songs' 
    });
  }
});

// 最新リリースのシングル（詳細版）
router.get('/latest-singles', async (req: Request, res: Response) => {
  try {
    // 複数の検索方法で最新楽曲を取得
    const currentYear = new Date().getFullYear();
    const queries = [
      `year:${currentYear}`,
      `year:${currentYear - 1}`,
      'tag:new'
    ];
    
    let allTracks: any[] = [];
    
    // 複数のクエリで検索して結果を統合
    for (const query of queries) {
      try {
        const results = await spotifyAuth.makeSpotifyRequest('/search', {
          q: query,
          type: 'track',
          market: 'JP',
          limit: 20
        });
        
        allTracks = allTracks.concat(results.tracks.items);
      } catch (searchError) {
        console.log(`Search failed for ${query}:`, searchError);
      }
    }
    
    // 重複を除去してシングル楽曲をフィルタリング
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    const tracks = uniqueTracks
      .map((track: any, index: number) => ({
        position: index + 1,
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist: any) => artist.name).join(', '),
        album: track.album.name,
        image: track.album.images[0]?.url,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
        popularity: track.popularity,
        release_date: track.album.release_date,
        album_type: track.album.album_type,
        total_tracks: track.album.total_tracks
      }));
    
    // リリース日と人気度でソート
    tracks.sort((a: any, b: any) => {
      const dateA = new Date(a.release_date);
      const dateB = new Date(b.release_date);
      if (dateB.getTime() === dateA.getTime()) {
        return b.popularity - a.popularity;
      }
      return dateB.getTime() - dateA.getTime();
    });

    res.json({
      success: true,
      playlist_name: '最新リリースシングル',
      playlist_description: '最新リリースされたシングル楽曲',
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 30)
    });
  } catch (error: any) {
    console.error('Latest singles error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch latest singles' 
    });
  }
});

// 今日のポッドキャストランキング
router.get('/podcasts', async (req: Request, res: Response) => {
  try {
    // ポッドキャストを検索（日本語コンテンツを優先）
    const podcastResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: '日本 OR Japan OR japanese',
      type: 'show',
      market: 'JP',
      limit: 20
    });
    
    const podcasts = podcastResults.shows.items.map((show: any, index: number) => ({
      position: index + 1,
      id: show.id,
      name: show.name,
      artists: show.publisher || 'ポッドキャスト',
      album: `${show.total_episodes}エピソード`,
      image: show.images[0]?.url,
      external_url: show.external_urls.spotify,
      description: show.description?.substring(0, 100) + '...' || '説明なし',
      total_episodes: show.total_episodes,
      languages: show.languages.join(', ') || '日本語'
    }));

    res.json({
      success: true,
      playlist_name: '今日のポッドキャストランキング',
      playlist_description: '人気の日本語ポッドキャスト番組',
      total_tracks: podcasts.length,
      tracks: podcasts
    });
  } catch (error: any) {
    console.error('Podcasts error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch podcasts' 
    });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import spotifyAuth from '../services/spotifyAuth';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, type = 'track', limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query parameter "q" is required' 
      });
    }

    const searchResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: q as string,
      type: type as string,
      limit: parseInt(limit as string),
      market: 'JP'
    });

    const formattedResults = searchResults.tracks?.items?.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify
    })) || [];

    res.json({
      success: true,
      query: q,
      type: type,
      total: searchResults.tracks?.total || 0,
      results: formattedResults
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to perform search' 
    });
  }
});

router.get('/top-tracks/:country', async (req: Request, res: Response) => {
  try {
    const { country } = req.params;
    const market = country === 'jp' ? 'JP' : 'US';
    
    // Search for popular tracks in the market
    const searchResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'year:2024',
      type: 'track',
      market: market,
      limit: 50
    });
    
    const tracks = searchResults.tracks.items.map((track: any, index: number) => ({
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
    
    // Sort by popularity
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);
    
    res.json({
      success: true,
      playlist_name: `Top Tracks in ${market}`,
      playlist_description: `Popular tracks for ${market} market`,
      total_tracks: tracks.length,
      tracks: tracks.slice(0, 50)
    });
  } catch (error: any) {
    console.error('Top tracks error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch top tracks' 
    });
  }
});

export default router;
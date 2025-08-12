import { Router, Request, Response } from 'express';
import axios from 'axios';
import spotifyAuth from '../services/spotifyAuth';

// モック音声データ生成関数
function generateMockAudio(artistNames: string): Buffer {
  // 1秒間のサイレンス音声データを生成
  const sampleRate = 44100;
  const duration = 1; // 1秒
  const numSamples = sampleRate * duration;
  const dataSize = numSamples * 2; // 16-bit samples
  const fileSize = 36 + dataSize;
  
  // WAVファイルヘッダー
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20);  // audio format (PCM)
  header.writeUInt16LE(1, 22);  // num channels (mono)
  header.writeUInt32LE(sampleRate, 24); // sample rate
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32);  // block align
  header.writeUInt16LE(16, 34); // bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  // テスト用のビープ音データを生成（440Hz サイン波）
  const audioData = Buffer.alloc(dataSize);
  const frequency = 440; // A4 note
  
  for (let i = 0; i < numSamples; i++) {
    // サイン波を生成
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    // 16-bit PCM値に変換 (音量を30%に下げる)
    const value = Math.round(sample * 0.3 * 32767);
    
    // リトルエンディアンで16-bit値を書き込み
    audioData.writeInt16LE(value, i * 2);
  }
  
  // ヘッダーと音声データを結合
  return Buffer.concat([header, audioData]);
}

const router = Router();

// 日本のバイラルトップ50から上位3曲のアーティスト名を取得
router.get('/viral-top3', async (req: Request, res: Response) => {
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
      popularity: track.popularity,
      primary_artist: track.artists[0]?.name // メインアーティスト名
    }));
    
    // 人気度でソート
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);

    // 上位3曲のメインアーティスト名を抽出
    const top3Tracks = tracks.slice(0, 3);
    const artistNames = top3Tracks
      .map((track: any) => track.primary_artist)
      .filter((artist: string) => artist) // null/undefinedを除去
      .join(', ');

    res.json({
      success: true,
      data: {
        artistNames: artistNames,
        tracks: top3Tracks.map((track: any) => ({
          rank: track.position,
          name: track.name,
          artist: track.primary_artist,
          album: track.album,
          image: track.image,
          popularity: track.popularity
        }))
      }
    });
  } catch (error: any) {
    console.error('DJ viral-top3 error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch viral top 3 tracks' 
    });
  }
});

// Dify APIを使用した音声生成
router.post('/generate-voice', async (req: Request, res: Response) => {
  try {
    const { artistNames } = req.body;

    if (!artistNames || typeof artistNames !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Artist names are required'
      });
    }

    const difyApiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai';
    const difyApiKey = process.env.DIFY_API_KEY;
    const workflowId = process.env.DIFY_WORKFLOW_ID || 'f61cb5b5-6760-40bb-8dfd-2a58fa70e3d8';

    // デモモード: APIキーが設定されていない場合はモック音声を返す
    if (!difyApiKey || difyApiKey === 'your_dify_api_key_here') {
      console.log('Demo mode: Using mock DJ voice generation for artists:', artistNames);
      
      // モック音声データを生成（サイレント音声データ）
      const mockAudioBuffer = generateMockAudio(artistNames);
      
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', 'attachment; filename="demo-dj-talk.wav"');
      res.setHeader('X-DJ-Artists', artistNames);
      res.setHeader('X-Demo-Mode', 'true');
      
      return res.send(mockAudioBuffer);
    }

    // Dify APIリクエストの準備
    const difyRequestBody = {
      inputs: {
        ArtistName: artistNames,
        "sys.files": [],
        "sys.user_id": "581bf1bd-d0db-46f7-ac58-d3c1776573a7",
        "sys.app_id": "219ce180-beb8-4b1c-a726-0eb5f2808d45",
        "sys.workflow_id": "f61cb5b5-6760-40bb-8dfd-2a58fa70e3d8",
        "sys.workflow_run_id": "ff08ecb1-f1de-4ef3-b776-5b1f0c16f7c6"
      },
      response_mode: "blocking",
      user: "abc-123"
    };

    console.log('Sending request to Dify API with artists:', artistNames);

    // Dify APIへのリクエスト
    const difyResponse = await axios.post(
      `${difyApiUrl}/v1/workflows/run`,
      difyRequestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${difyApiKey}`
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60秒タイムアウト
      }
    );

    console.log('[Dify] Response status:', difyResponse.status);
    console.log('[Dify] Response headers:', difyResponse.headers);
    console.log('[Dify] Response data type:', typeof difyResponse.data);
    console.log('[Dify] Response data length:', difyResponse.data?.byteLength || 0);

    // レスポンスが音声データかどうか確認
    const contentType = difyResponse.headers['content-type'];
    console.log('[Dify] Content-Type:', contentType);

    if (!difyResponse.data || difyResponse.data.byteLength === 0) {
      throw new Error('Dify API returned empty response');
    }

    // 音声データをクライアントに送信
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="dj-talk.wav"');
    
    res.send(Buffer.from(difyResponse.data));

  } catch (error: any) {
    console.error('DJ generate-voice error:', error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: 'AI voice generation timeout. Please try again.'
      });
    } else if (error.response) {
      res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.message || 'Dify API error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate voice'
      });
    }
  }
});

// DJ機能の統合エンドポイント（1回のリクエストでアーティスト取得から音声生成まで）
router.post('/play', async (req: Request, res: Response) => {
  try {
    // デバッグ：リクエスト詳細ログ
    console.log('=== DJ PLAY REQUEST START ===');
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    console.log('Request IP:', req.ip);
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
    // Step 1: バイラルトップ3を取得
    console.log('Step 1: Fetching viral top 3 tracks...');
    
    const viralResults = await spotifyAuth.makeSpotifyRequest('/search', {
      q: 'year:2024',
      type: 'track',
      market: 'JP',
      limit: 50
    });
    
    const tracks = viralResults.tracks.items.map((track: any, index: number) => ({
      position: index + 1,
      name: track.name,
      primary_artist: track.artists[0]?.name,
      popularity: track.popularity
    }));
    
    tracks.sort((a: any, b: any) => b.popularity - a.popularity);
    const top3Artists = tracks.slice(0, 3)
      .map((track: any) => track.primary_artist)
      .filter((artist: string) => artist)
      .join(', ');

    console.log('Top 3 artists:', top3Artists);

    // Step 2: Dify APIで音声生成
    console.log('Step 2: Generating AI DJ voice...');
    
    const difyApiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai';
    const difyApiKey = process.env.DIFY_API_KEY;
    const workflowId = process.env.DIFY_WORKFLOW_ID || 'f61cb5b5-6760-40bb-8dfd-2a58fa70e3d8';

    // デモモード確認（旧設定値の場合）
    if (!difyApiKey || difyApiKey === 'your_dify_api_key_here') {
      console.log('Demo mode: Using mock DJ voice generation for artists:', top3Artists);
      console.log(`[Demo DJ] 今日の人気アーティストトップ3: ${top3Artists}`);
      
      // 1秒待機してリアルな感じを演出
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // モック音声データを生成
      console.log('Generating mock audio buffer...');
      const mockAudioBuffer = generateMockAudio(top3Artists);
      console.log('Mock audio buffer generated:', {
        size: mockAudioBuffer.length,
        type: 'Buffer',
        isBuffer: Buffer.isBuffer(mockAudioBuffer)
      });
      
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', 'attachment; filename="demo-dj-talk.wav"');
      res.setHeader('X-DJ-Artists', top3Artists);
      res.setHeader('X-Demo-Mode', 'true');
      
      // モバイル対応のCORSヘッダー
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      console.log('Sending mock audio response, headers:', {
        contentType: res.getHeader('Content-Type'),
        contentLength: mockAudioBuffer.length,
        artists: res.getHeader('X-DJ-Artists')
      });
      
      return res.send(mockAudioBuffer);
    }

    console.log('🎤 Real Dify mode: Generating AI DJ voice with Dify API');
    console.log(`[Dify DJ] アーティスト: ${top3Artists}`);
    console.log(`[Dify] API Key: ${difyApiKey.substring(0, 10)}...`);
    console.log(`[Dify] Workflow ID: ${workflowId}`);

    // Spec.mdの仕様に従ったDify APIリクエスト
    const difyRequestBody = {
      inputs: {
        ArtistName: top3Artists,
        "sys.files": [],
        "sys.user_id": "581bf1bd-d0db-46f7-ac58-d3c1776573a7",
        "sys.app_id": "219ce180-beb8-4b1c-a726-0eb5f2808d45",
        "sys.workflow_id": "f61cb5b5-6760-40bb-8dfd-2a58fa70e3d8",
        "sys.workflow_run_id": "ff08ecb1-f1de-4ef3-b776-5b1f0c16f7c6"
      },
      response_mode: "blocking",
      user: "abc-123"
    };

    console.log('[Dify] Request body:', JSON.stringify(difyRequestBody, null, 2));

    const difyResponse = await axios.post(
      `${difyApiUrl}/v1/workflows/run`,
      difyRequestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${difyApiKey}`
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    console.log('[Dify] Response status:', difyResponse.status);
    console.log('[Dify] Response headers:', difyResponse.headers);
    console.log('[Dify] Response data type:', typeof difyResponse.data);
    console.log('[Dify] Response data length:', difyResponse.data?.byteLength || 0);

    // レスポンスが音声データかどうか確認
    const contentType = difyResponse.headers['content-type'];
    console.log('[Dify] Content-Type:', contentType);

    // JSONレスポンスの場合、実際の音声データを取得
    if (contentType?.includes('application/json')) {
      const responseText = Buffer.from(difyResponse.data).toString('utf-8');
      console.log('[Dify] JSON Response:', responseText);
      
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('[Dify] Parsed JSON:', jsonResponse);
        
        // 音声データのURLやBase64データを探す
        if (jsonResponse.data && jsonResponse.data.outputs) {
          console.log('[Dify] Outputs:', jsonResponse.data.outputs);
          
          // text配列内の音声ファイルURLを探す
          if (jsonResponse.data.outputs.text && Array.isArray(jsonResponse.data.outputs.text) && jsonResponse.data.outputs.text.length > 0) {
            const audioFile = jsonResponse.data.outputs.text[0];
            if (audioFile.url && audioFile.type === 'audio') {
              const audioUrl = audioFile.url;
              console.log('[Dify] Found audio URL:', audioUrl);
              console.log('[Dify] Audio file info:', { 
                filename: audioFile.filename, 
                size: audioFile.size, 
                mime_type: audioFile.mime_type 
              });
              
              // 音声データを取得してクライアントに転送（リトライ機能付き）
              let audioResponse;
              let retryCount = 0;
              const maxRetries = 3;
              
              while (retryCount < maxRetries) {
                try {
                  console.log(`[Dify] Downloading audio file (attempt ${retryCount + 1}/${maxRetries})...`);
                  audioResponse = await axios.get(audioUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 120000, // 2分タイムアウト
                    maxContentLength: 50 * 1024 * 1024, // 50MB制限
                    headers: {
                      'User-Agent': 'SpotifyMusicExplorer/1.0'
                    }
                  });
                  
                  console.log(`[Dify] Audio download successful, size: ${audioResponse.data.byteLength} bytes`);
                  break; // 成功した場合はループを抜ける
                  
                } catch (downloadError: any) {
                  retryCount++;
                  console.error(`[Dify] Audio download failed (attempt ${retryCount}):`, downloadError.message);
                  
                  if (retryCount >= maxRetries) {
                    throw new Error(`Failed to download audio after ${maxRetries} attempts: ${downloadError.message}`);
                  }
                  
                  // リトライ前に少し待機
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
              
              if (!audioResponse) {
                throw new Error('Audio response is undefined after retries');
              }
              
              const audioBuffer = Buffer.from(audioResponse.data);
              console.log(`[Dify] Sending audio to client, size: ${audioBuffer.length} bytes`);
              
              res.setHeader('Content-Type', 'audio/wav');
              res.setHeader('Content-Length', audioBuffer.length.toString());
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
              res.setHeader('X-DJ-Artists', top3Artists);
              res.setHeader('X-Audio-Size', audioBuffer.length);
              
              // モバイル対応のCORSヘッダー
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              res.setHeader('Access-Control-Expose-Headers', 'X-DJ-Artists, X-Audio-Size');
              
              // チャンク単位でストリーミング送信
              const chunkSize = 8192; // 8KB chunks
              let offset = 0;
              
              const sendChunk = () => {
                if (offset >= audioBuffer.length) {
                  console.log('[Dify] Audio streaming completed');
                  res.end();
                  return;
                }
                
                const chunk = audioBuffer.slice(offset, offset + chunkSize);
                res.write(chunk);
                offset += chunkSize;
                
                // 次のチャンクを少し遅延して送信（バッファ時間を確保）
                setTimeout(sendChunk, 10);
              };
              
              sendChunk();
              return;
            }
          }
        }
      } catch (parseError) {
        console.error('[Dify] Failed to parse JSON response:', parseError);
      }
      
      throw new Error('Dify API returned JSON but no audio data found');
    }

    if (!difyResponse.data || difyResponse.data.byteLength === 0) {
      throw new Error('Dify API returned empty response');
    }

    // 音声データをクライアントに転送
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="dj-talk.wav"');
    res.setHeader('X-DJ-Artists', top3Artists); // ヘッダーでアーティスト情報も送信
    
    // モバイル対応のCORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'X-DJ-Artists');
    
    res.send(Buffer.from(difyResponse.data));

  } catch (error: any) {
    console.error('DJ play error:', error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: 'AI DJ generation timeout. Please try again.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate DJ voice'
      });
    }
  }
});

export default router;
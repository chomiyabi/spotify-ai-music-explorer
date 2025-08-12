import { Router, Request, Response } from 'express';
import axios from 'axios';
import spotifyAuth from '../services/spotifyAuth';

// リトライ設定
const WEBHOOK_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  backoffMultiplier: 2 // 指数バックオフ
};

const router = Router();

// 環境変数の検証（Newsletter機能の有効/無効を決定）
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const NEWSLETTER_ENABLED = N8N_WEBHOOK_URL && N8N_WEBHOOK_URL.startsWith('https://');

if (!NEWSLETTER_ENABLED) {
  console.warn('⚠️  Newsletter機能が無効化されました: N8N_WEBHOOK_URL環境変数が設定されていないか、HTTPSではありません');
  console.warn('   設定値:', N8N_WEBHOOK_URL || 'undefined');
  console.warn('   Newsletter機能を有効にするには、有効なHTTPS URLを設定してください');
} else {
  console.log('✅ Newsletter機能が有効化されました:', N8N_WEBHOOK_URL);
}

// セキュリティログ関数
function securityLog(event: string, data: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    event,
    ip: data.ip,
    userAgent: data.userAgent,
    email: data.email ? data.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
    ...data
  };
  
  console.warn('[SECURITY]', JSON.stringify(logData));
}

// セキュリティ関連の設定
const SECURITY_CONFIG = {
  // メールアドレス検証
  email: {
    maxLength: 254, // RFC 5321準拠
    minLength: 5,
    regex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  },
  // 国コード検証
  country: {
    regex: /^[A-Z]{2}$/, // ISO 3166-1 alpha-2
    maxLength: 2
  },
  // 一般的な文字列検証
  string: {
    maxLength: 1000,
    forbiddenChars: /<script|javascript:|data:|vbscript:|on\w+=/i // XSS対策
  }
};

// 入力値検証関数
function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'メールアドレスが入力されていません' };
  }

  if (email.length < SECURITY_CONFIG.email.minLength) {
    return { isValid: false, error: 'メールアドレスが短すぎます' };
  }

  if (email.length > SECURITY_CONFIG.email.maxLength) {
    return { isValid: false, error: 'メールアドレスが長すぎます' };
  }

  if (!SECURITY_CONFIG.email.regex.test(email)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' };
  }

  // 危険な文字列パターンのチェック
  if (SECURITY_CONFIG.string.forbiddenChars.test(email)) {
    return { isValid: false, error: '不正な文字が含まれています' };
  }

  return { isValid: true };
}

function validateCountryCode(country: string): { isValid: boolean; error?: string } {
  if (!country || typeof country !== 'string') {
    return { isValid: false, error: '国コードが入力されていません' };
  }

  const upperCountry = country.toUpperCase();
  
  if (!SECURITY_CONFIG.country.regex.test(upperCountry)) {
    return { isValid: false, error: '無効な国コード形式です' };
  }

  if (upperCountry.length > SECURITY_CONFIG.country.maxLength) {
    return { isValid: false, error: '国コードが長すぎます' };
  }

  // 危険な文字列パターンのチェック
  if (SECURITY_CONFIG.string.forbiddenChars.test(country)) {
    return { isValid: false, error: '不正な文字が含まれています' };
  }

  return { isValid: true };
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // 基本的なサニタイゼーション
  return input
    .trim()
    .replace(/[<>\"']/g, '') // HTML特殊文字の除去
    .substring(0, SECURITY_CONFIG.string.maxLength); // 長さ制限
}

// レート制限用のストレージ（本番環境ではRedisまたはDBを使用推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number; emails: Set<string> }>();

// レート制限設定
const RATE_LIMIT_CONFIG = {
  window: 15 * 60 * 1000, // 15分間のウィンドウ
  maxRequestsPerIP: 5,     // IPごとの最大リクエスト数
  maxRequestsPerEmail: 3,  // メールアドレスごとの最大リクエスト数
  cleanupInterval: 60 * 60 * 1000 // 1時間ごとにクリーンアップ
};

// レート制限のクリーンアップ処理
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_CONFIG.cleanupInterval);

// レート制限チェック関数
function checkRateLimit(ip: string, email: string): { allowed: boolean; error?: string } {
  const now = Date.now();

  // IPベースのレート制限
  const ipKey = `ip:${ip}`;
  const ipData = rateLimitStore.get(ipKey) || { count: 0, resetTime: now + RATE_LIMIT_CONFIG.window, emails: new Set() };
  
  if (now > ipData.resetTime) {
    // ウィンドウをリセット
    ipData.count = 0;
    ipData.resetTime = now + RATE_LIMIT_CONFIG.window;
    ipData.emails.clear();
  }

  // IP制限チェック
  if (ipData.count >= RATE_LIMIT_CONFIG.maxRequestsPerIP) {
    return { 
      allowed: false, 
      error: `アクセス制限に達しました。${Math.ceil((ipData.resetTime - now) / 1000 / 60)}分後に再試行してください。` 
    };
  }

  // メールアドレス制限チェック
  const emailCount = Array.from(ipData.emails).filter(e => e === email).length;
  if (emailCount >= RATE_LIMIT_CONFIG.maxRequestsPerEmail) {
    return { 
      allowed: false, 
      error: `同じメールアドレスでの登録制限に達しました。${Math.ceil((ipData.resetTime - now) / 1000 / 60)}分後に再試行してください。` 
    };
  }

  // カウントを更新
  ipData.count++;
  ipData.emails.add(email);
  rateLimitStore.set(ipKey, ipData);

  console.log('Rate limit check:', {
    ip,
    email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // メールアドレスをマスク
    currentCount: ipData.count,
    maxRequests: RATE_LIMIT_CONFIG.maxRequestsPerIP,
    resetTime: new Date(ipData.resetTime).toISOString()
  });

  return { allowed: true };
}

// リトライ付きWebhook送信関数
async function sendWebhookWithRetry(
  webhookUrl: string, 
  params: { p: string; mail: string }, 
  retryCount = 0
): Promise<any> {
  try {
    console.log(`Webhook attempt ${retryCount + 1}/${WEBHOOK_RETRY_CONFIG.maxRetries + 1}:`, {
      url: webhookUrl,
      params
    });

    const response = await axios.get(webhookUrl, {
      params,
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });

    console.log(`Webhook success on attempt ${retryCount + 1}:`, {
      status: response.status,
      data: response.data
    });

    return response;

  } catch (error) {
    console.log(`Webhook attempt ${retryCount + 1} failed:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: axios.isAxiosError(error) ? error.response?.status : null,
      retryCount
    });

    // 最大リトライ回数に達した場合はエラーを投げる
    if (retryCount >= WEBHOOK_RETRY_CONFIG.maxRetries) {
      throw error;
    }

    // リトライ可能なエラーかチェック
    const shouldRetry = axios.isAxiosError(error) && (
      error.code === 'ECONNABORTED' || // タイムアウト
      error.code === 'ENOTFOUND' ||    // DNS解決失敗
      error.code === 'ECONNRESET' ||   // 接続リセット
      (error.response && error.response.status >= 500) // 5xxエラー
    );

    if (!shouldRetry) {
      throw error;
    }

    // 指数バックオフで待機
    const delay = WEBHOOK_RETRY_CONFIG.retryDelay * Math.pow(WEBHOOK_RETRY_CONFIG.backoffMultiplier, retryCount);
    console.log(`Waiting ${delay}ms before retry...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // リトライ実行
    return sendWebhookWithRetry(webhookUrl, params, retryCount + 1);
  }
}

// Spotify APIの市場（国）リスト
const SPOTIFY_MARKETS = [
  { code: 'JP', name: '日本' },
  { code: 'US', name: 'アメリカ' },
  { code: 'GB', name: 'イギリス' },
  { code: 'DE', name: 'ドイツ' },
  { code: 'FR', name: 'フランス' },
  { code: 'ES', name: 'スペイン' },
  { code: 'IT', name: 'イタリア' },
  { code: 'CA', name: 'カナダ' },
  { code: 'AU', name: 'オーストラリア' },
  { code: 'BR', name: 'ブラジル' },
  { code: 'MX', name: 'メキシコ' },
  { code: 'KR', name: '韓国' },
  { code: 'IN', name: 'インド' },
  { code: 'NL', name: 'オランダ' },
  { code: 'SE', name: 'スウェーデン' },
  { code: 'NO', name: 'ノルウェー' },
  { code: 'DK', name: 'デンマーク' },
  { code: 'FI', name: 'フィンランド' },
  { code: 'PL', name: 'ポーランド' },
  { code: 'AR', name: 'アルゼンチン' }
];

// キャッシュ用の変数
let marketsCache: any = null;
let marketsCacheTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

// 利用可能な市場リストを取得
router.get('/markets', async (req: Request, res: Response) => {
  try {
    // キャッシュが有効な場合はキャッシュから返す
    const now = Date.now();
    if (marketsCache && (now - marketsCacheTime) < CACHE_DURATION) {
      console.log('Returning cached markets data');
      return res.json({
        success: true,
        data: marketsCache,
        cached: true
      });
    }

    // Spotify APIから利用可能な市場を取得（必要に応じて）
    // 現時点では静的リストを使用
    marketsCache = SPOTIFY_MARKETS;
    marketsCacheTime = now;

    res.json({
      success: true,
      data: SPOTIFY_MARKETS,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({
      success: false,
      error: '市場リストの取得に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 指定国のトップアーティストを取得
router.get('/top-artist', async (req: Request, res: Response) => {
  try {
    const { country } = req.query;

    // 国コードの検証
    if (!country || typeof country !== 'string') {
      return res.status(400).json({
        success: false,
        error: '国コードが指定されていません'
      });
    }

    // 有効な国コードか確認
    const validMarket = SPOTIFY_MARKETS.find(m => m.code === country.toUpperCase());
    if (!validMarket) {
      return res.status(400).json({
        success: false,
        error: '無効な国コードです',
        availableMarkets: SPOTIFY_MARKETS.map(m => m.code)
      });
    }

    // Spotify APIからアクセストークンを取得
    const accessToken = await spotifyAuth.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // Spotify APIで指定国のトップアーティストを検索
    // まずは国別のトップトラックを取得し、そこからアーティストを抽出
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: 'year:2024',  // 最新の楽曲を取得
          type: 'track',
          market: country.toUpperCase(),
          limit: 50
        }
      }
    );

    // トラックからアーティストを抽出し、最も人気のあるアーティストを選定
    const tracks = searchResponse.data.tracks?.items || [];
    const artistFrequency: { [key: string]: { name: string; count: number; popularity: number } } = {};

    // アーティストの出現頻度と人気度を集計
    tracks.forEach((track: any) => {
      if (track.artists && track.artists.length > 0) {
        const artist = track.artists[0]; // メインアーティストのみ取得
        if (artist.id) {
          if (!artistFrequency[artist.id]) {
            artistFrequency[artist.id] = {
              name: artist.name,
              count: 0,
              popularity: track.popularity || 0
            };
          }
          artistFrequency[artist.id].count++;
          artistFrequency[artist.id].popularity = Math.max(
            artistFrequency[artist.id].popularity,
            track.popularity || 0
          );
        }
      }
    });

    // 頻度と人気度でソートしてトップアーティストを取得
    const topArtists = Object.values(artistFrequency)
      .sort((a, b) => {
        // まず頻度でソート、同じ場合は人気度でソート
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.popularity - a.popularity;
      })
      .slice(0, 3); // トップ3アーティストを取得

    if (topArtists.length === 0) {
      return res.status(404).json({
        success: false,
        error: '指定された国のアーティストが見つかりませんでした'
      });
    }

    // 最もトップのアーティスト
    const topArtist = topArtists[0];

    res.json({
      success: true,
      data: {
        country: validMarket,
        topArtist: {
          name: topArtist.name,
          popularity: topArtist.popularity,
          trackCount: topArtist.count
        },
        topThreeArtists: topArtists.map(artist => ({
          name: artist.name,
          popularity: artist.popularity,
          trackCount: artist.count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching top artist:', error);
    
    // Spotify API特有のエラー処理
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Spotify認証エラー',
          message: 'アクセストークンの更新が必要です'
        });
      }
      if (error.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'レート制限エラー',
          message: 'Spotify APIのレート制限に達しました。しばらく待ってから再試行してください。'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'トップアーティストの取得に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ニュースレター購読（n8n Webhook連携）
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    // Newsletter機能が無効な場合のエラーハンドリング
    if (!NEWSLETTER_ENABLED) {
      console.warn('Newsletter subscribe attempt with disabled service:', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(503).json({
        success: false,
        error: 'ニュースレター機能は現在利用できません',
        message: '管理者が環境設定を完了するまでお待ちください'
      });
    }

    let { email, country } = req.body;

    // 入力値の基本チェック
    if (!email || !country) {
      return res.status(400).json({
        success: false,
        error: 'メールアドレスと国の指定が必要です'
      });
    }

    // 入力値のサニタイゼーション
    email = sanitizeInput(email);
    country = sanitizeInput(country);

    // メールアドレスの厳密なバリデーション
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      securityLog('INVALID_EMAIL_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email,
        error: emailValidation.error
      });
      return res.status(400).json({
        success: false,
        error: emailValidation.error
      });
    }

    // 国コードの厳密なバリデーション
    const countryValidation = validateCountryCode(country);
    if (!countryValidation.isValid) {
      securityLog('INVALID_COUNTRY_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        country,
        error: countryValidation.error
      });
      return res.status(400).json({
        success: false,
        error: countryValidation.error
      });
    }

    // サポートされている国コードかチェック
    const validMarket = SPOTIFY_MARKETS.find(m => m.code === country.toUpperCase());
    if (!validMarket) {
      console.warn('Unsupported country code:', { country, ip: req.ip });
      return res.status(400).json({
        success: false,
        error: 'この国はサポートされていません',
        availableCountries: SPOTIFY_MARKETS.map(m => `${m.code}: ${m.name}`)
      });
    }

    // レート制限チェック
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP, email);
    if (!rateLimitCheck.allowed) {
      securityLog('RATE_LIMIT_EXCEEDED', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        email,
        error: rateLimitCheck.error
      });
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.error
      });
    }

    // トップアーティストを直接取得するロジックを実装
    const accessToken = await spotifyAuth.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // Spotify APIで指定国のトップアーティストを検索
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: 'year:2024',
          type: 'track',
          market: country.toUpperCase(),
          limit: 50
        }
      }
    );

    // トラックからアーティストを抽出
    const tracks = searchResponse.data.tracks?.items || [];
    const artistFrequency: { [key: string]: { name: string; count: number; popularity: number } } = {};

    tracks.forEach((track: any) => {
      if (track.artists && track.artists.length > 0) {
        const artist = track.artists[0];
        if (artist.id) {
          if (!artistFrequency[artist.id]) {
            artistFrequency[artist.id] = {
              name: artist.name,
              count: 0,
              popularity: track.popularity || 0
            };
          }
          artistFrequency[artist.id].count++;
          artistFrequency[artist.id].popularity = Math.max(
            artistFrequency[artist.id].popularity,
            track.popularity || 0
          );
        }
      }
    });

    const topArtists = Object.values(artistFrequency)
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.popularity - a.popularity;
      });

    if (topArtists.length === 0) {
      throw new Error('No artists found for the specified country');
    }

    const artistName = topArtists[0].name;

    // n8n Webhookに送信（NEWSLETTER_ENABLEDでチェック済みなのでN8N_WEBHOOK_URLは確実に存在）
    const webhookUrl = N8N_WEBHOOK_URL!;
    
    const webhookParams = {
      p: encodeURIComponent(artistName),
      mail: email
    };

    console.log(`Preparing to send webhook to n8n:`, {
      url: webhookUrl,
      params: webhookParams,
      artist: artistName,
      email: email,
      country
    });

    // リトライ機能付きでWebhookを送信
    const webhookResponse = await sendWebhookWithRetry(webhookUrl, webhookParams);

    console.log(`Final n8n Webhook response:`, {
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      data: webhookResponse.data
    });

    console.log(`Newsletter subscription successful for ${email} (${country}): ${artistName}`);

    res.json({
      success: true,
      message: 'ニュースレターの購読が完了しました',
      data: {
        email,
        country: validMarket.name,
        artist: artistName
      }
    });

  } catch (error) {
    console.error('Error subscribing to newsletter:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });

    // Spotify API関連エラー
    if (axios.isAxiosError(error) && error.config?.url?.includes('api.spotify.com')) {
      if (error.response?.status === 401) {
        return res.status(502).json({
          success: false,
          error: 'Spotify API認証エラー',
          message: '音楽サービスとの接続に問題があります。しばらく待ってから再試行してください。'
        });
      }
      if (error.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'レート制限エラー',
          message: 'アクセスが集中しています。少し時間をおいてから再試行してください。'
        });
      }
    }

    // n8n Webhook関連エラー
    if (axios.isAxiosError(error) && error.config?.url?.includes('n8n.cloud')) {
      // タイムアウトエラー
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({
          success: false,
          error: 'ニュースレター登録タイムアウト',
          message: 'ニュースレターの登録処理に時間がかかっています。後でもう一度お試しください。'
        });
      }

      // 接続エラー
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
        return res.status(503).json({
          success: false,
          error: 'ニュースレターサービス接続エラー',
          message: 'ニュースレターサービスに接続できません。しばらく待ってから再試行してください。'
        });
      }

      // 5xxサーバーエラー
      if (error.response?.status && error.response.status >= 500) {
        return res.status(503).json({
          success: false,
          error: 'ニュースレターサービス一時停止',
          message: 'ニュースレターサービスが一時的に利用できません。後でもう一度お試しください。'
        });
      }

      // 4xxクライアントエラー
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return res.status(400).json({
          success: false,
          error: 'ニュースレター登録エラー',
          message: '登録情報に問題があります。メールアドレスと国を確認してください。'
        });
      }
    }

    // その他の予期しないエラー
    res.status(500).json({
      success: false,
      error: 'ニュースレターの購読に失敗しました',
      message: '予期しないエラーが発生しました。しばらく待ってから再試行してください。'
    });
  }
});

export default router;
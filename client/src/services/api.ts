import axios from 'axios';

// APIベースURLの設定（開発環境では強制的にlocalhost使用）
const API_BASE_URL = (() => {
  // 開発時の強制設定 - localhost:3001で動作中はlocalhostのAPIを使用
  const forcedLocalUrl = 'http://localhost:5001/api';
  console.log('FORCED LOCAL API URL (for development):', forcedLocalUrl);
  return forcedLocalUrl;
  
  // NOTE: 本番デプロイ時は以下のコードに戻す
  // const hostname = window.location.hostname;
  // const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1';
  // return isProduction 
  //   ? 'https://spotify-ai-music-explorer-production.railway.app/api'
  //   : 'http://localhost:5001/api';
})();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // モバイル対応のため無効化
});

// デバッグ用ログ
console.log('API Base URL:', API_BASE_URL);

apiClient.interceptors.request.use(
  (config) => {
    // モバイルブラウザ用のヘッダー追加
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      baseURL: error.config?.baseURL
    });
    
    // ネットワークエラーの場合
    if (!error.response) {
      console.error('Network Error - No response from server');
      console.error('Possible CORS issue or server is down');
    }
    
    return Promise.reject(error);
  }
);

export interface ApiSearchParams {
  q: string;
  type?: string;
  limit?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  text?: string; // DJ生成API用
  variations?: string[]; // DJ生成API用
  chartData?: any; // DJ生成API用
  metadata?: any; // DJ生成API用
}

export const apiService = {
  healthCheck: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  testSearch: async (params: ApiSearchParams): Promise<ApiResponse> => {
    const response = await apiClient.get('/test/search', { params });
    return response.data;
  },

  getTopTracks: async (country: 'jp' | 'global'): Promise<ApiResponse> => {
    const response = await apiClient.get(`/test/top-tracks/${country}`);
    return response.data;
  },

  checkToken: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/auth/token');
    return response.data;
  },

  // DJ機能API
  getDJCharts: async (type: 'daily-top' | 'viral' | 'new-releases'): Promise<ApiResponse> => {
    const response = await apiClient.get(`/dj/charts/${type}`);
    return response.data;
  },

  generateDJText: async (chartData: any, version: 'short' | 'standard' | 'long' | 'variations' = 'standard'): Promise<ApiResponse> => {
    const response = await apiClient.post('/dj/generate-text', { chartData, version });
    return response.data;
  },

  generateDJComplete: async (type: 'daily-top' | 'viral' | 'new-releases', version: 'short' | 'standard' | 'long' | 'variations' = 'standard'): Promise<ApiResponse> => {
    const response = await apiClient.get(`/dj/generate/${type}/${version}`);
    return response.data;
  },

  // プリセット機能のAPIエンドポイント
  getViralTracks: async (country: 'jp'): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/viral-jp');
    return response.data;
  },

  getGlobalTop: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/global-top');
    return response.data;
  },

  getTopArtists: async (country: 'jp'): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/artists-jp');
    return response.data;
  },

  getNewReleases: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/new-releases');
    return response.data;
  },

  getWorkoutPlaylists: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/workout');
    return response.data;
  },

  // Phase 5: 新しいプリセット機能
  getUSArtists: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/us-artists');
    return response.data;
  },

  getKPOPTracks: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/kpop');
    return response.data;
  },

  getAnimeSongs: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/anime');
    return response.data;
  },

  getLatestSingles: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/latest-singles');
    return response.data;
  },

  getPodcasts: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/preset/podcasts');
    return response.data;
  },

  // Phase 6: AI検索機能
  aiSearch: async (query: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/ai/search', { query });
    return response.data;
  },

  aiInterpret: async (query: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/ai/interpret', { query });
    return response.data;
  },

  // Phase 11: ニュースレター機能
  newsletterGetMarkets: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/newsletter/markets');
    return response.data;
  },

  newsletterGetTopArtist: async (country: string): Promise<ApiResponse> => {
    const response = await apiClient.get('/newsletter/top-artist', {
      params: { country }
    });
    return response.data;
  },

  newsletterSubscribe: async (email: string, country: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/newsletter/subscribe', {
      email,
      country
    });
    return response.data;
  },
};

export default apiService;
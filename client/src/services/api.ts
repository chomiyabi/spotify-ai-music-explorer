import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
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
};

export default apiService;
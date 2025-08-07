import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class SpotifyAuthService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify API credentials are not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file');
    }
  }

  private isTokenExpired(): boolean {
    return Date.now() >= this.tokenExpiryTime;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && !this.isTokenExpired()) {
      return this.accessToken;
    }

    try {
      const tokenUrl = 'https://accounts.spotify.com/api/token';
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post<SpotifyToken>(
        tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiryTime = Date.now() + (response.data.expires_in * 1000) - 60000;

      console.log('Spotify access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('Failed to obtain Spotify access token:', error);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  async makeSpotifyRequest(endpoint: string, params?: any): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(`https://api.spotify.com/v1${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiryTime = 0;
        return this.makeSpotifyRequest(endpoint, params);
      }
      
      throw error;
    }
  }
}

export default new SpotifyAuthService();
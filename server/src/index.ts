import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import testRoutes from './routes/test';
import presetRoutes from './routes/preset';
import aiRoutes from './routes/ai';
import djRoutes from './routes/dj';
import newsletterRoutes from './routes/newsletter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS設定 - モバイルブラウザ完全対応
const corsOptions = {
  origin: true, // すべてのオリジンを許可（モバイル対応）
  credentials: false, // モバイル対応のため無効化
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // プリフライトリクエストのキャッシュ時間（24時間）
  optionsSuccessStatus: 200 // 古いブラウザ対応
};

app.use(cors(corsOptions));

// OPTIONSリクエストへの明示的な対応（プリフライト）
app.options('*', cors(corsOptions));

// セキュリティヘッダーの設定
app.use((req, res, next) => {
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Type sniffing防止
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Clickjacking防止
  res.setHeader('X-Frame-Options', 'DENY');
  
  // HSTS (本番環境でHTTPS使用時)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy (基本的な設定)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.spotify.com https://*.n8n.cloud https://api.dify.ai; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self' blob:; " +
    "base-uri 'self';"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// JSONペイロードサイズ制限とセキュリティ設定
app.use(express.json({ 
  limit: '10mb',  // 10MBに制限
  verify: (req: any, res, buf) => {
    // Raw bodyを保存（署名検証等で使用可能）
    req.rawBody = buf;
  }
}));
app.use(apiRateLimiter.middleware());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/preset', presetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dj', djRoutes);
app.use('/api/newsletter', newsletterRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test search: http://localhost:${PORT}/api/test/search?q=shape of you`);
  
  // 環境変数の状態をログ出力
  console.log('\n🔧 Environment Configuration:');
  console.log('================================');
  
  // Spotify API
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    console.log('✅ Spotify API: Configured');
  } else {
    console.log('❌ Spotify API: Missing credentials');
  }
  
  // Dify AI Integration
  if (process.env.DIFY_API_KEY && process.env.DIFY_API_KEY !== 'your_dify_api_key_here') {
    console.log('✅ Dify AI: Configured (API Key: app-***' + process.env.DIFY_API_KEY?.slice(-4) + ')');
    console.log('   - Workflow ID:', process.env.DIFY_WORKFLOW_ID || 'Using default');
    console.log('   - API URL:', process.env.DIFY_API_URL || 'Using default');
  } else {
    console.log('⚠️  Dify AI: Demo mode (No API key configured)');
    console.log('   💡 Set DIFY_API_KEY environment variable for AI DJ feature');
  }
  
  // Newsletter Integration
  if (process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL.startsWith('https://')) {
    console.log('✅ Newsletter: Configured');
  } else {
    console.log('⚠️  Newsletter: Disabled (No webhook URL configured)');
  }
  
  // Claude AI
  if (process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'your_claude_api_key_here') {
    console.log('✅ Claude AI: Configured');
  } else {
    console.log('⚠️  Claude AI: Not configured (AI search will use fallback)');
  }
  
  console.log('================================\n');
});
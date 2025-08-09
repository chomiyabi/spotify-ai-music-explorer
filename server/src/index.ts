import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import testRoutes from './routes/test';
import presetRoutes from './routes/preset';
import aiRoutes from './routes/ai';
import djRoutes from './routes/dj';
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

app.use(express.json());
app.use(apiRateLimiter.middleware());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/preset', presetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dj', djRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test search: http://localhost:${PORT}/api/test/search?q=shape of you`);
});
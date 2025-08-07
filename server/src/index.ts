import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import testRoutes from './routes/test';
import presetRoutes from './routes/preset';
import aiRoutes from './routes/ai';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // 本番環境では特定のドメインのみ許可、開発環境ではすべて許可
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://spotify-ai-music-explorer.vercel.app',
        'https://spotify-ai-music-explorer-chomiyabi.vercel.app',
        /https:\/\/spotify-ai-music-explorer.*\.vercel\.app$/,
        process.env.CLIENT_URL
      ];
      
      if (!origin || allowedOrigins.some(allowed => 
        allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
      )) {
        callback(null, true);
      } else {
        callback(null, true); // 一時的にすべて許可
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(apiRateLimiter.middleware());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/preset', presetRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test search: http://localhost:${PORT}/api/test/search?q=shape of you`);
});
import { Router, Request, Response } from 'express';
import spotifyAuth from '../services/spotifyAuth';

const router = Router();

router.get('/token', async (_req: Request, res: Response) => {
  try {
    const token = await spotifyAuth.getAccessToken();
    res.json({ 
      success: true,
      message: 'Token obtained successfully',
      hasToken: !!token
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to obtain access token' 
    });
  }
});

export default router;
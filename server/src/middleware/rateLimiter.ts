import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    setInterval(() => this.cleanup(), windowMs);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();

      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
        return next();
      }

      this.store[key].count++;

      if (this.store[key].count > this.maxRequests) {
        const retryAfter = Math.ceil((this.store[key].resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter
        });
      }

      next();
    };
  }
}

export const apiRateLimiter = new RateLimiter(60000, 100);
export const spotifyRateLimiter = new RateLimiter(60000, 30);
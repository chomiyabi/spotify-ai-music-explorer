// Force Vercel rebuild trigger
// This file ensures Vercel detects changes and rebuilds the application
// Generated: 2025-08-13T00:15:00.000Z

export const DEPLOYMENT_INFO = {
  timestamp: '2025-08-13T00:15:00.000Z',
  version: '1.2.0',
  features: [
    'AI DJ Radio with Dify integration',
    'Newsletter subscription with n8n webhook',
    'Enhanced UI/UX improvements',
    'Force rebuild mechanism'
  ],
  buildHash: Math.random().toString(36).substring(7),
  forceRebuild: true
} as const;

// This constant will change the bundle hash and force a new deployment
export default DEPLOYMENT_INFO;
# Railway環境変数設定ガイド

## 🚨 重要：以下の環境変数をRailway本番環境に設定してください

Railway Dashboard → Settings → Variables で以下の環境変数を追加：

### 必須環境変数

#### Spotify API（既に設定済みの可能性あり）
```
SPOTIFY_CLIENT_ID=0bb3b0b4c8cc4bcbae09587de5e12878
SPOTIFY_CLIENT_SECRET=d63f75bafda649b5b9303d6b048c7667
```

#### Dify AI Integration（AI DJ機能に必須）
```
DIFY_API_URL=https://api.dify.ai
DIFY_API_KEY=app-7NbhsYDF9wP0trIPIO5EYlEo
DIFY_WORKFLOW_ID=f61cb5b5-6760-40bb-8dfd-2a58fa70e3d8
```

#### Newsletter Configuration（Newsletter機能）
```
N8N_WEBHOOK_URL=https://chomiyabi.app.n8n.cloud/webhook/4447ccd3-c50b-4d48-945b-187ad677002a
```

#### Server Configuration
```
PORT=5001
CLIENT_URL=https://spotify-ai-music-explorer.vercel.app
```

#### Claude API（オプション - AI検索機能用）
```
CLAUDE_API_KEY=your_claude_api_key_here
```

## 設定手順

1. Railway Dashboard (https://railway.app) にログイン
2. 該当プロジェクトを選択
3. 左側メニューから「Variables」タブを選択
4. 「RAW Editor」モードに切り替え
5. 上記の環境変数をコピー＆ペースト
6. 「Save Changes」をクリック
7. 自動的に再デプロイが開始されます

## 確認方法

設定後、以下のエンドポイントで動作確認：
- AI DJ: `https://spotify-ai-music-explorer-production.railway.app/api/dj/play`
- Newsletter: `https://spotify-ai-music-explorer-production.railway.app/api/newsletter/subscribe`

## トラブルシューティング

AI DJが動作しない場合：
1. DIFY_API_KEY, DIFY_WORKFLOW_ID が正しく設定されているか確認
2. Railway のログで「Dify API configured successfully」メッセージを確認
3. ブラウザの開発者ツールでCORSエラーがないか確認

Newsletter機能が動作しない場合：
1. N8N_WEBHOOK_URLが正しく設定されているか確認
2. Railway のログで「Newsletter機能が有効化されました」メッセージを確認
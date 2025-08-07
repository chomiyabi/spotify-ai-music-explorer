# Deployment Guide - Spotify AI Music Explorer 🚀

このドキュメントは、Spotify AI Music Explorerを本番環境にデプロイするための詳細な手順を説明します。

## 📋 デプロイ前の準備

### 1. 必要なアカウント作成
- [ ] **GitHub**: プロジェクトリポジトリ
- [ ] **Vercel**: フロントエンドホスティング ([vercel.com](https://vercel.com))
- [ ] **Railway**: バックエンドホスティング ([railway.app](https://railway.app))
- [ ] **Spotify Developer**: API認証 ([developer.spotify.com](https://developer.spotify.com))
- [ ] **Claude API**: AI検索機能 ([console.anthropic.com](https://console.anthropic.com)) ※オプション

### 2. 環境変数の準備
`.env.example`を参考に、以下の環境変数を準備してください：

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
CLAUDE_API_KEY=your_claude_api_key # オプション
```

## 🎯 デプロイ手順

### Phase 1: GitHubリポジトリの準備

1. **リポジトリの作成**
```bash
# GitHubで新しいリポジトリを作成
git init
git add .
git commit -m "初期コミット - Spotify AI Music Explorer"
git branch -M main
git remote add origin https://github.com/yourusername/spotify-ai-music-explorer.git
git push -u origin main
```

### Phase 2: Railwayでバックエンドをデプロイ

1. **Railwayプロジェクト作成**
   - [Railway Dashboard](https://railway.app/dashboard)にアクセス
   - "New Project" → "Deploy from GitHub repo"
   - リポジトリを選択

2. **環境変数設定**
   - Railway Dashboard → Variables タブ
   - 以下を設定：
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   CLAUDE_API_KEY=your_claude_key
   PORT=5001
   NODE_ENV=production
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```

3. **ビルド設定**
   - Settings → Build タブ
   - Root Directory: `/server`
   - Build Command: `npm run build:prod`
   - Start Command: `npm run start:prod`

4. **デプロイURL確認**
   - デプロイ完了後、URLをメモ（例: `https://spotify-server-production.railway.app`）

### Phase 3: Vercelでフロントエンドをデプロイ

1. **Vercelプロジェクト作成**
   - [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
   - "New Project" → GitHubリポジトリを選択

2. **ビルド設定**
   - Framework Preset: `Create React App`
   - Root Directory: `client`
   - Build Command: `npm run build:prod`
   - Output Directory: `build`

3. **環境変数設定**
   - Project Settings → Environment Variables
   - 追加：
   ```
   REACT_APP_API_URL=https://your-railway-backend.railway.app
   ```

4. **デプロイ**
   - "Deploy"をクリック
   - デプロイ完了後、URLを確認

### Phase 4: CI/CD設定

GitHub Actionsは既に設定済みです（`.github/workflows/deploy.yml`）。

**必要なGitHub Secrets:**
- Repository Settings → Secrets and variables → Actions
- 以下のsecretsを追加：

```
RAILWAY_TOKEN=your_railway_token
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
REACT_APP_API_URL=https://your-railway-backend.railway.app
```

## 🔍 デプロイ後の確認

### 1. 基本動作確認
- [ ] フロントエンドがロードされる
- [ ] プリセットボタンが動作する
- [ ] Spotify APIからデータが取得される
- [ ] AI検索が動作する（Claude APIキーが設定されている場合）

### 2. パフォーマンス確認
- [ ] **Lighthouse監査**: 90点以上
- [ ] **Core Web Vitals**: 全て緑
- [ ] **PWA機能**: インストール可能

### 3. エラー監視設定
```javascript
// Sentry設定例（オプション）
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

## 🛠 トラブルシューティング

### よくある問題と解決策

#### 1. CORS エラー
**症状**: フロントエンドからバックエンドAPI呼び出しが失敗
**解決**: バックエンドの環境変数`CLIENT_URL`を正しいVercel URLに設定

#### 2. 環境変数が読み込まれない
**症状**: API呼び出しが401エラーで失敗
**解決**: Vercel/Railway の環境変数設定を再確認し、デプロイを再実行

#### 3. ビルドエラー
**症状**: デプロイ時にビルドが失敗
**解決**: 
- 依存関係の確認: `npm install`
- TypeScript型エラーの修正
- メモリ不足の場合: Railway/Vercelプランをアップグレード

## 📊 監視とメンテナンス

### 推奨監視ツール
- **Uptime Robot**: サービス稼働監視
- **Google Analytics**: ユーザー行動分析
- **Railway/Vercel Analytics**: パフォーマンス監視

### 定期メンテナンス
- [ ] 月次: 依存関係のアップデート
- [ ] 四半期: セキュリティ監査
- [ ] 半年: パフォーマンス最適化レビュー

## 💰 コスト見積もり

| サービス | 月額 | 用途 |
|---------|------|------|
| Vercel Pro | $20 | フロントエンドホスティング |
| Railway | $5-20 | バックエンドサーバー |
| ドメイン | $1 | 独自ドメイン（年額$12） |
| Claude API | $0-50 | AI機能（従量課金） |
| **合計** | **$26-91** | **月額（使用量により変動）** |

## 🚀 本番環境URL例

- **フロントエンド**: https://spotify-ai-explorer.vercel.app
- **バックエンドAPI**: https://spotify-server-production.railway.app
- **ヘルスチェック**: https://spotify-server-production.railway.app/api/health

## 📞 サポート

問題が発生した場合は、以下を確認してください：
1. [GitHub Issues](https://github.com/yourusername/spotify-ai-music-explorer/issues)
2. Railway/Vercelのログ
3. ブラウザの開発者ツール

---

**🎉 デプロイ完了後は、Spotify AI Music Explorerが世界中のユーザーに利用可能になります！**
# Phase 1: Spotify API基盤構築 - セットアップガイド

## 実装完了項目

### ✅ 1. Spotify認証サービス (`server/src/services/spotifyAuth.ts`)
- Client Credentials Flowの実装
- 自動トークン更新機能
- トークンの有効期限管理
- リトライロジック（401エラー時の自動再認証）

### ✅ 2. APIエンドポイント
- `/api/health` - ヘルスチェック
- `/api/auth/token` - トークン取得状態確認
- `/api/test/search` - 楽曲検索テスト
- `/api/test/top-tracks/:country` - 国別トップトラック取得

### ✅ 3. エラーハンドリング
- グローバルエラーハンドラー
- 404ハンドラー
- レート制限機能（1分間に100リクエストまで）
- Spotify API専用レート制限（1分間に30リクエストまで）

### ✅ 4. テストスクリプト
- `server/test-api.js` - API接続の自動テスト

## セットアップ手順

### 1. Spotify API認証情報の取得

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)にアクセス
2. ログインまたはアカウント作成
3. 「Create an app」をクリック
4. アプリ情報を入力:
   - App name: `Spotify Visualize` (任意)
   - App description: `Music data visualization app`
   - Redirect URI: `http://localhost:3000/callback` (今回は使用しないが設定必須)
5. 「Create」をクリック
6. 作成されたアプリのダッシュボードから:
   - `Client ID`をコピー
   - 「Show Client Secret」をクリックして`Client Secret`をコピー

### 2. 環境変数の設定

`server/.env`ファイルを編集:

```env
# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_actual_client_id_here
SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here

# Claude API (Phase 6で使用予定)
CLAUDE_API_KEY=your_claude_api_key_here

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000
```

### 3. サーバーの起動

プロジェクトルートディレクトリで:

```bash
cd server
npm run dev
```

または、プロジェクトルートから:

```bash
npm run server:dev
```

### 4. API接続テスト

新しいターミナルを開いて:

```bash
cd server
node test-api.js
```

## 成功確認ポイント

テストスクリプト実行時に以下が確認できれば成功:

1. ✅ Health Check: `{ status: 'OK', message: 'Server is running' }`
2. ✅ Token Status: `{ success: true, hasToken: true }`
3. ✅ Search Results: 検索結果が表示される
4. ✅ Japan Top Tracks: 日本のトップ50が表示される
5. ✅ Global Top Tracks: グローバルトップ50が表示される

## トラブルシューティング

### エラー: "Spotify API credentials are not configured"
→ `.env`ファイルにClient IDとClient Secretが正しく設定されているか確認

### エラー: "Failed to authenticate with Spotify API"
→ Client IDとClient Secretが正しいか確認（スペースや改行が入っていないか）

### エラー: "ECONNREFUSED"
→ サーバーが起動しているか確認（`npm run dev`）

### エラー: "429 Too Many Requests"
→ レート制限に達しています。1分待ってから再試行

## 次のステップ (Phase 2)

Phase 1が正常に動作することを確認したら、Phase 2のフロントエンドUI構築に進みます。

## 追加情報

### 利用可能なSpotify APIエンドポイント

現在の実装で以下のSpotify APIにアクセス可能:
- Search API
- Playlists API
- Tracks API
- Artists API
- Albums API

### データ形式

APIレスポンスは以下の形式に整形されています:

```javascript
{
  id: string,
  name: string,
  artists: string,
  album: string,
  image: string,
  preview_url: string,
  external_url: string
}
```
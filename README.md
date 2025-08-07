# Spotify Data Visualization Application

Spotifyの音楽データを視覚的に表示し、ユーザーが簡単に音楽トレンドを探索できるアプリケーションです。

## 機能

- プリセットボタンによる人気データの即座表示
- AIを活用したフリーテキスト検索
- ユーザーログイン不要で利用可能

## セットアップ

### 必要条件

- Node.js (v14以上)
- npm または yarn
- Spotify APIクレデンシャル
- Claude API キー（オプション：AI検索機能用）

### インストール手順

1. リポジトリのクローン
```bash
git clone [repository-url]
cd spotify-visualize
```

2. 依存関係のインストール
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. 環境変数の設定
`.env.example`を参考に、`server/.env`ファイルを作成し、以下の情報を設定：
- `SPOTIFY_CLIENT_ID`: Spotify APIのクライアントID
- `SPOTIFY_CLIENT_SECRET`: Spotify APIのクライアントシークレット
- `CLAUDE_API_KEY`: Claude APIキー（AI検索機能用）

### 開発環境の起動

プロジェクトルートで以下のコマンドを実行：

```bash
npm run dev
```

これにより、以下が起動します：
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:5000

## プロジェクト構造

```
spotify-visualize/
├── client/          # Reactフロントエンド
│   ├── src/
│   └── public/
├── server/          # Express バックエンド
│   ├── src/
│   └── dist/
├── Spec.md          # 詳細仕様書
└── README.md        # このファイル
```

## 利用可能なスクリプト

- `npm run dev`: 開発環境（フロントエンド＋バックエンド）の起動
- `npm run build`: プロダクションビルドの作成
- `npm run server:dev`: バックエンドのみ起動
- `npm run client:dev`: フロントエンドのみ起動
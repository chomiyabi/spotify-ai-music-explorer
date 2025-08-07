# Spotify AI Music Explorer

## プロジェクト概要

**Spotify AI Music Explorer**は、AI自然言語検索機能を搭載したSpotify音楽発見Webアプリケーションです。ユーザーが「雨の日に聞きたい音楽」「90年代の懐かしいJ-POP」のような自然な日本語で音楽を検索でき、10種類のプリセット機能、30秒プレビュー再生、高度なフィルタリング機能を提供します。

## 🎯 主要機能

### 🤖 AI自然言語検索
- Claude AIを使用した日本語クエリ解釈
- ジャンル・気分・年代の自動判別
- 複数検索クエリによる結果最適化
- フォールバックモード対応

### 🎵 プリセット機能（10種類）
1. **日本のバイラル Top 50** - 話題の日本楽曲
2. **世界の Top 50** - グローバルヒットチャート
3. **日本の Top アーティスト** - 人気アーティストランキング
4. **最新リリース** - 新着アルバム・シングル
5. **ワークアウト向けプレイリスト** - 運動に適した楽曲
6. **アメリカの Top アーティスト** - 米国人気アーティスト
7. **K-POP ジャンル人気プレイリスト** - 韓国発K-POPトラック
8. **アニメソング人気プレイリスト** - アニメ主題歌・挿入歌
9. **最新リリースシングル** - 最新シングル楽曲
10. **今日のポッドキャストランキング** - 人気ポッドキャスト

### 🎨 高度なUI/UX機能
- **30秒プレビュー再生** - HTML5 Audio API使用
- **詳細モーダル表示** - 楽曲詳細情報とSpotify連携
- **高度なフィルタリング** - 検索・ソート・人気度フィルター
- **インテリジェントページネーション** - 表示件数変更対応
- **レスポンシブデザイン** - 全デバイス対応
- **プログレッシブWebApp (PWA)** - インストール可能

## 🚀 技術スタック

### フロントエンド
- **React 19** + TypeScript
- **Context API** - 状態管理
- **HTML5 Audio API** - プレビュー再生
- **CSS Grid & Flexbox** - レスポンシブレイアウト
- **PWA** - Service Worker対応

### バックエンド
- **Node.js** + Express + TypeScript
- **Spotify Web API** - Client Credentials Flow
- **Claude AI API** - 自然言語処理
- **Axios** - HTTP クライアント
- **CORS & Rate Limiting** - セキュリティ対策

### 開発・デプロイ
- **TypeScript** - 型安全性
- **ESLint** - コード品質管理
- **React Error Boundary** - エラーハンドリング
- **環境変数管理** - dotenv

## 📁 プロジェクト構成

```
spotify-visualize/
├── client/                    # React フロントエンド
│   ├── public/
│   │   ├── index.html        # SEO最適化・OGP設定
│   │   ├── manifest.json     # PWA設定
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/       # Reactコンポーネント
│   │   │   ├── AISearchSection.tsx      # AI検索UI
│   │   │   ├── EnhancedTrackCard.tsx    # 高機能トラックカード
│   │   │   ├── EnhancedTrackList.tsx    # トラック一覧表示
│   │   │   ├── TrackModal.tsx           # 詳細モーダル
│   │   │   ├── TrackFilter.tsx          # フィルタリング機能
│   │   │   ├── Pagination.tsx           # ページネーション
│   │   │   ├── PresetSection.tsx        # プリセットボタン
│   │   │   ├── ErrorBoundary.tsx        # エラー境界
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AppContext.tsx           # 状態管理
│   │   ├── services/
│   │   │   └── api.ts                   # API通信
│   │   ├── index.css                    # スタイルシート
│   │   └── App.tsx                      # メインアプリ
│   └── package.json
├── server/                    # Node.js バックエンド
│   ├── src/
│   │   ├── routes/
│   │   │   ├── preset.ts     # プリセットAPI
│   │   │   ├── ai.ts         # AI検索API
│   │   │   ├── auth.ts       # 認証API
│   │   │   └── test.ts       # テストAPI
│   │   ├── services/
│   │   │   ├── spotifyAuth.ts    # Spotify API認証
│   │   │   └── claudeService.ts  # Claude AI統合
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts  # エラーハンドリング
│   │   │   └── rateLimiter.ts   # レート制限
│   │   └── index.ts              # サーバーエントリーポイント
│   ├── .env                      # 環境変数
│   └── package.json
├── Spec.md                       # プロジェクト仕様書
├── Development-direction.md      # 開発計画（7フェーズ）
└── PHASE4_COMPLETE.md           # Phase 4完了報告書
```

## 🔧 セットアップ手順

### 1. 環境要件
- Node.js 16+
- npm or yarn
- Spotify Developer Account
- Claude AI API キー（オプション）

### 2. Spotify API設定
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)でアプリを作成
2. Client IDとClient Secretを取得
3. `server/.env`に設定

### 3. インストール・起動

#### バックエンド
```bash
cd server
npm install
npm run build
npm start
# サーバー: http://localhost:5001
```

#### フロントエンド
```bash
cd client
npm install
npm start
# クライアント: http://localhost:3000
```

### 4. 環境変数設定

#### `server/.env`
```env
# Spotify API認証情報
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Claude AI API（オプション）
CLAUDE_API_KEY=your_claude_api_key

# サーバー設定
PORT=5001
CLIENT_URL=http://localhost:3000
```

## 🚦 開発フェーズ

### Phase 1: Spotify API基盤 ✅
- Spotify認証・API統合
- 基本的なエンドポイント実装
- エラーハンドリング設定

### Phase 2: フロントエンドUI ✅
- Reactアプリケーション構築
- Context API状態管理
- レスポンシブデザイン実装

### Phase 3: プリセットボタン（前半） ✅
- 5つのプリセット機能実装
- トラック表示コンポーネント
- 基本的なインタラクション

### Phase 4: 結果表示の高度化 ✅
- 拡張トラックカード
- プレビュー再生機能
- 詳細モーダル表示
- 高度なフィルタリング
- ページネーション機能

### Phase 5: プリセットボタン（後半） ✅
- 残り5つのプリセット機能
- エラーハンドリング強化
- UI/UX改善

### Phase 6: AI検索機能 ✅
- Claude AI統合
- 自然言語クエリ解釈
- AI検索UI実装
- フォールバック機能

### Phase 7: 最適化・デプロイ準備 ✅
- パフォーマンス最適化
- SEO・OGP設定
- PWA対応
- エラーバウンダリ実装
- 本番環境設定

## 📊 パフォーマンス最適化

### React最適化
- **React.memo** - コンポーネント再レンダリング防止
- **useCallback** - ハンドラー関数メモ化
- **useMemo** - 計算結果キャッシュ
- **コードスプリッティング** - 必要に応じた読み込み

### 画像・リソース最適化
- **遅延読み込み** - 画像の段階的表示
- **スケルトンローダー** - 読み込み中の視覚的フィードバック
- **アセット圧縮** - 本番ビルド時最適化

## ♿ アクセシビリティ対応

### WCAG 2.1 AA準拠
- **キーボードナビゲーション** - Tab/Enter/Escapeサポート
- **スクリーンリーダー対応** - 適切なARIAラベル
- **高コントラストモード** - 色覚多様性対応
- **モーション軽減** - prefers-reduced-motion対応
- **フォーカス管理** - 明確な視覚的フィードバック

## 🔐 セキュリティ対策

### API セキュリティ
- **CORS設定** - 適切なオリジン制限
- **レート制限** - API乱用防止
- **環境変数管理** - 機密情報保護
- **エラーハンドリング** - 情報漏洩防止

### フロントエンドセキュリティ
- **XSS対策** - React標準のサニタイゼーション
- **HTTPS強制** - 本番環境セキュア通信
- **Content Security Policy** - スクリプト実行制限

## 🧪 テスト戦略

### 自動テスト
```bash
# フロントエンドテスト
cd client
npm run test:coverage

# バックエンドヘルスチェック
cd server
npm run health
```

### 手動テスト項目
- [ ] AI検索機能の精度
- [ ] プリセットボタンの動作
- [ ] プレビュー再生機能
- [ ] モーダル表示・操作
- [ ] フィルタリング・ソート
- [ ] ページネーション
- [ ] レスポンシブデザイン
- [ ] アクセシビリティ対応

## 🚀 デプロイ準備

### 本番ビルド
```bash
# フロントエンド本番ビルド
cd client
npm run build:prod

# バックエンド本番ビルド
cd server
npm run build:prod
npm run start:prod
```

### デプロイ推奨環境
- **フロントエンド**: Vercel, Netlify, GitHub Pages
- **バックエンド**: Railway, Render, Heroku, AWS EC2
- **データベース**: 現在未使用（将来拡張可能）

## 📈 将来の拡張計画

### 短期的改善
- [ ] ユーザー認証機能
- [ ] プレイリスト作成・保存
- [ ] 楽曲お気に入り機能
- [ ] 検索履歴永続化
- [ ] オフライン対応

### 長期的拡張
- [ ] 機械学習推薦システム
- [ ] ソーシャル機能（共有・レビュー）
- [ ] 他音楽サービス統合
- [ ] モバイルアプリ開発
- [ ] 音楽分析・可視化機能

## 🐛 既知の問題・制限事項

### API制限
- **Spotify API**: 1時間あたり1,000リクエスト制限
- **Claude AI**: APIキー未設定時はフォールバックモード
- **プレビュー再生**: Spotify提供の30秒クリップのみ

### ブラウザ互換性
- **Chrome**: 完全対応
- **Firefox**: 完全対応  
- **Safari**: 完全対応
- **Edge**: 完全対応
- **IE11**: 基本機能のみ

## 👥 開発チーム・貢献

このプロジェクトは**Claude Code**を使用して開発されました。

### 貢献方法
1. Issueの報告・提案
2. Pull Request送信
3. ドキュメント改善
4. テスト・フィードバック

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート・連絡先

- **GitHub**: [プロジェクトリポジトリ]
- **Email**: [連絡先メールアドレス]
- **Discord**: [開発者コミュニティ]

---

**🎵 Spotify AI Music Explorer で新しい音楽発見体験を始めましょう！**
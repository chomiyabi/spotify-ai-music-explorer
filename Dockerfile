# マルチステージビルド: フロントエンドビルド
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# フロントエンドの依存関係をインストール
COPY client/package*.json ./
RUN npm ci --only=production

# フロントエンドのソースコードをコピーしてビルド
COPY client/ ./
RUN npm run build:prod

# マルチステージビルド: バックエンドビルド
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# バックエンドの依存関係をインストール
COPY server/package*.json ./
RUN npm ci --only=production

# バックエンドのソースコードをコピーしてビルド
COPY server/ ./
RUN npm run build:prod

# 本番環境イメージ
FROM node:18-alpine AS production

# 本番環境に必要なパッケージをインストール
RUN apk add --no-cache curl

WORKDIR /app

# バックエンドの本番用依存関係のみコピー
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ビルド済みのバックエンドをコピー
COPY --from=backend-builder /app/server/dist ./dist

# フロントエンドのビルド結果を静的ファイルとしてコピー
COPY --from=frontend-builder /app/client/build ./public

# 非rootユーザーを作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

# ポートを公開
EXPOSE 5001

# ヘルスチェックを追加
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# アプリケーションを起動
CMD ["npm", "run", "start:prod"]
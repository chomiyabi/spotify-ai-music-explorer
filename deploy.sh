#!/bin/bash

# Spotify AI Music Explorer - 本番デプロイスクリプト

set -e

echo "🚀 Spotify AI Music Explorer - 本番環境デプロイ開始"

# 色付きログ関数
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# 環境変数チェック
check_env() {
    log_info "環境変数チェック中..."
    
    if [[ -z "$SPOTIFY_CLIENT_ID" ]]; then
        log_error "SPOTIFY_CLIENT_ID が設定されていません"
        exit 1
    fi
    
    if [[ -z "$SPOTIFY_CLIENT_SECRET" ]]; then
        log_error "SPOTIFY_CLIENT_SECRET が設定されていません"  
        exit 1
    fi
    
    if [[ -z "$DIFY_API_KEY" ]]; then
        log_warning "DIFY_API_KEY が設定されていません（デモモードで動作）"
    fi
    
    log_success "環境変数チェック完了"
}

# 依存関係インストール
install_deps() {
    log_info "依存関係インストール中..."
    
    # サーバー依存関係
    cd server
    npm ci --only=production
    cd ..
    
    # クライアント依存関係  
    cd client
    npm ci --only=production
    cd ..
    
    log_success "依存関係インストール完了"
}

# ビルド実行
build_app() {
    log_info "アプリケーションビルド中..."
    
    # サーバービルド
    cd server
    npm run build:prod
    cd ..
    
    # クライアントビルド
    cd client
    npm run build:prod
    cd ..
    
    log_success "ビルド完了"
}

# ヘルスチェック
health_check() {
    log_info "本番ビルドヘルスチェック中..."
    
    # ビルドファイル存在チェック
    if [[ ! -d "server/dist" ]]; then
        log_error "サーバービルドファイルが見つかりません"
        exit 1
    fi
    
    if [[ ! -d "client/build" ]]; then
        log_error "クライアントビルドファイルが見つかりません"
        exit 1
    fi
    
    # ビルドサイズチェック
    server_size=$(du -sh server/dist | cut -f1)
    client_size=$(du -sh client/build | cut -f1)
    
    log_info "サーバービルドサイズ: $server_size"
    log_info "クライアントビルドサイズ: $client_size"
    
    log_success "ヘルスチェック完了"
}

# Docker環境での起動
docker_deploy() {
    log_info "Dockerコンテナ起動中..."
    
    # 既存コンテナ停止
    docker-compose down 2>/dev/null || true
    
    # 新しいコンテナ起動
    docker-compose up --build -d
    
    # コンテナ状態確認
    sleep 5
    if docker-compose ps | grep -q "Up"; then
        log_success "Dockerコンテナ起動完了"
        log_info "アプリケーション: http://localhost:3000"
        log_info "API: http://localhost:5001"
    else
        log_error "Dockerコンテナ起動失敗"
        docker-compose logs
        exit 1
    fi
}

# ローカル環境での起動
local_deploy() {
    log_info "ローカル本番環境起動中..."
    
    # バックグラウンドでサーバー起動
    cd server
    NODE_ENV=production nohup npm run start:prod > ../server.log 2>&1 &
    SERVER_PID=$!
    cd ..
    
    # クライアント静的ファイル配信
    cd client  
    nohup npx serve -s build -p 3000 > ../client.log 2>&1 &
    CLIENT_PID=$!
    cd ..
    
    echo $SERVER_PID > server.pid
    echo $CLIENT_PID > client.pid
    
    sleep 3
    
    # ヘルスチェック
    if curl -f http://localhost:5001/api/health >/dev/null 2>&1; then
        log_success "ローカル本番環境起動完了"
        log_info "アプリケーション: http://localhost:3000"
        log_info "API: http://localhost:5001"
        log_info "停止するには: ./deploy.sh stop"
    else
        log_error "サーバー起動失敗"
        cat server.log
        exit 1
    fi
}

# サービス停止
stop_services() {
    log_info "サービス停止中..."
    
    # Docker環境
    if [[ -f "docker-compose.yml" ]] && docker-compose ps >/dev/null 2>&1; then
        docker-compose down
        log_success "Dockerサービス停止完了"
    fi
    
    # ローカル環境
    if [[ -f "server.pid" ]]; then
        kill $(cat server.pid) 2>/dev/null || true
        rm server.pid
    fi
    
    if [[ -f "client.pid" ]]; then
        kill $(cat client.pid) 2>/dev/null || true  
        rm client.pid
    fi
    
    log_success "ローカルサービス停止完了"
}

# メイン処理
main() {
    case "${1:-deploy}" in
        "deploy"|"start")
            check_env
            install_deps
            build_app
            health_check
            
            if command -v docker-compose >/dev/null 2>&1; then
                docker_deploy
            else
                local_deploy
            fi
            ;;
        
        "stop")
            stop_services
            ;;
        
        "build")
            install_deps
            build_app
            health_check
            ;;
        
        "health")
            health_check
            ;;
        
        *)
            echo "使用法: $0 {deploy|start|stop|build|health}"
            echo ""
            echo "  deploy/start : アプリケーションをビルドして起動"
            echo "  stop         : サービス停止"  
            echo "  build        : ビルドのみ実行"
            echo "  health       : ヘルスチェック"
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"
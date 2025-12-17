#!/bin/bash

# Скрипт для развертывания фронтенда на Timeweb Cloud
# Выполните на сервере: bash <(cat << 'SCRIPT'
# ...вставьте содержимое скрипта...
# SCRIPT

set -e

echo "🚀 Начало развертывания фронтенда на Timeweb Cloud..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

FRONTEND_DIR="/var/www/sendbuddy-frontend"
REPO_URL="https://github.com/ahmed11551/parcel-pal-08.git"
DOMAIN="sendbuddy.ru"
BACKEND_PORT="3001"

echo -e "${BLUE}📋 Проверка окружения...${NC}"

echo -e "${YELLOW}📦 Установка Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    echo "Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js установлен: $(node --version)${NC}"
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js уже установлен: $NODE_VERSION${NC}"
fi

echo -e "${YELLOW}📁 Создание директории...${NC}"
mkdir -p $FRONTEND_DIR
cd $FRONTEND_DIR

echo -e "${YELLOW}📥 Клонирование/обновление репозитория...${NC}"
if [ -d ".git" ]; then
    echo "Репозиторий уже существует, обновляем..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "Клонирование репозитория..."
    git clone $REPO_URL .
fi

echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
npm install --production=false

echo -e "${YELLOW}🔨 Сборка проекта...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Ошибка: директория dist не создана${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Проект успешно собран${NC}"

echo -e "${YELLOW}🌐 Настройка Nginx...${NC}"

NGINX_CONFIG="/etc/nginx/sites-available/sendbuddy-frontend"
cat > $NGINX_CONFIG << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root $FRONTEND_DIR/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
EOF

if [ ! -L /etc/nginx/sites-enabled/sendbuddy-frontend ]; then
    ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/
    echo -e "${GREEN}✅ Конфигурация Nginx активирована${NC}"
else
    echo -e "${GREEN}✅ Конфигурация Nginx уже активирована${NC}"
fi

echo -e "${YELLOW}🔍 Проверка конфигурации Nginx...${NC}"
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✅ Конфигурация Nginx корректна${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx перезагружен${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx${NC}"
    nginx -t
    exit 1
fi

echo -e "${YELLOW}🔒 Проверка SSL сертификата...${NC}"
if ! command -v certbot &> /dev/null; then
    echo "Установка certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo -e "${YELLOW}📜 Получение SSL сертификата...${NC}"
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email "admin@$DOMAIN" || {
        echo -e "${YELLOW}⚠️  Не удалось получить сертификат автоматически${NC}"
        echo "Вы можете получить его вручную позже: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
else
    echo -e "${GREEN}✅ SSL сертификат уже установлен${NC}"
    certbot renew --dry-run
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Развертывание завершено успешно!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🌐 Сайт доступен по адресу:${NC}"
echo -e "   https://$DOMAIN"
echo -e "   https://www.$DOMAIN"
echo ""


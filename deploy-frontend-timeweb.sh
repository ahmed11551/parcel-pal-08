#!/bin/bash

# Скрипт для развертывания фронтенда на Timeweb Cloud
# Использование: ./deploy-frontend-timeweb.sh

set -e

echo "🚀 Начало развертывания фронтенда на Timeweb Cloud..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка, что мы на сервере
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}❌ Этот скрипт должен выполняться на сервере Timeweb Cloud${NC}"
    echo "Подключитесь к серверу: ssh root@89.169.1.238"
    exit 1
fi

# Переменные
FRONTEND_DIR="/var/www/sendbuddy-frontend"
REPO_URL="https://github.com/ahmed11551/parcel-pal-08.git"
DOMAIN="sendbuddy.ru"

echo -e "${YELLOW}📦 Установка Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js уже установлен: $(node --version)"
fi

echo -e "${YELLOW}📁 Создание директории...${NC}"
mkdir -p $FRONTEND_DIR
cd $FRONTEND_DIR

echo -e "${YELLOW}📥 Клонирование репозитория...${NC}"
if [ -d ".git" ]; then
    echo "Репозиторий уже существует, обновляем..."
    git pull origin main
else
    git clone $REPO_URL .
fi

echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
npm install

echo -e "${YELLOW}🔨 Сборка проекта...${NC}"
npm run build

echo -e "${YELLOW}🌐 Настройка Nginx...${NC}"

# Создание конфигурации Nginx
NGINX_CONFIG="/etc/nginx/sites-available/sendbuddy-frontend"
cat > $NGINX_CONFIG << 'EOF'
server {
    listen 80;
    server_name sendbuddy.ru www.sendbuddy.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sendbuddy.ru www.sendbuddy.ru;

    ssl_certificate /etc/letsencrypt/live/sendbuddy.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sendbuddy.ru/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/sendbuddy-frontend/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Активация конфигурации
if [ ! -L /etc/nginx/sites-enabled/sendbuddy-frontend ]; then
    ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/
fi

# Проверка конфигурации Nginx
if nginx -t; then
    echo -e "${GREEN}✅ Конфигурация Nginx корректна${NC}"
    systemctl reload nginx
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx${NC}"
    exit 1
fi

echo -e "${YELLOW}🔒 Установка SSL сертификата...${NC}"
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Проверка наличия сертификата
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo "Получение SSL сертификата..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
else
    echo "SSL сертификат уже установлен"
fi

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo -e "${GREEN}🌐 Сайт доступен по адресу: https://$DOMAIN${NC}"


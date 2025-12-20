#!/bin/bash

# Скрипт настройки домена send-buddy.ru
# Использование: ./setup-domain.sh

set -e

DOMAIN="send-buddy.ru"
SERVER_IP="194.67.124.90"  # Плавающий IP

echo "🌐 Настройка домена $DOMAIN..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Проверка DNS
echo "🔍 Проверка DNS записей..."
DNS_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  DNS запись не указывает на правильный IP${NC}"
    echo "   Ожидается: $SERVER_IP"
    echo "   Получено: $DNS_IP"
    echo "   Подождите 5-30 минут для распространения DNS"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS запись настроена правильно${NC}"
fi

# Установка Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Установка Nginx..."
    apt update
    apt install nginx -y
else
    echo -e "${GREEN}✅ Nginx уже установлен${NC}"
fi

# Создание временной конфигурации Nginx (только HTTP для certbot)
echo "📝 Создание временной конфигурации Nginx..."
cat > /etc/nginx/sites-available/send-buddy << 'NGINX_CONFIG'
# Временная конфигурация для получения SSL сертификата
server {
    listen 80;
    listen [::]:80;
    server_name send-buddy.ru www.send-buddy.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

# Активация конфигурации
echo "🔗 Активация конфигурации..."
ln -sf /etc/nginx/sites-available/send-buddy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
echo "🔍 Проверка конфигурации Nginx..."
if nginx -t; then
    echo -e "${GREEN}✅ Конфигурация Nginx корректна${NC}"
    systemctl reload nginx
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx${NC}"
    exit 1
fi

# Установка Certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Установка Certbot..."
    apt install certbot python3-certbot-nginx -y
else
    echo -e "${GREEN}✅ Certbot уже установлен${NC}"
fi

# Установка SSL
echo "🔒 Установка SSL сертификата..."
echo "Следуйте инструкциям:"
echo "  1. Введите email"
echo "  2. Согласитесь с условиями"
echo "  3. Выберите редирект на HTTPS (вариант 2)"

certbot --nginx -d send-buddy.ru -d www.send-buddy.ru

# Обновление переменных окружения
echo "📝 Обновление переменных окружения..."
if [ -f .env.production ]; then
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://send-buddy.ru|g' .env.production
    sed -i 's|VITE_API_URL=.*|VITE_API_URL=https://send-buddy.ru/api|g' .env.production
    echo -e "${GREEN}✅ Переменные окружения обновлены${NC}"
else
    echo -e "${YELLOW}⚠️  Файл .env.production не найден${NC}"
    echo "   Создайте его вручную с правильными URL"
fi

# Перезапуск контейнеров
if [ -f docker-compose.yml ]; then
    echo "🔄 Перезапуск контейнеров..."
    docker compose down
    docker compose up -d
    echo -e "${GREEN}✅ Контейнеры перезапущены${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Настройка домена завершена!${NC}"
echo ""
echo "📍 Ваш сайт доступен по адресам:"
echo "   https://send-buddy.ru"
echo "   https://www.send-buddy.ru"
echo ""
echo "🔍 Проверка:"
echo "   curl -I https://send-buddy.ru"
echo "   curl https://send-buddy.ru/api/health"


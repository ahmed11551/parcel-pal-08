#!/bin/bash

# Скрипт для автоматического деплоя на Timeweb Cloud
# Использование: ./deploy-timeweb.sh [backend|frontend]

set -e

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_NC='\033[0m' # No Color

echo -e "${COLOR_GREEN}🚀 Деплой SendBuddy на Timeweb Cloud${COLOR_NC}"
echo ""

# Проверка аргументов
if [ -z "$1" ]; then
    echo -e "${COLOR_YELLOW}Использование: ./deploy-timeweb.sh [backend|frontend]${COLOR_NC}"
    exit 1
fi

DEPLOY_TYPE=$1

if [ "$DEPLOY_TYPE" = "backend" ]; then
    echo -e "${COLOR_GREEN}📦 Деплой Backend...${COLOR_NC}"
    
    cd backend
    
    # Проверка наличия .env
    if [ ! -f .env ]; then
        echo -e "${COLOR_RED}❌ Файл .env не найден!${COLOR_NC}"
        echo "Создайте .env файл на основе .env.example"
        exit 1
    fi
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${COLOR_RED}❌ Docker не установлен!${COLOR_NC}"
        exit 1
    fi
    
    # Сборка образа
    echo "🔨 Сборка Docker образа..."
    docker build -t sendbuddy-backend:latest .
    
    # Остановка старого контейнера
    if [ "$(docker ps -aq -f name=sendbuddy-backend)" ]; then
        echo "🛑 Остановка старого контейнера..."
        docker stop sendbuddy-backend || true
        docker rm sendbuddy-backend || true
    fi
    
    # Запуск нового контейнера
    echo "▶️  Запуск нового контейнера..."
    docker run -d \
        --name sendbuddy-backend \
        --restart unless-stopped \
        -p 3001:3001 \
        --env-file .env \
        sendbuddy-backend:latest
    
    echo -e "${COLOR_GREEN}✅ Backend успешно развернут!${COLOR_NC}"
    echo "Проверьте логи: docker logs -f sendbuddy-backend"
    
elif [ "$DEPLOY_TYPE" = "frontend" ]; then
    echo -e "${COLOR_GREEN}📦 Деплой Frontend...${COLOR_NC}"
    
    # Проверка .env
    if [ ! -f .env.production ]; then
        echo -e "${COLOR_YELLOW}⚠️  Файл .env.production не найден, используем .env${COLOR_NC}"
        if [ ! -f .env ]; then
            echo -e "${COLOR_RED}❌ Файл .env не найден!${COLOR_NC}"
            exit 1
        fi
    fi
    
    # Сборка проекта
    echo "🔨 Сборка проекта..."
    npm install
    npm run build
    
    # Проверка Docker
    if command -v docker &> /dev/null; then
        echo "🐳 Сборка Docker образа..."
        docker build -t sendbuddy-frontend:latest .
        
        # Остановка старого контейнера
        if [ "$(docker ps -aq -f name=sendbuddy-frontend)" ]; then
            echo "🛑 Остановка старого контейнера..."
            docker stop sendbuddy-frontend || true
            docker rm sendbuddy-frontend || true
        fi
        
        # Запуск нового контейнера
        echo "▶️  Запуск нового контейнера..."
        docker run -d \
            --name sendbuddy-frontend \
            --restart unless-stopped \
            -p 80:80 \
            sendbuddy-frontend:latest
        
        echo -e "${COLOR_GREEN}✅ Frontend успешно развернут!${COLOR_NC}"
        echo "Проверьте логи: docker logs -f sendbuddy-frontend"
    else
        echo -e "${COLOR_YELLOW}⚠️  Docker не установлен.${COLOR_NC}"
        echo "Собранные файлы находятся в папке dist/"
        echo "Загрузите их на статический хостинг вручную."
    fi
    
else
    echo -e "${COLOR_RED}❌ Неизвестный тип деплоя: $DEPLOY_TYPE${COLOR_NC}"
    echo "Используйте: backend или frontend"
    exit 1
fi

echo ""
echo -e "${COLOR_GREEN}🎉 Готово!${COLOR_NC}"


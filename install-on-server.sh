#!/bin/bash

# Автоматическая установка SendBuddy на Timeweb Cloud VPS
# Использование: скопируйте этот скрипт на сервер и выполните: bash install-on-server.sh

set -e

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_NC='\033[0m' # No Color

echo -e "${COLOR_GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   🚀 Автоматическая установка SendBuddy на сервер     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${COLOR_NC}"
echo ""

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${COLOR_RED}❌ Пожалуйста, запустите скрипт от root: sudo bash install-on-server.sh${COLOR_NC}"
    exit 1
fi

# Шаг 1: Обновление системы
echo -e "${COLOR_BLUE}📦 Шаг 1: Обновление системы...${COLOR_NC}"
apt update && apt upgrade -y

# Шаг 2: Установка Docker
echo -e "${COLOR_BLUE}🐳 Шаг 2: Установка Docker...${COLOR_NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${COLOR_GREEN}✅ Docker установлен${COLOR_NC}"
else
    echo -e "${COLOR_YELLOW}⚠️  Docker уже установлен${COLOR_NC}"
fi

# Установка Docker Compose
if ! command -v docker compose &> /dev/null; then
    apt install docker-compose-plugin -y
    echo -e "${COLOR_GREEN}✅ Docker Compose установлен${COLOR_NC}"
else
    echo -e "${COLOR_YELLOW}⚠️  Docker Compose уже установлен${COLOR_NC}"
fi

# Шаг 3: Установка Git
echo -e "${COLOR_BLUE}📥 Шаг 3: Установка Git...${COLOR_NC}"
if ! command -v git &> /dev/null; then
    apt install git -y
    echo -e "${COLOR_GREEN}✅ Git установлен${COLOR_NC}"
else
    echo -e "${COLOR_YELLOW}⚠️  Git уже установлен${COLOR_NC}"
fi

# Шаг 4: Клонирование проекта
echo -e "${COLOR_BLUE}📂 Шаг 4: Клонирование проекта...${COLOR_NC}"
if [ -d "parcel-pal-08" ]; then
    echo -e "${COLOR_YELLOW}⚠️  Папка parcel-pal-08 уже существует${COLOR_NC}"
    read -p "Удалить и переклонировать? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf parcel-pal-08
        git clone https://github.com/ahmed11551/parcel-pal-08.git
        echo -e "${COLOR_GREEN}✅ Проект клонирован${COLOR_NC}"
    else
        echo -e "${COLOR_YELLOW}⚠️  Используем существующую папку${COLOR_NC}"
    fi
else
    git clone https://github.com/ahmed11551/parcel-pal-08.git
    echo -e "${COLOR_GREEN}✅ Проект клонирован${COLOR_NC}"
fi

# Шаг 5: Переход в папку backend
cd parcel-pal-08/backend

# Шаг 6: Проверка .env файла
echo -e "${COLOR_BLUE}⚙️  Шаг 5: Проверка конфигурации...${COLOR_NC}"
if [ ! -f .env ]; then
    echo -e "${COLOR_RED}❌ Файл .env не найден!${COLOR_NC}"
    echo -e "${COLOR_YELLOW}📝 Создайте .env файл перед запуском:${COLOR_NC}"
    echo ""
    echo "nano .env"
    echo ""
    echo -e "${COLOR_YELLOW}Или используйте шаблон из DEPLOY_NOW.md${COLOR_NC}"
    exit 1
else
    echo -e "${COLOR_GREEN}✅ Файл .env найден${COLOR_NC}"
fi

# Шаг 7: Сборка Docker образа
echo -e "${COLOR_BLUE}🔨 Шаг 6: Сборка Docker образа...${COLOR_NC}"
docker build -t sendbuddy-backend:latest .

# Шаг 8: Остановка старого контейнера (если есть)
if [ "$(docker ps -aq -f name=sendbuddy-backend)" ]; then
    echo -e "${COLOR_YELLOW}🛑 Остановка старого контейнера...${COLOR_NC}"
    docker stop sendbuddy-backend || true
    docker rm sendbuddy-backend || true
fi

# Шаг 9: Запуск контейнера
echo -e "${COLOR_BLUE}▶️  Шаг 7: Запуск контейнера...${COLOR_NC}"
docker run -d \
    --name sendbuddy-backend \
    --restart unless-stopped \
    -p 3001:3001 \
    --env-file .env \
    sendbuddy-backend:latest

# Шаг 10: Проверка
echo ""
echo -e "${COLOR_GREEN}╔════════════════════════════════════════════════════════╗"
echo "║              ✅ Установка завершена!                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${COLOR_NC}"
echo ""
echo -e "${COLOR_BLUE}📊 Проверка статуса:${COLOR_NC}"
docker ps | grep sendbuddy-backend

echo ""
echo -e "${COLOR_BLUE}📋 Полезные команды:${COLOR_NC}"
echo "  Просмотр логов:    docker logs -f sendbuddy-backend"
echo "  Остановка:        docker stop sendbuddy-backend"
echo "  Запуск:           docker start sendbuddy-backend"
echo "  Перезапуск:       docker restart sendbuddy-backend"
echo "  Удаление:         docker stop sendbuddy-backend && docker rm sendbuddy-backend"
echo ""
echo -e "${COLOR_BLUE}🌐 Проверка API:${COLOR_NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  API Docs:         http://${SERVER_IP}:3001/api/docs"
echo "  Health Check:     curl http://${SERVER_IP}:3001/api"
echo ""
echo -e "${COLOR_GREEN}🎉 Готово! Backend запущен на порту 3001${COLOR_NC}"
echo ""


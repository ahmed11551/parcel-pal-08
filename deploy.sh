#!/bin/bash

# Скрипт деплоя SendBuddy на Reg.ru Cloud
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем деплой SendBuddy..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия .env файла
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Файл .env.production не найден!${NC}"
    echo "Создайте файл .env.production на основе .env.example"
    exit 1
fi

# Загрузка переменных окружения
source .env.production

# Проверка обязательных переменных
if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET не установлен в .env.production${NC}"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  DB_PASSWORD не установлен, будет использован дефолтный${NC}"
fi

echo -e "${GREEN}✅ Переменные окружения загружены${NC}"

# Остановка существующих контейнеров
echo "🛑 Останавливаем существующие контейнеры..."
docker compose down || true

# Сборка образов
echo "🔨 Собираем Docker образы..."
echo "Это может занять несколько минут..."
docker compose build --no-cache

# Запуск контейнеров
echo "🚀 Запускаем контейнеры..."
docker compose up -d

# Ожидание готовности сервисов
echo "⏳ Ожидаем готовности сервисов (30 секунд)..."
sleep 30

# Проверка здоровья сервисов
echo "🏥 Проверяем здоровье сервисов..."

# Проверка базы данных
echo -n "Проверка базы данных... "
if docker compose exec -T postgres pg_isready -U sendbuddy_user -d sendbuddy > /dev/null 2>&1 || docker-compose exec -T postgres pg_isready -U sendbuddy_user -d sendbuddy > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Логи базы данных:"
    docker compose logs --tail=20 postgres
    exit 1
fi

# Проверка backend
echo -n "Проверка backend... "
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌${NC}"
        echo "Логи backend:"
        docker compose logs --tail=20 backend
        exit 1
    fi
    sleep 2
done

# Проверка frontend
echo -n "Проверка frontend... "
for i in {1..5}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    if [ $i -eq 5 ]; then
        echo -e "${YELLOW}⚠️  Frontend может быть еще не готов${NC}"
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 Деплой завершен успешно!${NC}"
echo ""
echo "📍 Сервисы доступны по адресам:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Database: localhost:5432"
echo ""
echo ""
echo "📊 Полезные команды:"
echo "   Просмотр логов:     docker compose logs -f"
echo "   Статус сервисов:    docker compose ps"
echo "   Остановка:          docker compose down"
echo "   Перезапуск:         docker compose restart"
echo ""
echo "📖 Подробная документация: см. DOCKER_COMPOSE_GUIDE.md"


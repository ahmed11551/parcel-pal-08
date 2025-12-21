#!/bin/bash
# Скрипт для обновления на сервере

echo "🔄 Обновление проекта на сервере..."

# 1. Получить изменения
echo "📥 Получение изменений из git..."
git pull origin main

# 2. Миграция БД
echo "🗄️  Выполнение миграции БД..."
docker compose exec -T postgres psql -U sendbuddy -d sendbuddy << SQL
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS received_photo_url VARCHAR(500);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_photo_url VARCHAR(500);
SQL

# 3. Остановить контейнеры
echo "⏹️  Остановка контейнеров..."
docker compose down

# 4. Пересобрать
echo "🔨 Пересборка контейнеров..."
docker compose build --no-cache backend telegram-bot

# 5. Запустить
echo "▶️  Запуск контейнеров..."
docker compose up -d

# 6. Проверить статус
echo "✅ Проверка статуса..."
sleep 5
docker compose ps

echo "🎉 Обновление завершено!"

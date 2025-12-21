#!/bin/bash

echo "🔍 Проверка настройки Telegram бота..."
echo ""

# Проверка .env.production
if [ ! -f .env.production ]; then
    echo "❌ Файл .env.production не найден!"
    exit 1
fi

echo "📄 Содержимое .env.production (токен):"
grep TELEGRAM_BOT_TOKEN .env.production || echo "❌ TELEGRAM_BOT_TOKEN не найден в .env.production"

echo ""
echo "🔍 Проверка переменной окружения:"
export $(grep -v '^#' .env.production | xargs)
echo "TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:0:20}..." # Показываем только первые 20 символов

echo ""
echo "📋 Проверка docker-compose:"
docker compose config | grep -A 5 "telegram-bot:" | grep -E "TELEGRAM_BOT_TOKEN|env_file" || echo "Не найдено"

echo ""
echo "💡 Если токен не читается, выполните:"
echo "   1. Убедитесь, что токен в .env.production без пробелов"
echo "   2. Выполните: docker compose down telegram-bot"
echo "   3. Выполните: docker compose up -d telegram-bot"


#!/bin/bash

# Быстрая настройка Telegram бота

echo "🤖 Настройка Telegram бота SendBuddyExpress_Bot..."
echo ""

# Проверка наличия .env.production
if [ ! -f .env.production ]; then
    echo "❌ Файл .env.production не найден!"
    exit 1
fi

# Проверка наличия токена
if ! grep -q "TELEGRAM_BOT_TOKEN=" .env.production; then
    echo "📝 Добавляю TELEGRAM_BOT_TOKEN в .env.production..."
    echo "" >> .env.production
    echo "# Telegram Bot" >> .env.production
    echo "TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4" >> .env.production
    echo "✅ Токен добавлен!"
else
    echo "✅ TELEGRAM_BOT_TOKEN уже настроен"
fi

echo ""
echo "🚀 Запускаю бота..."
docker compose up -d telegram-bot

echo ""
echo "⏳ Ждем 5 секунд..."
sleep 5

echo ""
echo "📊 Статус бота:"
docker compose ps telegram-bot

echo ""
echo "📋 Последние логи:"
docker compose logs --tail=20 telegram-bot

echo ""
echo "✅ Готово! Проверьте логи выше, чтобы убедиться, что бот запустился."


#!/bin/bash

# Быстрое исправление токена бота

echo "🔧 Исправление TELEGRAM_BOT_TOKEN..."

# Проверка наличия .env.production
if [ ! -f .env.production ]; then
    echo "❌ Файл .env.production не найден!"
    exit 1
fi

# Удаляем старую строку если есть
sed -i '/^TELEGRAM_BOT_TOKEN=/d' .env.production

# Добавляем токен
echo "" >> .env.production
echo "# Telegram Bot" >> .env.production
echo "TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4" >> .env.production

echo "✅ Токен добавлен в .env.production"

# Проверяем
if grep -q "TELEGRAM_BOT_TOKEN=8146754886" .env.production; then
    echo "✅ Токен подтвержден"
    echo ""
    echo "📋 Проверяем формат файла..."
    # Убираем пробелы вокруг =
    sed -i 's/^TELEGRAM_BOT_TOKEN[[:space:]]*=[[:space:]]*/TELEGRAM_BOT_TOKEN=/' .env.production
    sed -i 's/[[:space:]]*$//' .env.production
    
    echo ""
    echo "🔄 Полностью перезапускаю бота..."
    docker compose stop telegram-bot
    docker compose rm -f telegram-bot
    # Загружаем переменные окружения
    export $(grep -v '^#' .env.production | xargs)
    docker compose up -d telegram-bot
    
    echo ""
    echo "⏳ Ждем 3 секунды..."
    sleep 3
    
    echo ""
    echo "📋 Логи бота:"
    docker compose logs --tail=10 telegram-bot
else
    echo "❌ Ошибка: токен не найден после добавления"
    exit 1
fi


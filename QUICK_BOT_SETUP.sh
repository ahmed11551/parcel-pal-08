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
    echo "📝 Обновляю TELEGRAM_BOT_TOKEN в .env.production..."
    # Удаляем старую строку и добавляем новую
    sed -i '/^TELEGRAM_BOT_TOKEN=/d' .env.production
    echo "TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4" >> .env.production
    echo "✅ Токен обновлен!"
fi

# Проверяем, что токен действительно в файле
if grep -q "TELEGRAM_BOT_TOKEN=8146754886" .env.production; then
    echo "✅ Токен подтвержден в .env.production"
else
    echo "❌ Ошибка: токен не найден в .env.production"
    exit 1
fi

echo ""
echo "🔄 Перезапускаю контейнеры для применения изменений..."
docker compose stop telegram-bot 2>/dev/null || true
docker compose rm -f telegram-bot 2>/dev/null || true
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


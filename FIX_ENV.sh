#!/bin/bash

# Скрипт для исправления .env.production

echo "🔧 Исправление .env.production..."

# Проверка наличия файла
if [ ! -f .env.production ]; then
    echo "❌ Файл .env.production не найден!"
    exit 1
fi

# Добавление SMS_PROVIDER если его нет
if ! grep -q "SMS_PROVIDER" .env.production; then
    echo "" >> .env.production
    echo "# SMS Provider (SMS.ru)" >> .env.production
    echo "SMS_PROVIDER=smsru" >> .env.production
    echo "SMSRU_API_ID=72E487A6-DFE3-ED3E-7C90-BD60FC7CBA72" >> .env.production
    echo "✅ Добавлен SMS_PROVIDER"
fi

# Проверка что SMS_PROVIDER не пустой
if grep -q "SMS_PROVIDER=$" .env.production || ! grep -q "SMS_PROVIDER=smsru" .env.production; then
    # Заменяем пустой или неправильный SMS_PROVIDER
    sed -i 's/^SMS_PROVIDER=.*/SMS_PROVIDER=smsru/' .env.production
    echo "✅ Исправлен SMS_PROVIDER"
fi

# Добавление SMSRU_API_ID если его нет
if ! grep -q "SMSRU_API_ID" .env.production; then
    echo "SMSRU_API_ID=72E487A6-DFE3-ED3E-7C90-BD60FC7CBA72" >> .env.production
    echo "✅ Добавлен SMSRU_API_ID"
fi

echo ""
echo "📋 Текущие настройки SMS:"
grep SMS .env.production
echo ""
echo "✅ Готово! Перезапустите backend:"
echo "   docker compose restart backend"


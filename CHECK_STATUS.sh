#!/bin/bash

# Скрипт для проверки статуса SendBuddy на сервере

echo "🔍 Проверка статуса SendBuddy..."
echo ""

# Проверка контейнеров
echo "📦 Статус контейнеров:"
docker compose ps
echo ""

# Проверка health endpoints
echo "🏥 Проверка health endpoints:"
echo -n "Backend: "
curl -s http://localhost:3001/api/health || echo "❌ Недоступен"
echo ""

echo -n "Frontend: "
curl -s http://localhost:3000/health || echo "❌ Недоступен"
echo ""

# Последние логи backend
echo "📋 Последние 20 строк логов backend:"
docker compose logs --tail=20 backend
echo ""

# Проверка переменных окружения
echo "⚙️  Проверка переменных окружения:"
if [ -f .env.production ]; then
    echo "✅ .env.production найден"
    echo "SMS_PROVIDER: $(grep SMS_PROVIDER .env.production | cut -d'=' -f2)"
    echo "FRONTEND_URL: $(grep FRONTEND_URL .env.production | cut -d'=' -f2)"
else
    echo "❌ .env.production не найден!"
fi
echo ""

# Использование ресурсов
echo "💻 Использование ресурсов:"
docker stats --no-stream
echo ""

echo "✅ Проверка завершена!"


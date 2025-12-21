#!/bin/bash

# Скрипт для проверки исправления API URL

echo "🔍 Проверка исправления API URL..."
echo ""

# Проверка что frontend пересобран
echo "📦 Проверка образа frontend:"
docker images | grep parcel-pal-08-frontend
echo ""

# Проверка что контейнер запущен
echo "📋 Статус контейнеров:"
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

# Проверка что nginx проксирует правильно
echo "🔗 Проверка проксирования nginx:"
echo -n "Через nginx (frontend): "
curl -s http://localhost:3000/api/health || echo "❌ Не работает"
echo ""

# Проверка содержимого собранного frontend
echo "📄 Проверка собранного frontend:"
docker compose exec frontend ls -la /usr/share/nginx/html/ | head -5
echo ""

# Проверка времени сборки образа
echo "⏰ Время последней сборки frontend:"
docker inspect sendbuddy-frontend | grep -A 5 "Created"
echo ""

echo "✅ Проверка завершена!"
echo ""
echo "💡 Если видите ошибки 404, попробуйте:"
echo "   1. Очистить кеш браузера (Ctrl+Shift+R)"
echo "   2. Открыть сайт в режиме инкогнито"
echo "   3. Проверить что запросы идут на /api/... (не localhost:3001)"


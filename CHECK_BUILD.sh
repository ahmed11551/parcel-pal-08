#!/bin/bash

# Скрипт для проверки что frontend собран с правильным API URL

echo "🔍 Проверка собранного frontend..."
echo ""

# Проверка что в собранных файлах используется правильный API URL
echo "📄 Поиск API URL в собранных файлах:"
docker compose exec frontend grep -r "localhost:3001" /usr/share/nginx/html/assets/ 2>/dev/null | head -5

if [ $? -eq 0 ]; then
    echo "❌ НАЙДЕН localhost:3001 в собранных файлах!"
    echo "   Frontend нужно пересобрать!"
else
    echo "✅ localhost:3001 НЕ найден - используется правильный URL"
fi

echo ""
echo "📄 Поиск относительного пути /api:"
docker compose exec frontend grep -r '"/api' /usr/share/nginx/html/assets/ 2>/dev/null | head -3

if [ $? -eq 0 ]; then
    echo "✅ Найден относительный путь /api - правильно!"
else
    echo "⚠️  Относительный путь /api не найден"
fi

echo ""
echo "🔗 Проверка проксирования через nginx:"
echo -n "Прямой запрос к backend: "
curl -s http://localhost:3001/api/health | head -c 50
echo ""

echo -n "Через nginx (frontend): "
curl -s http://localhost:3000/api/health | head -c 50
echo ""

echo ""
echo "📋 Проверка что nginx проксирует правильно:"
docker compose exec frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /api"
echo ""

echo "✅ Проверка завершена!"


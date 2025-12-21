#!/bin/bash

# Финальная проверка после пересборки

echo "🔍 Финальная проверка SendBuddy..."
echo ""

# Проверка всех контейнеров
echo "📦 Статус всех контейнеров:"
docker compose ps
echo ""

# Проверка что backend запущен
echo "🔍 Проверка backend:"
if docker compose ps | grep -q "sendbuddy-backend.*healthy"; then
    echo "✅ Backend запущен и healthy"
else
    echo "⚠️  Backend не healthy, проверьте логи:"
    docker compose logs --tail=20 backend
fi
echo ""

# Проверка что в собранных файлах НЕТ localhost:3001
echo "📄 Проверка собранного frontend:"
if docker compose exec frontend grep -r "localhost:3001" /usr/share/nginx/html/assets/ 2>/dev/null | head -1; then
    echo "❌ ВСЕ ЕЩЕ НАЙДЕН localhost:3001!"
    echo "   Нужна полная пересборка с очисткой кеша"
else
    echo "✅ localhost:3001 НЕ найден - правильно!"
fi
echo ""

# Проверка что используется /api
echo "📄 Проверка использования /api:"
if docker compose exec frontend grep -r '"/api' /usr/share/nginx/html/assets/ 2>/dev/null | head -1; then
    echo "✅ Найден относительный путь /api - правильно!"
else
    echo "⚠️  Относительный путь /api не найден"
fi
echo ""

# Проверка проксирования
echo "🔗 Проверка проксирования:"
echo -n "Прямой запрос к backend: "
BACKEND_RESPONSE=$(curl -s http://localhost:3001/api/health)
if echo "$BACKEND_RESPONSE" | grep -q "ok"; then
    echo "✅ Работает"
else
    echo "❌ Не работает: $BACKEND_RESPONSE"
fi

echo -n "Через nginx (frontend): "
FRONTEND_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$FRONTEND_RESPONSE" | grep -q "ok"; then
    echo "✅ Работает"
else
    echo "❌ Не работает: $FRONTEND_RESPONSE"
fi
echo ""

# Проверка переменных окружения backend
echo "⚙️  Переменные окружения backend (SMS):"
docker compose exec backend env | grep SMS || echo "⚠️  SMS переменные не найдены"
echo ""

# Проверка времени сборки frontend
echo "⏰ Время последней сборки frontend:"
docker inspect sendbuddy-frontend 2>/dev/null | grep -A 2 "Created" | head -3
echo ""

echo "✅ Финальная проверка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Откройте https://send-buddy.ru в браузере"
echo "   2. Очистите кеш: Ctrl+Shift+R (или Cmd+Shift+R)"
echo "   3. Откройте консоль браузера (F12)"
echo "   4. Перейдите на вкладку Network"
echo "   5. Попробуйте зарегистрироваться"
echo "   6. Проверьте что запросы идут на /api/auth/register/send-code"
echo "   7. Статус должен быть 200 OK (не 404)"


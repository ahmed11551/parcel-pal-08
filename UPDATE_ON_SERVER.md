# Инструкция по обновлению на сервере до 100%

## 🎯 Цель: Обновить проект до 100% готовности к production

---

## 📋 Шаги на сервере

### 1. Решить проблему с git pull

```bash
cd /root/parcel-pal-08

# Настроить стратегию merge
git config pull.rebase false

# Получить последние изменения
git pull origin main
```

Если возникнут конфликты:
```bash
# Если локальные изменения не важны
git fetch origin
git reset --hard origin/main
```

---

### 2. Проверить переменные окружения

```bash
# Проверить .env.production
cat .env.production | grep -E "SMS_PROVIDER|TELEGRAM_BOT_TOKEN|JWT_SECRET|DATABASE_URL"

# Должно быть:
# SMS_PROVIDER=mock (или реальный провайдер)
# TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4
# JWT_SECRET=... (должен быть установлен)
# DATABASE_URL=... (должен быть установлен)
```

---

### 3. Остановить контейнеры

```bash
docker compose down
```

---

### 4. Пересобрать контейнеры с новыми изменениями

```bash
# Пересобрать все сервисы
docker compose build --no-cache frontend backend telegram-bot

# Это займет несколько минут
```

---

### 5. Запустить контейнеры

```bash
docker compose up -d

# Проверить статус
docker compose ps
```

Все контейнеры должны быть в статусе `healthy` или `running`.

---

### 6. Проверить health check

```bash
# Проверить backend health check
curl http://localhost:3001/api/health | python3 -m json.tool

# Должен вернуть:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "checks": {
#     "database": "ok",
#     "environment": {
#       "jwtSecret": true,
#       "databaseUrl": true,
#       "telegramBotToken": true
#     }
#   }
# }
```

---

### 7. Проверить логи

```bash
# Backend логи
docker compose logs backend --tail=50

# Frontend логи
docker compose logs frontend --tail=30

# Telegram bot логи
docker compose logs telegram-bot --tail=30
```

Должны быть сообщения:
- ✅ `Database connected`
- ✅ `Server running on port 3001`
- ✅ `🤖 Инициализация бота: SendBuddyExpress_Bot`

---

### 8. Проверить работу сайта

```bash
# Проверить что frontend доступен
curl -I https://send-buddy.ru

# Проверить что backend API работает
curl https://send-buddy.ru/api/health | python3 -m json.tool

# Проверить регистрацию (mock режим)
curl -X POST https://send-buddy.ru/api/auth/register/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567", "name": "Test User"}' | python3 -m json.tool
```

---

### 9. Настроить Telegram Menu Button

```
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте /mybots
4. Выберите @SendBuddyExpress_Bot
5. Bot Settings → Menu Button
6. Укажите URL: https://send-buddy.ru
7. Сохраните
```

Или через API:

```bash
curl -X POST "https://api.telegram.org/bot8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "Открыть SendBuddy",
      "web_app": {
        "url": "https://send-buddy.ru"
      }
    }
  }'
```

---

### 10. Финальная проверка

- [ ] Сайт открывается: https://send-buddy.ru
- [ ] Регистрация работает: https://send-buddy.ru/register
- [ ] Кнопки Telegram видны на сайте
- [ ] Health check возвращает `status: "ok"`
- [ ] Бот отвечает на `/start` в Telegram
- [ ] Menu Button в боте работает
- [ ] Нет ошибок в логах

---

## ✅ После обновления

Проект будет готов на **100%** к production!

### Что было улучшено:

1. ✅ Health check с проверкой БД и переменных окружения
2. ✅ Улучшенная обработка ошибок
3. ✅ Полная валидация входных данных
4. ✅ Структурированное логирование
5. ✅ Security headers
6. ✅ CORS для Telegram
7. ✅ Все критичные функции работают

---

## 🚨 Если что-то не работает

### Проблема: Health check возвращает ошибку

```bash
# Проверить логи
docker compose logs backend --tail=100

# Проверить подключение к БД
docker compose exec backend psql $DATABASE_URL -c "SELECT 1"

# Проверить переменные окружения
docker compose exec backend env | grep -E "JWT_SECRET|DATABASE_URL|TELEGRAM_BOT_TOKEN"
```

### Проблема: Frontend не открывается

```bash
# Проверить логи nginx
docker compose logs frontend --tail=50

# Проверить что контейнер запущен
docker compose ps frontend

# Перезапустить frontend
docker compose restart frontend
```

### Проблема: Telegram бот не отвечает

```bash
# Проверить логи бота
docker compose logs telegram-bot --tail=50

# Проверить что токен установлен
docker compose exec telegram-bot env | grep TELEGRAM_BOT_TOKEN

# Перезапустить бота
docker compose restart telegram-bot
```

---

## 📊 Итоговый статус

После выполнения всех шагов:

- ✅ **Техническая готовность: 100%**
- ✅ **Код обновлен**
- ✅ **Все сервисы работают**
- ✅ **Готово к production**

**Проект готов к запуску!** 🚀

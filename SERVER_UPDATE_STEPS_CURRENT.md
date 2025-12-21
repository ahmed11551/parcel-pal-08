# Обновление на сервере - пошаговые команды

## Выполните эти команды по порядку:

```bash
# 1. Перейдите в директорию проекта
cd /root/parcel-pal-08

# 2. Проверьте текущий статус
git status

# 3. Получите последние изменения
git pull origin main

# 4. Обновите БД - добавьте новые поля для фото
docker compose exec postgres psql -U sendbuddy -d sendbuddy -c "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS received_photo_url VARCHAR(500); ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_photo_url VARCHAR(500);"

# 5. Остановите контейнеры
docker compose down

# 6. Пересоберите backend и telegram-bot (это может занять несколько минут)
docker compose build --no-cache backend telegram-bot

# 7. Запустите контейнеры
docker compose up -d

# 8. Подождите несколько секунд и проверьте статус
sleep 10
docker compose ps

# 9. Проверьте логи backend
docker compose logs backend --tail=30

# 10. Проверьте health check
curl http://localhost:3001/api/health
```

---

## ⚠️ Примечание о telegramBotToken

Если видите `telegramBotToken: false` в health check - это не критично, но убедитесь что токен установлен в `.env.production`:

```bash
# Проверьте что токен есть в .env.production
cat .env.production | grep TELEGRAM_BOT_TOKEN

# Если его нет, добавьте:
echo "TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4" >> .env.production
```

После добавления токена перезапустите telegram-bot:
```bash
docker compose restart telegram-bot
```

---

## Если возникнут проблемы:

### Ошибка при git pull:
```bash
# Если есть конфликты
git stash
git pull origin main
```

### Ошибка при сборке:
```bash
# Посмотрите детальные логи
docker compose build backend 2>&1 | tail -50
```

### Ошибка при миграции БД:
```bash
# Проверьте что контейнер БД запущен
docker compose ps postgres

# Попробуйте подключиться вручную
docker compose exec postgres psql -U sendbuddy -d sendbuddy
# Затем выполните:
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS received_photo_url VARCHAR(500);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_photo_url VARCHAR(500);
\q
```


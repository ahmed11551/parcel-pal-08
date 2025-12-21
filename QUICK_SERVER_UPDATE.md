# 🚀 Быстрое обновление на сервере

## Команды для выполнения на сервере:

```bash
# 1. Подключитесь к серверу
ssh root@194.67.124.90

# 2. Перейдите в проект
cd /root/parcel-pal-08

# 3. Получите изменения
git pull origin main

# 4. Обновите БД (добавьте новые поля)
docker compose exec postgres psql -U sendbuddy -d sendbuddy -c "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS received_photo_url VARCHAR(500); ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_photo_url VARCHAR(500);"

# 5. Пересоберите и перезапустите
docker compose down
docker compose build --no-cache backend telegram-bot
docker compose up -d

# 6. Проверьте статус
docker compose ps
docker compose logs backend --tail=20
```

---

## ✅ Что обновится:

1. **Новые поля в БД:**
   - `tasks.received_photo_url`
   - `tasks.delivered_photo_url`
   - Таблица `reports` (создастся автоматически)

2. **Новые endpoints:**
   - `POST /api/tasks/:id/confirmation-photo`
   - `POST /api/reports`
   - `GET /api/reports/my`
   - Обновленный `GET /api/tasks` (с фильтрами по цене и сортировкой)

3. **Новые функции:**
   - Фото-подтверждения
   - Система жалоб
   - Расширенные фильтры

---

## ⚠️ ВАЖНО:

После обновления проверьте:
- ✅ Backend запущен (`docker compose ps`)
- ✅ Health check работает (`curl http://localhost:3001/api/health`)
- ✅ Telegram бот работает (проверьте логи)


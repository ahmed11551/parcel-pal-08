# 📋 Инструкции по обновлению на сервере

## ⚠️ ВАЖНО: Новые поля в БД

После обновления нужно выполнить миграцию БД для добавления новых полей:
- `received_photo_url` и `delivered_photo_url` в таблице `tasks`
- Таблица `reports` (новая)

## 🔄 Шаги обновления:

### 1. Подключитесь к серверу
```bash
ssh root@194.67.124.90
```

### 2. Перейдите в директорию проекта
```bash
cd /root/parcel-pal-08
```

### 3. Получите последние изменения
```bash
git pull origin main
```

### 4. Обновите БД (добавьте новые поля)
```bash
# Подключитесь к БД
docker compose exec postgres psql -U sendbuddy -d sendbuddy

# Выполните миграцию:
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS received_photo_url VARCHAR(500);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_photo_url VARCHAR(500);

# Выход из psql
\q
```

### 5. Остановите контейнеры
```bash
docker compose down
```

### 6. Пересоберите контейнеры (особенно backend)
```bash
docker compose build --no-cache backend telegram-bot
```

### 7. Запустите контейнеры
```bash
docker compose up -d
```

### 8. Проверьте логи
```bash
docker compose logs -f backend telegram-bot
```

### 9. Проверьте статус
```bash
docker compose ps
```

---

## ✅ Проверка работоспособности:

1. **Health check:**
```bash
curl http://localhost:3001/api/health
```

2. **Проверьте что новые endpoints работают:**
```bash
# Проверка загрузки файлов (нужен токен)
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@test.jpg"
```

---

## 🔧 Если что-то пошло не так:

### Проблема: Ошибки при сборке backend
```bash
# Очистите кеш и пересоберите
docker compose build --no-cache --pull backend
```

### Проблема: Ошибки БД
```bash
# Проверьте что миграция выполнена
docker compose exec postgres psql -U sendbuddy -d sendbuddy -c "\d tasks"
```

### Проблема: Контейнеры не запускаются
```bash
# Посмотрите логи
docker compose logs backend
docker compose logs telegram-bot

# Перезапустите
docker compose restart backend telegram-bot
```

---

## 📝 Быстрая команда (все в одном):

```bash
cd /root/parcel-pal-08 && \
git pull origin main && \
docker compose exec postgres psql -U sendbuddy -d sendbuddy -c "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS received_photo_url VARCHAR(500); ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_photo_url VARCHAR(500);" && \
docker compose down && \
docker compose build --no-cache backend telegram-bot && \
docker compose up -d && \
docker compose ps
```

---

## ⚠️ ВАЖНО:

1. **Резервная копия БД** (рекомендуется перед обновлением):
```bash
docker compose exec postgres pg_dump -U sendbuddy sendbuddy > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Проверьте переменные окружения** в `.env.production`:
   - `TELEGRAM_BOT_TOKEN`
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `SMS_PROVIDER`

3. **После обновления** проверьте что:
   - Backend запущен и здоров
   - Telegram бот работает
   - Новые endpoints доступны


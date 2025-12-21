# Исправление: Backend не обновился

## Проблема:
Health check возвращает старую версию (без `checks`), значит backend контейнер не обновился.

## Решение:

### Шаг 1: Пересобрать и перезапустить только backend

```bash
# На сервере
cd /root/parcel-pal-08

# Остановить backend
docker compose stop backend

# Удалить старый контейнер
docker compose rm -f backend

# Пересобрать backend
docker compose build --no-cache backend

# Запустить backend
docker compose up -d backend

# Подождать 10 секунд для запуска
sleep 10

# Проверить health check (должен вернуть новую версию)
curl http://localhost:3001/api/health | python3 -m json.tool
```

### Шаг 2: Проверить что новый код в контейнере

```bash
# Проверить версию health check endpoint
docker compose exec backend cat /app/src/index.ts | grep -A 20 "app.get('/api/health'"

# Должна быть строка с async и проверкой БД
```

### Шаг 3: Если не помогло - полная пересборка

```bash
# Остановить все
docker compose down

# Удалить все образы
docker compose rm -f

# Пересобрать все заново
docker compose build --no-cache

# Запустить
docker compose up -d

# Проверить
curl http://localhost:3001/api/health | python3 -m json.tool
```

### Ожидаемый результат:

```json
{
  "status": "ok",
  "timestamp": "...",
  "checks": {
    "database": "ok",
    "environment": {
      "jwtSecret": true,
      "databaseUrl": true,
      "telegramBotToken": true
    }
  }
}
```


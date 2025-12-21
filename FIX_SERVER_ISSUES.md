# Исправление проблем на сервере

## Проблемы:
1. Git конфликты (unmerged files)
2. YAML ошибка в docker-compose.yml на строке 51
3. Health check возвращает старую версию

## Решение:

### Шаг 1: Решить git конфликты

```bash
# На сервере
cd /root/parcel-pal-08

# Отменить все локальные изменения и взять версию из GitHub
git fetch origin
git reset --hard origin/main

# Проверить статус
git status
```

### Шаг 2: Проверить docker-compose.yml

```bash
# Проверить синтаксис YAML
cat docker-compose.yml | head -55 | tail -10

# Если есть ошибка, нужно исправить
```

### Шаг 3: Пересобрать контейнеры

```bash
# Остановить
docker compose down

# Пересобрать
docker compose build --no-cache frontend backend telegram-bot

# Запустить
docker compose up -d

# Проверить
docker compose ps
```

### Шаг 4: Проверить health check

```bash
curl http://localhost:3001/api/health | python3 -m json.tool
```

Должен вернуть новую версию с checks:
```json
{
  "status": "ok",
  "timestamp": "...",
  "checks": {
    "database": "ok",
    "environment": {...}
  }
}
```


# Команды для выполнения на сервере

## Вы уже подключены к серверу! ✅

Теперь выполните следующие команды по порядку:

---

## Шаг 1: Перейти в директорию проекта

```bash
cd /root/parcel-pal-08
```

---

## Шаг 2: Настроить git (если еще не настроено)

```bash
git config pull.rebase false
```

---

## Шаг 3: Получить последние изменения

```bash
git pull origin main
```

Если возникнут конфликты, выполните:
```bash
git fetch origin
git reset --hard origin/main
```

---

## Шаг 4: Остановить контейнеры

```bash
docker compose down
```

---

## Шаг 5: Пересобрать контейнеры

```bash
docker compose build --no-cache frontend backend telegram-bot
```

Это займет несколько минут (5-10 минут).

---

## Шаг 6: Запустить контейнеры

```bash
docker compose up -d
```

---

## Шаг 7: Проверить статус

```bash
docker compose ps
```

Все контейнеры должны быть в статусе `healthy` или `running`.

---

## Шаг 8: Проверить health check

```bash
curl http://localhost:3001/api/health | python3 -m json.tool
```

Должен вернуть:
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

---

## Шаг 9: Проверить логи (опционально)

```bash
# Backend логи
docker compose logs backend --tail=30

# Frontend логи
docker compose logs frontend --tail=20

# Telegram bot логи
docker compose logs telegram-bot --tail=20
```

---

## ✅ Готово!

После выполнения всех шагов приложение будет обновлено и готово к работе!

---

## 🔍 Если что-то не работает

### Проблема: git pull не работает

```bash
# Если есть конфликты
git fetch origin
git reset --hard origin/main
```

### Проблема: Контейнеры не запускаются

```bash
# Проверить логи
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
```

### Проблема: Health check не проходит

```bash
# Проверить переменные окружения
docker compose exec backend env | grep -E "JWT_SECRET|DATABASE_URL|TELEGRAM_BOT_TOKEN"
```


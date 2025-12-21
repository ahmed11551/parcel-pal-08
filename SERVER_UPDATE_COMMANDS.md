# Команды для обновления на сервере

## 1. Решить проблему с git pull

```bash
# На сервере
cd /root/parcel-pal-08

# Настроить стратегию merge (рекомендуется)
git config pull.rebase false

# Сделать pull
git pull origin main
```

Если возникнут конфликты:
```bash
# Посмотреть статус
git status

# Если есть конфликты, разрешить их вручную или принять все изменения из удаленной ветки
git checkout --theirs .
git add .
git commit -m "Merge remote changes"

# Или если локальные изменения не важны, можно сделать force reset:
git fetch origin
git reset --hard origin/main
```

---

## 2. После успешного pull - обновить контейнеры

```bash
cd /root/parcel-pal-08

# Остановить контейнеры
docker compose down

# Пересобрать с новыми изменениями
docker compose build --no-cache frontend backend telegram-bot

# Запустить
docker compose up -d

# Проверить статус
docker compose ps

# Проверить логи
docker compose logs frontend --tail=50
docker compose logs backend --tail=50
docker compose logs telegram-bot --tail=30
```

---

## 3. Проверить переменные окружения

```bash
# Проверить .env.production
cat .env.production | grep -E "SMS_PROVIDER|TELEGRAM_BOT_TOKEN"

# Должно быть:
# SMS_PROVIDER=mock
# TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4

# Если переменных нет, добавьте их:
echo "SMS_PROVIDER=mock" >> .env.production
echo "TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4" >> .env.production
```

---

## 4. Проверить что всё работает

```bash
# Проверить health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000

# Проверить что frontend доступен
curl -I https://send-buddy.ru

# Проверить что backend отвечает
curl https://send-buddy.ru/api/health
```

---

## Важно

⚠️ После обновления `docker-compose.yml` с дефолтным значением для `SMS_PROVIDER`, переменные окружения должны подхватываться правильно даже если они не установлены в `.env.production`.

Но лучше всегда явно указывать их в `.env.production` для ясности.


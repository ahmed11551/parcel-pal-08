# Исправление ошибки сборки backend

## Проблема:
Backend не собирается из-за ошибки TypeScript компиляции.

## Решение:

### Шаг 1: Посмотреть детальные логи сборки

```bash
# На сервере
cd /root/parcel-pal-08

# Попробовать собрать backend и посмотреть ошибки
docker compose build backend 2>&1 | tail -50
```

### Шаг 2: Проверить что код обновлен

```bash
# Проверить что git pull прошел успешно
git status

# Если есть несохраненные изменения
git fetch origin
git reset --hard origin/main
```

### Шаг 3: Проверить TypeScript ошибки локально (если возможно)

```bash
# Проверить синтаксис файлов
cd backend
npm run build 2>&1 | head -30
```

### Шаг 4: Если ошибки в коде - исправить

Скорее всего проблема в:
- `backend/src/index.ts` - health check endpoint
- Или в других файлах с TypeScript ошибками

### Шаг 5: Пересобрать после исправления

```bash
cd /root/parcel-pal-08
docker compose build --no-cache backend
docker compose up -d backend
```


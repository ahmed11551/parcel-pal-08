# Исправление проблемы с API URL (404 ошибки)

## Проблема

Frontend обращается к `http://localhost:3001/api/...` вместо `/api/...`, что вызывает 404 ошибки.

## Причина

Frontend был собран с неправильным `VITE_API_URL`. В production нужно использовать относительный путь `/api`, чтобы nginx мог проксировать запросы к backend.

## Решение

### На сервере выполните:

```bash
# 1. Перейдите в директорию проекта
cd ~/parcel-pal-08

# 2. Получите последние изменения
git pull

# 3. Остановите контейнеры
docker compose down

# 4. Пересоберите frontend с правильным API URL
docker compose build --no-cache frontend

# 5. Запустите контейнеры
docker compose up -d

# 6. Проверьте логи
docker compose logs -f frontend
```

### Или используйте скрипт:

```bash
cd ~/parcel-pal-08
git pull
./UPDATE_SERVER.sh
```

## Проверка

После пересборки:

1. **Откройте сайт**: https://send-buddy.ru
2. **Попробуйте зарегистрироваться**
3. **Проверьте консоль браузера** (F12) - не должно быть ошибок 404
4. **Запросы должны идти на**: `/api/auth/register/send-code` (относительный путь)

## Что изменилось

- ✅ В production frontend всегда использует `/api` (относительный путь)
- ✅ Nginx проксирует `/api` → `backend:3001`
- ✅ В development используется `localhost:3001` или прокси из vite.config.ts

## Если проблема осталась

1. **Очистите кеш браузера**: Ctrl+Shift+R (или Cmd+Shift+R на Mac)
2. **Проверьте что frontend пересобран**:
   ```bash
   docker compose logs frontend | grep "Build"
   ```
3. **Проверьте nginx конфигурацию**:
   ```bash
   docker compose exec frontend cat /etc/nginx/conf.d/default.conf | grep "/api"
   ```


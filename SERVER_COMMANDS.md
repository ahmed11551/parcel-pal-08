# Команды для работы на сервере Reg.ru

## Подключение к серверу

```bash
ssh root@194.67.124.90
# Пароль: n3Ij63UBc4osWD6m
```

## Основные команды

### 1. Переход в директорию проекта

```bash
cd /root/parcel-pal-08
# или
cd ~/parcel-pal-08
```

### 2. Проверка статуса контейнеров

```bash
docker compose ps
```

Должны быть запущены:
- `sendbuddy-backend` (backend)
- `sendbuddy-frontend` (frontend)
- `sendbuddy-db` (postgres)

### 3. Просмотр логов

```bash
# Все логи
docker compose logs

# Логи backend
docker compose logs backend

# Логи frontend
docker compose logs frontend

# Логи базы данных
docker compose logs postgres

# Последние 50 строк логов backend
docker compose logs --tail=50 backend

# Логи в реальном времени
docker compose logs -f backend
```

### 4. Перезапуск сервисов

```bash
# Остановить все
docker compose down

# Запустить все
docker compose up -d

# Перезапустить конкретный сервис
docker compose restart backend
docker compose restart frontend
```

### 5. Пересборка и перезапуск

```bash
# Остановить
docker compose down

# Пересобрать образы
docker compose build --no-cache

# Запустить
docker compose up -d

# Или одной командой
docker compose up -d --build
```

### 6. Проверка работы

```bash
# Проверка health endpoints
curl http://localhost:3001/api/health  # Backend
curl http://localhost:3000/health     # Frontend

# Проверка извне (если настроен домен)
curl https://send-buddy.ru/api/health
```

### 7. Работа с переменными окружения

```bash
# Просмотр .env.production (без показа паролей)
cat .env.production | grep -v PASSWORD | grep -v SECRET

# Редактирование .env.production
nano .env.production

# После изменения перезапустите контейнеры
docker compose restart backend
```

### 8. Обновление кода с GitHub

```bash
cd /root/parcel-pal-08

# Получить последние изменения
git pull

# Пересобрать и перезапустить
docker compose down
docker compose build --no-cache
docker compose up -d

# Проверить логи
docker compose logs -f
```

### 9. Проверка места на диске

```bash
# Общее использование
df -h

# Использование Docker
docker system df

# Очистка неиспользуемых образов
docker system prune -a
```

### 10. Проверка портов

```bash
# Какие порты слушаются
netstat -tulpn | grep LISTEN

# Или
ss -tulpn | grep LISTEN
```

### 11. Проверка Nginx (если используется)

```bash
# Статус
systemctl status nginx

# Перезапуск
systemctl restart nginx

# Проверка конфигурации
nginx -t

# Логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### 12. Работа с базой данных

```bash
# Подключение к PostgreSQL
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy

# В psql можно выполнить:
# \dt - список таблиц
# \q - выход
```

### 13. Просмотр использования ресурсов

```bash
# Использование CPU и памяти
htop
# или
top

# Использование Docker контейнерами
docker stats
```

### 14. Экстренные команды

```bash
# Остановить все контейнеры
docker compose down

# Удалить все контейнеры и volumes (ОСТОРОЖНО!)
docker compose down -v

# Перезагрузить сервер
reboot

# Проверить системные логи
journalctl -xe
```

## Частые проблемы

### Backend не запускается

```bash
# Проверьте логи
docker compose logs backend

# Проверьте переменные окружения
cat .env.production

# Проверьте подключение к БД
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "SELECT 1;"
```

### Frontend показывает 404

```bash
# Проверьте, что backend запущен
docker compose ps backend

# Проверьте health endpoint
curl http://localhost:3001/api/health

# Проверьте логи nginx (если используется)
tail -f /var/log/nginx/error.log
```

### База данных не подключается

```bash
# Проверьте статус postgres
docker compose ps postgres

# Проверьте логи
docker compose logs postgres

# Проверьте пароль в .env.production
cat .env.production | grep DB_PASSWORD
```

## Важно

⚠️ **На production сервере НЕ используйте `npm run dev`!**

- Все запускается через Docker Compose
- Код уже собран в образы
- Используйте `docker compose` команды

## Быстрая проверка работоспособности

```bash
# 1. Проверка контейнеров
docker compose ps

# 2. Проверка health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/health

# 3. Проверка логов
docker compose logs --tail=20 backend
```

Если все работает, вы увидите:
- ✅ Все контейнеры в статусе "Up"
- ✅ Health endpoints возвращают `{"status":"ok"}`
- ✅ В логах нет ошибок


# Решение проблем SendBuddy

## Проблема: 404 ошибка при регистрации/авторизации

### Симптомы:
```
POST http://localhost:3001/api/auth/register/send-code 404 (Not Found)
```

### Решение:

#### 1. Проверьте, запущен ли backend:

**В development режиме:**
```bash
# В одной консоли - запустите backend
cd backend
npm run dev

# В другой консоли - запустите frontend
npm run dev
```

**В production (Docker):**
```bash
# Проверьте статус контейнеров
docker compose ps

# Проверьте логи backend
docker compose logs backend

# Если контейнеры не запущены:
docker compose up -d
```

#### 2. Проверьте, что backend слушает правильный порт:

Backend должен быть доступен на `http://localhost:3001`

Проверьте:
```bash
curl http://localhost:3001/api/health
```

Должен вернуться:
```json
{"status":"ok","timestamp":"..."}
```

#### 3. Проверьте CORS настройки:

В `backend/src/index.ts` должно быть:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
```

#### 4. Проверьте маршруты:

Убедитесь, что в `backend/src/index.ts` есть:
```typescript
app.use('/api/auth', authRoutes);
```

#### 5. Используйте прокси в development:

В `vite.config.ts` уже добавлен прокси:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

После этого frontend должен обращаться к `/api/...` и Vite автоматически проксирует запросы на backend.

#### 6. Перезапустите dev серверы:

```bash
# Остановите все процессы (Ctrl+C)
# Затем запустите заново:

# Backend
cd backend
npm run dev

# Frontend (в другой консоли)
npm run dev
```

## Проблема: SMS не отправляются

### Проверьте:

1. **Переменные окружения:**
   ```bash
   # На сервере проверьте .env.production
   cat .env.production | grep SMS
   ```

2. **Баланс на SMS.ru:**
   - Войдите в личный кабинет SMS.ru
   - Проверьте баланс
   - Пополните при необходимости

3. **Логи backend:**
   ```bash
   docker compose logs backend | grep SMS
   ```

## Проблема: База данных не подключается

### Проверьте:

1. **PostgreSQL запущен:**
   ```bash
   docker compose ps postgres
   ```

2. **Переменные окружения:**
   ```bash
   # Проверьте DATABASE_URL в .env.production
   cat .env.production | grep DATABASE
   ```

3. **Логи базы данных:**
   ```bash
   docker compose logs postgres
   ```

## Проблема: Frontend не собирается

### Проверьте:

1. **Зависимости установлены:**
   ```bash
   npm install
   ```

2. **Ошибки TypeScript:**
   ```bash
   npm run build
   ```

3. **Ошибки линтера:**
   ```bash
   npm run lint
   ```

## Быстрая диагностика

### Проверка всех сервисов:

```bash
# Проверка health endpoints
curl http://localhost:3001/api/health  # Backend
curl http://localhost:3000/health     # Frontend

# Проверка логов
docker compose logs --tail=50 backend
docker compose logs --tail=50 frontend
docker compose logs --tail=50 postgres
```

### Перезапуск всех сервисов:

```bash
docker compose down
docker compose up -d
docker compose logs -f
```

## Контакты поддержки

Если проблема не решена:
1. Проверьте логи: `docker compose logs`
2. Проверьте статус: `docker compose ps`
3. Проверьте переменные окружения: `cat .env.production`

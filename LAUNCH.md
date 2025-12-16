# 🚀 Инструкция по запуску

## Быстрый запуск

### 1. Убедитесь, что Node.js доступен

```bash
# Если используете nvm
source ~/.nvm/nvm.sh
# или
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

# Проверьте
node --version
npm --version
```

### 2. Установите зависимости (если еще не установлены)

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Создайте .env файлы (если еще не созданы)

```bash
./setup.sh
```

Или вручную:

**backend/.env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=sendbuddy
JWT_SECRET=sendbuddy-secret-key-change-in-production-min-32-characters-long
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**.env (в корне):**
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Создайте базу данных

```bash
createdb -U postgres sendbuddy
```

### 5. Запустите проект

**Откройте ДВА терминала:**

**Терминал 1 - Backend:**
```bash
cd backend
npm run start:dev
```

Дождитесь сообщения:
```
Application is running on: http://localhost:3001
```

**Терминал 2 - Frontend:**
```bash
# Убедитесь, что Node.js в PATH
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

npm run dev
```

Дождитесь сообщения:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 6. Откройте в браузере

- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:3001/api/docs

## ⚠️ Важно

1. **Порт изменился**: Frontend теперь на порту **5173** (было 8080)
2. **Node.js**: Если команды не работают, используйте полный путь:
   ```bash
   ~/.nvm/versions/node/v24.11.1/bin/npm install
   ```

## 🔍 Проверка

После запуска проверьте:

1. Backend отвечает:
   ```bash
   curl http://localhost:3001/api/docs
   ```

2. Frontend отвечает:
   ```bash
   curl http://localhost:5173
   ```

3. В браузере откройте:
   - http://localhost:5173 - должен открыться сайт
   - http://localhost:3001/api/docs - должна открыться Swagger документация

## 🐛 Проблемы?

См. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)


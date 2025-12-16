# 🎯 Начните здесь!

## Быстрая настройка (3 шага)

### 1️⃣ Запустите скрипт настройки

```bash
./setup.sh
```

Или вручную создайте файлы:

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

### 2️⃣ Установите зависимости

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3️⃣ Создайте базу данных и запустите

```bash
# Создайте базу данных
createdb -U postgres sendbuddy
# или
psql -U postgres -c "CREATE DATABASE sendbuddy;"

# Запустите backend (в отдельном терминале)
cd backend
npm run start:dev

# Запустите frontend (в другом терминале)
npm run dev
```

## ✅ Проверка

1. Backend: http://localhost:3001/api/docs
2. Frontend: http://localhost:5173

## 📚 Документация

- [QUICK_START.md](./QUICK_START.md) - Подробный быстрый старт
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Полное руководство
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Описание функционала

## 🆘 Проблемы?

См. раздел "Решение проблем" в [SETUP_GUIDE.md](./SETUP_GUIDE.md)


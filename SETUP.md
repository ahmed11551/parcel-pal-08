# Инструкция по настройке SendBuddy

## Требования

- Node.js 18+ и npm
- PostgreSQL 14+
- Git

## Установка

### 1. Клонирование и установка зависимостей

```bash
# Установка зависимостей frontend
npm install

# Установка зависимостей backend
cd backend
npm install
cd ..
```

### 2. Настройка базы данных

1. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE sendbuddy;
```

2. Создайте файл `backend/.env` на основе `backend/env.example`:
```bash
cd backend
cp env.example .env
```

3. Отредактируйте `backend/.env` и укажите ваши настройки:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sendbuddy
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:8080
```

### 3. Настройка frontend

Создайте файл `.env` в корне проекта:
```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Запуск

Откройте два терминала:

**Терминал 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend будет доступен на `http://localhost:3001`

**Терминал 2 - Frontend:**
```bash
npm run dev
```

Frontend будет доступен на `http://localhost:8080`

## Первый запуск

1. Backend автоматически создаст все необходимые таблицы при первом запуске
2. Откройте браузер и перейдите на `http://localhost:8080`
3. Зарегистрируйтесь или войдите (в режиме разработки SMS коды выводятся в консоль backend)

## Структура проекта

```
SendBuddynew/
├── backend/           # Backend API (Node.js/Express/TypeScript)
│   ├── src/
│   │   ├── routes/   # API маршруты
│   │   ├── db/       # База данных и схемы
│   │   ├── middleware/ # Middleware (auth и т.д.)
│   │   └── utils/    # Утилиты
│   └── package.json
├── src/              # Frontend (React/TypeScript)
│   ├── pages/       # Страницы приложения
│   ├── components/  # React компоненты
│   ├── lib/         # Утилиты и API клиент
│   └── ...
└── package.json
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register/send-code` - Отправить SMS код для регистрации
- `POST /api/auth/register/verify` - Подтвердить код и создать пользователя
- `POST /api/auth/login/send-code` - Отправить SMS код для входа
- `POST /api/auth/login/verify` - Подтвердить код и войти
- `GET /api/auth/me` - Получить текущего пользователя

### Задания
- `GET /api/tasks` - Список заданий (фильтры: ?from=XXX&to=YYY)
- `GET /api/tasks/:id` - Получить задание
- `POST /api/tasks` - Создать задание
- `POST /api/tasks/:id/assign` - Назначить курьера
- `PATCH /api/tasks/:id/status` - Изменить статус

### Загрузка файлов
- `POST /api/upload` - Загрузить фото

## Примечания

- В режиме разработки SMS коды выводятся в консоль backend (не отправляются реально)
- Файлы загружаются в папку `backend/uploads/` (создается автоматически)
- Для продакшена необходимо настроить реальный SMS провайдер в `backend/src/utils/sms.ts`

## Troubleshooting

### Ошибка подключения к базе данных
- Проверьте, что PostgreSQL запущен
- Проверьте правильность `DATABASE_URL` в `backend/.env`
- Убедитесь, что база данных `sendbuddy` создана

### CORS ошибки
- Проверьте `FRONTEND_URL` в `backend/.env`
- Убедитесь, что frontend запущен на правильном порту

### Ошибки при загрузке фото
- Убедитесь, что папка `backend/uploads/` существует и доступна для записи


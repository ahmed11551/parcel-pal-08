# SendBuddy Backend API

Backend API для платформы SendBuddy - P2P доставка посылок через путешественников.

## Технологии

- Node.js + Express
- TypeScript
- PostgreSQL
- JWT для аутентификации
- Multer для загрузки файлов

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`:
   - `DATABASE_URL` - строка подключения к PostgreSQL
   - `JWT_SECRET` - секретный ключ для JWT токенов
   - `FRONTEND_URL` - URL фронтенда для CORS

4. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE sendbuddy;
```

5. Запустите миграции (таблицы создадутся автоматически при первом запуске):
```bash
npm run dev
```

## Запуск

### Режим разработки
```bash
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register/send-code` - Отправить SMS код для регистрации
- `POST /api/auth/register/verify` - Подтвердить код и создать пользователя
- `POST /api/auth/login/send-code` - Отправить SMS код для входа
- `POST /api/auth/login/verify` - Подтвердить код и войти
- `GET /api/auth/me` - Получить текущего пользователя (требует токен)

### Задания
- `GET /api/tasks` - Получить список заданий (с фильтрами: ?from=XXX&to=YYY)
- `GET /api/tasks/:id` - Получить задание по ID
- `POST /api/tasks` - Создать задание (требует токен)
- `POST /api/tasks/:id/assign` - Назначить курьера на задание (требует токен)
- `PATCH /api/tasks/:id/status` - Изменить статус задания (требует токен)

### Пользователи
- `GET /api/users/:id` - Получить профиль пользователя
- `GET /api/users/:id/tasks` - Получить задания пользователя (?type=sent|received|all)

### Загрузка файлов
- `POST /api/upload` - Загрузить фото (требует токен, multipart/form-data)

## Структура базы данных

- `users` - Пользователи
- `tasks` - Задания
- `messages` - Сообщения между пользователями
- `payments` - Платежи (эскроу)
- `ratings` - Рейтинги пользователей
- `sms_codes` - SMS коды для верификации

## Примечания

- В режиме разработки SMS коды выводятся в консоль
- Для продакшена необходимо настроить реальный SMS провайдер в `src/utils/sms.ts`
- Файлы загружаются в папку `uploads/` (убедитесь, что она существует)


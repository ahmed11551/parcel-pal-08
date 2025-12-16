# SendBuddy Backend

Backend для P2P-платформы доставки посылок через путешественников.

## Технологии

- NestJS
- TypeORM
- PostgreSQL
- Redis (для кеширования)
- JWT для аутентификации
- Swagger для документации API

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`

4. Запустите PostgreSQL и создайте базу данных:
```sql
CREATE DATABASE sendbuddy;
```

5. Запустите миграции (если есть):
```bash
npm run migration:run
```

Или используйте синхронизацию схемы (только для разработки):
```bash
# В .env установите NODE_ENV=development
```

6. Запустите сервер:
```bash
npm run start:dev
```

API будет доступен по адресу: `http://localhost:3001/api`
Swagger документация: `http://localhost:3001/api/docs`

## Структура проекта

```
src/
├── auth/          # Аутентификация и авторизация
├── users/          # Управление пользователями
├── tasks/          # Задания (посылки)
├── orders/         # Заказы (связь отправитель-курьер)
├── payments/       # Платежи (эскроу)
├── chat/           # Чат между пользователями
├── reviews/         # Отзывы и рейтинги
├── admin/           # Админ-панель
├── files/           # Загрузка файлов
└── config/          # Конфигурация
```

## API Endpoints

### Аутентификация
- `POST /api/auth/send-code` - Отправить код верификации
- `POST /api/auth/verify-code` - Подтвердить код
- `POST /api/auth/social` - Верификация через соцсети
- `GET /api/auth/me` - Получить текущего пользователя

### Задания
- `POST /api/tasks` - Создать задание
- `GET /api/tasks` - Получить список заданий (лента)
- `GET /api/tasks/:id` - Получить задание
- `GET /api/tasks/:id/responses` - Получить отклики на задание
- `PUT /api/tasks/:id` - Обновить задание
- `DELETE /api/tasks/:id` - Отменить задание

### Заказы
- `POST /api/orders` - Откликнуться на задание
- `GET /api/orders` - Получить список заказов
- `GET /api/orders/:id` - Получить заказ
- `PUT /api/orders/:taskId/select-carrier/:orderId` - Выбрать курьера
- `PUT /api/orders/:id/package-received` - Подтвердить получение посылки
- `PUT /api/orders/:id/delivered` - Подтвердить доставку

### Платежи
- `POST /api/payments` - Создать платеж (эскроу)
- `POST /api/payments/webhook/:provider` - Webhook от платежной системы
- `PUT /api/payments/:paymentId/capture` - Подтвердить платеж
- `PUT /api/payments/:paymentId/refund` - Вернуть платеж

### Чат
- `POST /api/chat/messages` - Отправить сообщение
- `GET /api/chat/orders/:orderId/messages` - Получить сообщения
- `PUT /api/chat/orders/:orderId/read` - Пометить как прочитанные
- `GET /api/chat/unread-count` - Количество непрочитанных

### Отзывы
- `POST /api/reviews` - Создать отзыв
- `GET /api/reviews/user/:userId` - Получить отзывы пользователя

### Админ
- `GET /api/admin/tasks/pending` - Задания на модерацию
- `POST /api/admin/tasks/:id/moderate` - Модерировать задание
- `GET /api/admin/orders/disputes` - Спорные заказы
- `POST /api/admin/users/block` - Заблокировать пользователя

### Файлы
- `POST /api/files/upload` - Загрузить файл
- `POST /api/files/upload-multiple` - Загрузить несколько файлов
- `DELETE /api/files/:url` - Удалить файл

## Переменные окружения

См. `.env.example` для полного списка переменных.

## Разработка

```bash
# Запуск в режиме разработки
npm run start:dev

# Сборка
npm run build

# Запуск в продакшене
npm run start:prod

# Линтинг
npm run lint

# Тесты
npm run test
```

## Миграции

```bash
# Создать миграцию
npm run migration:generate -- -n MigrationName

# Применить миграции
npm run migration:run

# Откатить миграцию
npm run migration:revert
```


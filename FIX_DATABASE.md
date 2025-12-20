# 🔧 Исправление ошибки подключения к БД

## Проблема

```
error: password authentication failed for user "postgres"
```

Backend не может подключиться к PostgreSQL из-за неправильного пароля.

## Решение

### Вариант 1: Исправить пароль в backend/.env

1. Узнайте правильный пароль PostgreSQL
2. Отредактируйте `backend/.env`:
   ```env
   DB_PASSWORD=ваш_правильный_пароль
   ```

### Вариант 2: Изменить пароль PostgreSQL

```bash
# Войдите в PostgreSQL
psql -U postgres

# Измените пароль
ALTER USER postgres WITH PASSWORD 'postgres';

# Выйдите
\q
```

### Вариант 3: Создать нового пользователя

```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте пользователя
CREATE USER sendbuddy_user WITH PASSWORD 'sendbuddy_pass';
CREATE DATABASE sendbuddy OWNER sendbuddy_user;
GRANT ALL PRIVILEGES ON DATABASE sendbuddy TO sendbuddy_user;

# Выйдите
\q
```

Затем обновите `backend/.env`:
```env
DB_USERNAME=sendbuddy_user
DB_PASSWORD=sendbuddy_pass
```

### Вариант 4: Проверить настройки PostgreSQL

Если PostgreSQL настроен на другой способ аутентификации:

1. Проверьте `pg_hba.conf`:
   ```bash
   # macOS (Homebrew)
   cat /opt/homebrew/var/postgresql@14/pg_hba.conf
   
   # Или найдите файл
   psql -U postgres -c "SHOW hba_file;"
   ```

2. Убедитесь, что для localhost разрешена аутентификация по паролю

## После исправления

1. Перезапустите backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Дождитесь сообщения:
   ```
   Application is running on: http://localhost:3001
   ```

3. Проверьте endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/auth/send-code \
     -H "Content-Type: application/json" \
     -d '{"phone":"+79991234567"}'
   ```

## Быстрая проверка подключения

```bash
# Попробуйте подключиться вручную
psql -U postgres -d sendbuddy

# Если не работает, попробуйте без пароля (если настроено trust)
psql -U postgres -d sendbuddy -h localhost
```

## Важно

После исправления пароля backend должен:
1. Успешно подключиться к БД
2. Создать таблицы автоматически (synchronize: true в dev)
3. Зарегистрировать все endpoints
4. Начать отвечать на запросы


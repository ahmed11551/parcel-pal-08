# 📊 Статистика подписок на бота

## Как работает подписка:

### 1. **Подписаться на бота:**

Пользователь может подписаться через:
- Кнопку "🔔 Подписаться" в боте (после команды `/start`)
- Callback `subscribe` в боте

### 2. **Где хранятся подписки:**

- **Таблица `telegram_users`:**
  - Поле `subscribed BOOLEAN` - общий флаг подписки
  - Хранит связь Telegram ID с User ID

- **Таблица `telegram_subscriptions`:**
  - `telegram_id` - ID пользователя в Telegram
  - `subscription_type` - тип подписки ('all', 'tasks', 'notifications')
  - `active BOOLEAN` - активна ли подписка

---

## 📈 Как посмотреть статистику:

### Вариант 1: Через API (для админов/разработчиков)

```bash
# Получить статистику
curl http://localhost:3001/api/telegram/subscribers?stats=true

# Получить список всех подписчиков
curl http://localhost:3001/api/telegram/subscribers
```

**Ответ со статистикой:**
```json
{
  "stats": {
    "totalUsers": 150,
    "totalSubscribed": 120,
    "subscribedAll": 100,
    "subscribedTasks": 15,
    "subscribedNotifications": 5,
    "activeSubscriptions": 120
  }
}
```

**Ответ со списком:**
```json
{
  "total": 120,
  "subscribers": [
    {
      "telegram_id": 123456789,
      "first_name": "Иван",
      "username": "ivan_user",
      "subscribed": true,
      "subscription_type": "all",
      "active": true,
      "subscribed_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

### Вариант 2: Через команду в боте (для админов)

1. Добавьте ваш Telegram ID в переменную окружения:
```bash
# В .env.production или docker-compose.yml
ADMIN_TELEGRAM_IDS=123456789,987654321
```

2. Отправьте команду `/stats` в боте

**Ответ:**
```
📊 Статистика подписок SendBuddy

👥 Всего пользователей: 150
🔔 Подписано на уведомления: 120

📋 Детали подписок:
• Все уведомления: 100
• Только задания: 15
• Только уведомления: 5
• Активных подписок: 120

📈 Процент подписки: 80.0%
```

---

## 🔧 Настройка админов:

### В docker-compose.yml:

```yaml
telegram-bot:
  environment:
    ADMIN_TELEGRAM_IDS: "123456789,987654321"  # Ваши Telegram ID через запятую
```

### В .env.production:

```bash
ADMIN_TELEGRAM_IDS=123456789,987654321
```

### Как узнать свой Telegram ID:

1. Напишите боту [@userinfobot](https://t.me/userinfobot)
2. Он покажет ваш ID
3. Добавьте его в `ADMIN_TELEGRAM_IDS`

---

## 📊 SQL запросы для статистики:

### Общее количество подписчиков:
```sql
SELECT COUNT(DISTINCT telegram_id) 
FROM telegram_users 
WHERE subscribed = TRUE;
```

### Активные подписки:
```sql
SELECT COUNT(*) 
FROM telegram_subscriptions 
WHERE active = TRUE;
```

### Подписки по типам:
```sql
SELECT 
  subscription_type,
  COUNT(*) as count
FROM telegram_subscriptions
WHERE active = TRUE
GROUP BY subscription_type;
```

### Список всех подписчиков:
```sql
SELECT 
  tu.telegram_id,
  tu.first_name,
  tu.username,
  ts.subscription_type,
  ts.created_at
FROM telegram_users tu
INNER JOIN telegram_subscriptions ts ON tu.telegram_id = ts.telegram_id
WHERE tu.subscribed = TRUE AND ts.active = TRUE
ORDER BY ts.created_at DESC;
```

---

## ✅ Что реализовано:

- ✅ Подписка через кнопку в боте
- ✅ Хранение подписок в БД
- ✅ API endpoint для получения статистики
- ✅ API endpoint для получения списка подписчиков
- ✅ Команда `/stats` для админов
- ✅ Разбивка по типам подписок

---

## 🚀 Обновление на сервере:

```bash
cd /root/parcel-pal-08
git pull origin main

# Добавьте ваш Telegram ID в .env.production
echo "ADMIN_TELEGRAM_IDS=ВАШ_TELEGRAM_ID" >> .env.production

# Пересоберите telegram-bot
docker compose down
docker compose build --no-cache telegram-bot
docker compose up -d

# Проверьте логи
docker compose logs telegram-bot --tail=30
```

---

## 💡 Примечания:

- **Подписка на бота** - это не подписка на канал, а подписка на **уведомления** в боте
- Пользователь может подписаться через кнопку в боте
- Админы могут видеть статистику через команду `/stats`
- Все данные хранятся в БД и доступны через API


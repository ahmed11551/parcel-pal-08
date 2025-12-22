# ✅ Правильные команды для работы с PostgreSQL

## 🔍 Информация о БД

Из `docker-compose.yml`:
- **Имя пользователя:** `sendbuddy_user`
- **Имя базы данных:** `sendbuddy`

---

## 📝 Правильные команды

### 1. Создать тестовое уведомление:

```bash
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "
INSERT INTO telegram_notifications (telegram_id, type, title, message)
VALUES (
  8401704531,
  'new_task',
  '🧪 Тестовое уведомление',
  'Это тестовое уведомление! Если вы видите его, значит система работает.'
);
"
```

### 2. Проверить что уведомление создалось:

```bash
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "
SELECT id, type, title, sent, created_at 
FROM telegram_notifications 
WHERE telegram_id = 8401704531 
ORDER BY created_at DESC 
LIMIT 5;
"
```

### 3. Проверить подписку:

```bash
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "
SELECT 
  tu.telegram_id,
  tu.first_name,
  tu.subscribed,
  ts.active as subscription_active
FROM telegram_users tu
LEFT JOIN telegram_subscriptions ts ON tu.telegram_id = ts.telegram_id
WHERE tu.telegram_id = 8401704531;
"
```

### 4. Проверить все ваши уведомления:

```bash
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "
SELECT 
  id,
  type,
  title,
  message,
  sent,
  created_at,
  sent_at
FROM telegram_notifications
WHERE telegram_id = 8401704531
ORDER BY created_at DESC
LIMIT 10;
"
```

### 5. Проверить непрочитанные уведомления:

```bash
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "
SELECT COUNT(*) as unsent_count
FROM telegram_notifications
WHERE telegram_id = 8401704531 AND sent = FALSE;
"
```

---

## ⚠️ Важно!

Используйте `-U sendbuddy_user` (не `sendbuddy` и не `postgres`)

---

## ✅ После создания уведомления

1. **Подождите 30 секунд** - бот автоматически проверит и отправит уведомление
2. **Проверьте логи бота:**
   ```bash
   docker compose logs telegram-bot --tail=50 | grep -i notification
   ```
3. **Проверьте что уведомление отправлено:**
   ```bash
   docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "
   SELECT id, sent, sent_at 
   FROM telegram_notifications 
   WHERE telegram_id = 8401704531 
   ORDER BY created_at DESC 
   LIMIT 1;
   "
   ```

---

## 🎯 Альтернатива: Используйте команду бота

Вместо SQL, просто отправьте боту:

```
/test_notification
```

Эта команда:
- Создаст тестовое уведомление
- Проверит вашу подписку
- Покажет информацию о непрочитанных уведомлениях

---

## 📊 Все команды одной строкой

```bash
# Создать уведомление и проверить
docker compose exec postgres psql -U sendbuddy_user -d sendbuddy -c "INSERT INTO telegram_notifications (telegram_id, type, title, message) VALUES (8401704531, 'new_task', '🧪 Тестовое уведомление', 'Это тестовое уведомление!'); SELECT * FROM telegram_notifications WHERE telegram_id = 8401704531 ORDER BY created_at DESC LIMIT 1;"
```


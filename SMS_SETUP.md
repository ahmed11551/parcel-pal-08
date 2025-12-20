# Настройка SMS для SendBuddy

## Проблема
В development режиме SMS не отправляются реально, только логируются в консоль. Для production нужно настроить реальный SMS провайдер.

## Решение

### Вариант 1: SMS.ru (Рекомендуется для России)

1. Зарегистрируйтесь на [sms.ru](https://sms.ru)
2. Получите API ID
3. Добавьте в `.env.production`:
   ```env
   SMS_PROVIDER=smsru
   SMSRU_API_ID=your_api_id_here
   ```

### Вариант 2: Twilio

1. Зарегистрируйтесь на [twilio.com](https://www.twilio.com)
2. Получите:
   - Account SID
   - Auth Token
   - Phone Number
3. Установите пакет:
   ```bash
   cd backend
   npm install twilio
   ```
4. Добавьте в `.env.production`:
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Вариант 3: Другой провайдер

Добавьте поддержку в `backend/src/utils/sms.ts` по аналогии с существующими провайдерами.

## Development режим

В development режиме (или когда `SMS_PROVIDER=mock`):
- SMS не отправляются реально
- Код показывается в консоли backend
- Код также возвращается в API ответе и показывается на frontend (только в dev режиме!)

## Проверка работы

1. В development: код будет показан в интерфейсе
2. В production: код придет на телефон через SMS

## Важно

⚠️ **Никогда не используйте mock режим в production!**
- Убедитесь что `SMS_PROVIDER` настроен правильно
- Проверьте что переменные окружения установлены
- Протестируйте отправку SMS перед запуском в production


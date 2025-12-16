# 🔧 Обновление .env файла с данными PostgreSQL

## Данные из Timeweb Cloud:

- **Хост:** `9003acb2774067befd2d299e.twc1.net`
- **Порт:** `5432`
- **Пользователь:** `gen_user`
- **Пароль:** `-slUHoU>91!&yK`
- **База данных:** `default_db`
- **SSL:** Требуется (verify-full)
- **Сертификат:** `/root/.cloud-certs/root.crt`

## 📝 Обновите .env файл на сервере:

```bash
cd ~/parcel-pal-08/backend
nano .env
```

## ✅ Правильный .env файл:

```env
NODE_ENV=production
PORT=3001

# PostgreSQL (данные из Timeweb Cloud)
DB_TYPE=postgres
DB_HOST=9003acb2774067befd2d299e.twc1.net
DB_PORT=5432
DB_USERNAME=gen_user
DB_PASSWORD=-slUHoU>91!&yK
DB_DATABASE=default_db
DB_SSL=true
DB_SSL_CA=/root/.cloud-certs/root.crt

# JWT
JWT_SECRET=MBM0/gPHjfV26NV5hVedndpP5h1J+nB5NHnHqevt0fE=
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://89.169.1.238

# S3 (можно настроить позже)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ru-1
AWS_S3_BUCKET=sendbuddy-files
AWS_S3_ENDPOINT=https://s3.timeweb.cloud

# SMS (можно оставить пустым)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Платежи (можно оставить пустым)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

## 🔄 После обновления .env:

```bash
# Остановите старый контейнер
docker stop sendbuddy-backend
docker rm sendbuddy-backend

# Запустите заново
docker run -d \
  --name sendbuddy-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  -v /root/.cloud-certs:/root/.cloud-certs:ro \
  --env-file .env \
  sendbuddy-backend

# Проверьте логи
docker logs -f sendbuddy-backend
```

## ⚠️ Важно:

1. Убедитесь, что сертификат находится по пути `/root/.cloud-certs/root.crt`
2. Монтируем папку с сертификатом в контейнер: `-v /root/.cloud-certs:/root/.cloud-certs:ro`
3. Проверьте, что IP `89.169.1.238` добавлен в whitelist БД в панели Timeweb Cloud


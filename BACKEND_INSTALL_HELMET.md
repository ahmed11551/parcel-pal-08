# 🔒 Установка Helmet на сервере

## Команда для установки

На сервере выполните:

```bash
cd ~/parcel-pal-08/backend
npm install helmet
docker restart sendbuddy-backend
```

Или если используете Docker build:

```bash
cd ~/parcel-pal-08/backend
npm install helmet
docker build -t sendbuddy-backend .
docker restart sendbuddy-backend
```

## Проверка

После установки проверьте security headers:

```bash
curl -I http://89.169.1.238:3001/api/docs
```

Должны появиться заголовки:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- И другие security headers


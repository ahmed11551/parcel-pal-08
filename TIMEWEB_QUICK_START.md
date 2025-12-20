# ⚡ Быстрый старт: Деплой на Timeweb Cloud

Краткая инструкция для быстрого развертывания SendBuddy на Timeweb Cloud.

## 📋 Чеклист перед деплоем

- [ ] Аккаунт в Timeweb Cloud с пополненным балансом
- [ ] Домен (опционально, можно использовать IP)
- [ ] Готовые ключи для SMS (Twilio) и платежей (ЮKassa)

## 🚀 Шаги деплоя (15-30 минут)

### 1. Создайте инфраструктуру в Timeweb Cloud

1. **VPS для Backend** (2 CPU, 4 GB RAM, 40 GB SSD)
2. **PostgreSQL** (2 CPU, 4 GB RAM, 20 GB SSD)
3. **Redis** (1 CPU, 2 GB RAM, 10 GB SSD)
4. **S3 Bucket** для файлов

### 2. Подключитесь к Backend серверу

```bash
ssh root@YOUR_BACKEND_IP
```

### 3. Установите Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

### 4. Загрузите код проекта

```bash
# Вариант 1: Git
git clone YOUR_REPO_URL
cd sendbuddy/backend

# Вариант 2: SFTP (загрузите файлы вручную)
```

### 5. Настройте .env файл

```bash
cd backend
nano .env
```

Скопируйте из `.env.example` и заполните:

```env
NODE_ENV=production
PORT=3001

# PostgreSQL из Timeweb Cloud
DB_HOST=xxxxx.timeweb.cloud
DB_PORT=5432
DB_USERNAME=sendbuddy
DB_PASSWORD=YOUR_PASSWORD
DB_DATABASE=sendbuddy

# Redis из Timeweb Cloud
REDIS_HOST=xxxxx.timeweb.cloud
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_PASSWORD

# JWT
JWT_SECRET=YOUR_VERY_SECURE_SECRET_32_CHARS_MIN

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# S3 (Timeweb Cloud)
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_REGION=ru-1
AWS_S3_BUCKET=sendbuddy-files
AWS_S3_ENDPOINT=https://s3.timeweb.cloud

# SMS и платежи
TWILIO_ACCOUNT_SID=...
YOOKASSA_SHOP_ID=...
```

### 6. Запустите Backend

```bash
# Соберите образ
docker build -t sendbuddy-backend .

# Запустите контейнер
docker run -d \
  --name sendbuddy-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  sendbuddy-backend

# Проверьте логи
docker logs -f sendbuddy-backend
```

### 7. Деплой Frontend

**Вариант A: VPS с Docker**

```bash
# На другом VPS или том же сервере
cd /path/to/sendbuddy
docker build -t sendbuddy-frontend .
docker run -d \
  --name sendbuddy-frontend \
  --restart unless-stopped \
  -p 80:80 \
  sendbuddy-frontend
```

**Вариант B: Статический хостинг (рекомендуется)**

```bash
# Локально
npm install
npm run build

# Загрузите папку dist/ на Netlify/Vercel/Timeweb Hosting
```

### 8. Настройте SSL (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d api.yourdomain.com
certbot --nginx -d yourdomain.com
```

## ✅ Проверка

1. **Backend API**: `https://api.yourdomain.com/api/docs`
2. **Frontend**: `https://yourdomain.com`
3. **База данных**: Проверьте подключение в логах backend

## 🔄 Обновление

```bash
# Backend
cd sendbuddy/backend
git pull
docker build -t sendbuddy-backend .
docker stop sendbuddy-backend && docker rm sendbuddy-backend
docker run -d --name sendbuddy-backend --restart unless-stopped -p 3001:3001 --env-file .env sendbuddy-backend
```

## 📖 Полная документация

См. [TIMEWEB_DEPLOY.md](./TIMEWEB_DEPLOY.md) для подробной инструкции.

## 💰 Стоимость

- Backend VPS: ~500-1000₽/мес
- PostgreSQL: ~800-1500₽/мес
- Redis: ~400-800₽/мес
- Frontend: бесплатно (статический хостинг) или ~300-500₽/мес (VPS)

**Итого**: ~2000-4000₽/месяц для MVP

---

**Готово!** 🎉 Ваш проект развернут на Timeweb Cloud.


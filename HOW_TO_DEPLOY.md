# 🚀 Как перенести SendBuddy на хостинг

Пошаговое руководство по развертыванию проекта на различных хостингах.

## 📋 Содержание

1. [Timeweb Cloud (рекомендуется)](#timeweb-cloud)
2. [Другие варианты хостинга](#другие-варианты)
3. [Быстрый старт](#быстрый-старт)

---

## 🎯 Timeweb Cloud (Рекомендуется)

### Шаг 1: Подготовка (5 минут)

1. **Зарегистрируйтесь** на [timeweb.cloud](https://timeweb.cloud/)
2. **Пополните баланс** (минимум 500₽ для начала)
3. **Подготовьте данные:**
   - Домен (опционально, можно использовать IP)
   - Ключи для SMS (Twilio)
   - Ключи для платежей (ЮKassa)

### Шаг 2: Создание инфраструктуры (10 минут)

#### 2.1. VPS для Backend

1. В панели: **"Облачные серверы"** → **"Создать сервер"**
2. Настройки:
   - **ОС**: Ubuntu 22.04 LTS
   - **CPU**: 2 ядра
   - **RAM**: 4 GB
   - **Диск**: 40 GB SSD
   - **Регион**: Москва
3. Название: `sendbuddy-backend`
4. **Создайте** и запишите IP адрес

#### 2.2. PostgreSQL база данных

1. **"Облачные базы данных"** → **"Создать базу"**
2. Настройки:
   - **Тип**: PostgreSQL 16
   - **CPU**: 2 ядра
   - **RAM**: 4 GB
   - **Диск**: 20 GB SSD
3. **Запишите:**
   - Хост: `xxxxx.timeweb.cloud`
   - Порт: `5432`
   - Пользователь: `sendbuddy`
   - Пароль: (создайте надежный)
   - База: `sendbuddy`

#### 2.3. Redis

1. **"Облачные базы данных"** → **"Создать базу"**
2. Настройки:
   - **Тип**: Redis 7
   - **CPU**: 1 ядро
   - **RAM**: 2 GB
   - **Диск**: 10 GB SSD
3. **Запишите:**
   - Хост: `xxxxx.timeweb.cloud`
   - Порт: `6379`
   - Пароль: (создайте надежный)

#### 2.4. S3 хранилище

1. **"Объектное хранилище S3"** → **"Создать бакет"**
2. Название: `sendbuddy-files`
3. Регион: Москва
4. **Создайте ключи доступа:**
   - Access Key ID
   - Secret Access Key
5. **Сохраните** ключи

### Шаг 3: Подключение к серверу (2 минуты)

```bash
# Подключитесь к вашему серверу
ssh root@YOUR_SERVER_IP

# Или используйте пароль из панели управления
```

### Шаг 4: Установка Docker (3 минуты)

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
apt install docker-compose-plugin -y

# Проверяем
docker --version
docker compose version
```

### Шаг 5: Загрузка проекта (5 минут)

**Вариант A: Через Git (рекомендуется)**

```bash
# Устанавливаем Git
apt install git -y

# Клонируем проект
git clone https://github.com/ahmed11551/parcel-pal-08.git
cd parcel-pal-08/backend
```

**Вариант B: Через SFTP**

1. Используйте FileZilla или WinSCP
2. Подключитесь к серверу
3. Загрузите папку `backend/` в `/root/sendbuddy/backend/`
4. Загрузите файлы из корня проекта

### Шаг 6: Настройка переменных окружения (5 минут)

```bash
cd /root/parcel-pal-08/backend

# Создаем .env файл
nano .env
```

**Скопируйте и заполните:**

```env
# Приложение
NODE_ENV=production
PORT=3001

# PostgreSQL (из Timeweb Cloud)
DB_TYPE=postgres
DB_HOST=xxxxx.timeweb.cloud
DB_PORT=5432
DB_USERNAME=sendbuddy
DB_PASSWORD=ВАШ_ПАРОЛЬ_БД
DB_DATABASE=sendbuddy

# Redis (из Timeweb Cloud)
REDIS_HOST=xxxxx.timeweb.cloud
REDIS_PORT=6379
REDIS_PASSWORD=ВАШ_ПАРОЛЬ_REDIS

# JWT (создайте случайную строку минимум 32 символа)
JWT_SECRET=ВАШ_ОЧЕНЬ_СЕКРЕТНЫЙ_КЛЮЧ_МИНИМУМ_32_СИМВОЛА
JWT_EXPIRES_IN=7d

# Frontend URL (ваш домен или IP)
FRONTEND_URL=https://yourdomain.com

# S3 Storage (Timeweb Cloud)
AWS_ACCESS_KEY_ID=ВАШ_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=ВАШ_SECRET_KEY
AWS_REGION=ru-1
AWS_S3_BUCKET=sendbuddy-files
AWS_S3_ENDPOINT=https://s3.timeweb.cloud

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ВАШ_TWILIO_SID
TWILIO_AUTH_TOKEN=ВАШ_TWILIO_TOKEN
TWILIO_PHONE_NUMBER=+1234567890

# Платежи (ЮKassa)
YOOKASSA_SHOP_ID=ВАШ_SHOP_ID
YOOKASSA_SECRET_KEY=ВАШ_SECRET_KEY

# Throttling
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 7: Запуск Backend (3 минуты)

```bash
# Собираем Docker образ
docker build -t sendbuddy-backend .

# Запускаем контейнер
docker run -d \
  --name sendbuddy-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  sendbuddy-backend

# Проверяем логи
docker logs -f sendbuddy-backend
```

**Ожидаемый результат:** `Application is running on: http://localhost:3001`

### Шаг 8: Настройка Nginx (опционально, 5 минут)

```bash
# Устанавливаем Nginx
apt install nginx -y

# Создаем конфигурацию
nano /etc/nginx/sites-available/sendbuddy-backend
```

**Добавьте:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # или IP адрес

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активируем
ln -s /etc/nginx/sites-available/sendbuddy-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Шаг 9: Деплой Frontend (10 минут)

**Вариант A: VPS с Docker**

```bash
# На том же или другом сервере
cd /root/parcel-pal-08

# Создаем .env.production
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production

# Собираем
docker build -t sendbuddy-frontend .

# Запускаем
docker run -d \
  --name sendbuddy-frontend \
  --restart unless-stopped \
  -p 80:80 \
  sendbuddy-frontend
```

**Вариант B: Статический хостинг (рекомендуется, бесплатно)**

1. **Локально на вашем компьютере:**

```bash
cd /Users/ahmeddevops/Desktop/SendBuddynew

# Установите зависимости (если еще не установлены)
npm install

# Создайте .env.production
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production

# Соберите проект
npm run build
```

2. **Загрузите на хостинг:**

   **Netlify:**
   - Зайдите на [netlify.com](https://netlify.com)
   - Перетащите папку `dist/` в Netlify
   - Или подключите GitHub репозиторий

   **Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

   **Timeweb Hosting:**
   - Создайте сайт в панели
   - Загрузите содержимое `dist/` через FTP

### Шаг 10: Настройка SSL (5 минут)

```bash
# Устанавливаем Certbot
apt install certbot python3-certbot-nginx -y

# Получаем сертификат для backend
certbot --nginx -d api.yourdomain.com

# Для frontend (если на VPS)
certbot --nginx -d yourdomain.com
```

**Для статического хостинга:** SSL настраивается автоматически.

### Шаг 11: Проверка (2 минуты)

1. **Backend API:**
   ```
   https://api.yourdomain.com/api/docs
   ```

2. **Frontend:**
   ```
   https://yourdomain.com
   ```

3. **Проверка логов:**
   ```bash
   docker logs sendbuddy-backend
   ```

---

## 🌐 Другие варианты хостинга

### Вариант 1: VPS любого провайдера

Используйте те же шаги, что и для Timeweb Cloud:
- DigitalOcean
- AWS EC2
- Google Cloud Platform
- Yandex Cloud
- Selectel

### Вариант 2: Бесплатные варианты

**Backend:**
- Railway.app (бесплатный тариф)
- Render.com (бесплатный тариф)
- Fly.io (бесплатный тариф)

**Frontend:**
- Netlify (бесплатно)
- Vercel (бесплатно)
- GitHub Pages (бесплатно)

**База данных:**
- Supabase (бесплатный PostgreSQL)
- Neon.tech (бесплатный PostgreSQL)
- Upstash (бесплатный Redis)

### Вариант 3: Docker Hosting

- **Docker Swarm** на VPS
- **Kubernetes** (GKE, EKS, AKS)
- **Portainer** для управления

---

## ⚡ Быстрый старт (автоматический скрипт)

Если у вас уже есть сервер, используйте скрипт:

```bash
# На сервере
git clone https://github.com/ahmed11551/parcel-pal-08.git
cd parcel-pal-08

# Настройте .env в backend/
cd backend
nano .env  # Заполните все переменные

# Запустите деплой
cd ..
./deploy-timeweb.sh backend
```

---

## 🔧 Обновление проекта

```bash
# Подключитесь к серверу
ssh root@YOUR_SERVER_IP

# Обновите код
cd /root/parcel-pal-08/backend
git pull origin main

# Пересоберите и перезапустите
docker build -t sendbuddy-backend .
docker stop sendbuddy-backend
docker rm sendbuddy-backend
docker run -d \
  --name sendbuddy-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  sendbuddy-backend
```

---

## 🛠️ Решение проблем

### Backend не запускается

```bash
# Проверьте логи
docker logs sendbuddy-backend

# Проверьте подключение к БД
docker exec -it sendbuddy-backend sh
# Внутри контейнера проверьте .env файл
```

### Ошибка подключения к БД

1. Проверьте, что БД доступна из вашего VPS
2. Проверьте firewall в панели Timeweb Cloud
3. Убедитесь, что IP сервера добавлен в whitelist БД

### Frontend не подключается к API

1. Проверьте `VITE_API_URL` в `.env.production`
2. Проверьте CORS настройки в backend
3. Проверьте, что backend доступен по указанному URL

---

## 💰 Ориентировочная стоимость

**Timeweb Cloud:**
- Backend VPS: ~500-1000₽/мес
- PostgreSQL: ~800-1500₽/мес
- Redis: ~400-800₽/мес
- S3 Storage: ~10-50₽/мес
- Frontend: бесплатно (Netlify/Vercel)

**Итого:** ~2000-4000₽/месяц для MVP

**Бесплатные альтернативы:**
- Railway.app (backend): бесплатно (с ограничениями)
- Supabase (PostgreSQL): бесплатно
- Upstash (Redis): бесплатно
- Netlify (frontend): бесплатно

**Итого:** 0₽/месяц (для тестирования)

---

## 📞 Поддержка

- **Timeweb Cloud**: [support.timeweb.cloud](https://support.timeweb.cloud)
- **Документация проекта**: [TIMEWEB_DEPLOY.md](./TIMEWEB_DEPLOY.md)

---

## ✅ Чеклист деплоя

- [ ] Создан аккаунт на хостинге
- [ ] Создан VPS для backend
- [ ] Создана PostgreSQL база данных
- [ ] Создан Redis
- [ ] Создано S3 хранилище
- [ ] Настроен .env файл
- [ ] Backend запущен и работает
- [ ] Frontend собран и задеплоен
- [ ] Настроен SSL сертификат
- [ ] Проверена работа API
- [ ] Проверена работа Frontend

---

**Готово!** 🎉 Ваш проект развернут на хостинге!


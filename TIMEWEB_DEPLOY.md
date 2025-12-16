# 🚀 Деплой SendBuddy на Timeweb Cloud

Полное руководство по развертыванию проекта SendBuddy на облачной платформе [Timeweb Cloud](https://timeweb.cloud/).

## 📋 Содержание

1. [Подготовка инфраструктуры](#подготовка-инфраструктуры)
2. [Настройка базы данных](#настройка-базы-данных)
3. [Деплой Backend](#деплой-backend)
4. [Деплой Frontend](#деплой-frontend)
5. [Настройка домена и SSL](#настройка-домена-и-ssl)
6. [Настройка файлового хранилища](#настройка-файлового-хранилища)
7. [Проверка работы](#проверка-работы)

---

## 🏗️ Подготовка инфраструктуры

### Шаг 1: Регистрация в Timeweb Cloud

1. Зарегистрируйтесь на [timeweb.cloud](https://timeweb.cloud/)
2. Подтвердите email и пополните баланс (минимум 100₽ для начала)

### Шаг 2: Создание VPS для Backend

1. В панели управления выберите **"Облачные серверы"** → **"Создать сервер"**
2. Выберите конфигурацию:
   - **ОС**: Ubuntu 22.04 LTS
   - **CPU**: 2 ядра
   - **RAM**: 4 GB
   - **Диск**: 40 GB SSD
   - **Регион**: Москва (или ближайший к вам)
3. Назовите сервер: `sendbuddy-backend`
4. Создайте сервер

### Шаг 3: Создание VPS для Frontend (или используйте статический хостинг)

**Вариант A: VPS с Nginx**
- Создайте еще один VPS: `sendbuddy-frontend`
- Конфигурация: 1 CPU, 2 GB RAM, 20 GB SSD

**Вариант B: Статический хостинг (рекомендуется)**
- Используйте любой статический хостинг (Netlify, Vercel, или Timeweb Hosting)
- Это дешевле и проще в управлении

---

## 🗄️ Настройка базы данных

### Шаг 1: Создание PostgreSQL

1. В панели Timeweb Cloud выберите **"Облачные базы данных"** → **"Создать базу"**
2. Выберите:
   - **Тип**: PostgreSQL
   - **Версия**: 16
   - **Конфигурация**: 2 CPU, 4 GB RAM, 20 GB SSD
   - **Регион**: Москва (тот же, что и сервер)
3. Создайте базу данных
4. Запишите:
   - **Хост**: `xxxxx.timeweb.cloud`
   - **Порт**: `5432`
   - **База данных**: `sendbuddy`
   - **Пользователь**: `sendbuddy`
   - **Пароль**: (создайте надежный пароль)

### Шаг 2: Создание Redis

1. Создайте еще одну базу данных:
   - **Тип**: Redis
   - **Версия**: 7
   - **Конфигурация**: 1 CPU, 2 GB RAM, 10 GB SSD
2. Запишите:
   - **Хост**: `xxxxx.timeweb.cloud`
   - **Порт**: `6379`
   - **Пароль**: (создайте надежный пароль)

### Шаг 3: Настройка S3 хранилища

1. В панели выберите **"Объектное хранилище S3"** → **"Создать бакет"**
2. Назовите бакет: `sendbuddy-files`
3. Выберите регион: Москва
4. Создайте бакет
5. Создайте ключи доступа:
   - **Access Key ID**
   - **Secret Access Key**
6. Сохраните эти ключи в безопасном месте

---

## 🔧 Деплой Backend

### Шаг 1: Подключение к серверу

```bash
# Подключитесь к серверу через SSH
ssh root@YOUR_SERVER_IP

# Или используйте пароль из панели управления
```

### Шаг 2: Установка Docker

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
apt install docker-compose-plugin -y

# Проверяем установку
docker --version
docker compose version
```

### Шаг 3: Клонирование проекта

```bash
# Устанавливаем Git
apt install git -y

# Клонируем проект (замените на ваш репозиторий)
git clone https://github.com/your-username/sendbuddy.git
cd sendbuddy/backend

# Или загрузите файлы через SFTP
```

### Шаг 4: Настройка переменных окружения

```bash
# Создаем .env файл
nano .env
```

Добавьте следующие переменные:

```env
# Приложение
NODE_ENV=production
PORT=3001

# База данных PostgreSQL (из Timeweb Cloud)
DB_TYPE=postgres
DB_HOST=xxxxx.timeweb.cloud
DB_PORT=5432
DB_USERNAME=sendbuddy
DB_PASSWORD=YOUR_DB_PASSWORD
DB_DATABASE=sendbuddy

# Redis (из Timeweb Cloud)
REDIS_HOST=xxxxx.timeweb.cloud
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT
JWT_SECRET=YOUR_VERY_SECURE_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# S3 Storage (Timeweb Cloud S3)
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_REGION=ru-1
AWS_S3_BUCKET=sendbuddy-files
AWS_S3_ENDPOINT=https://s3.timeweb.cloud

# SMS (Twilio или другой провайдер)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN
TWILIO_PHONE_NUMBER=+1234567890

# Платежи (ЮKassa)
YOOKASSA_SHOP_ID=YOUR_SHOP_ID
YOOKASSA_SECRET_KEY=YOUR_SECRET_KEY

# Throttling
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Шаг 5: Сборка и запуск

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

# Или используйте docker-compose (если настроили)
docker compose up -d
```

### Шаг 6: Настройка Nginx (опционально, для проксирования)

```bash
# Устанавливаем Nginx
apt install nginx -y

# Создаем конфигурацию
nano /etc/nginx/sites-available/sendbuddy-backend
```

Добавьте:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

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
# Активируем конфигурацию
ln -s /etc/nginx/sites-available/sendbuddy-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🎨 Деплой Frontend

### Вариант A: VPS с Docker

```bash
# Подключитесь к frontend серверу
ssh root@FRONTEND_SERVER_IP

# Установите Docker (как в шаге 2 для backend)

# Клонируйте проект
git clone https://github.com/your-username/sendbuddy.git
cd sendbuddy

# Создайте .env файл
nano .env
```

```env
VITE_API_URL=https://api.yourdomain.com/api
```

```bash
# Соберите и запустите
docker build -t sendbuddy-frontend .
docker run -d \
  --name sendbuddy-frontend \
  --restart unless-stopped \
  -p 80:80 \
  sendbuddy-frontend
```

### Вариант B: Статический хостинг (рекомендуется)

1. **Соберите проект локально:**
```bash
cd /path/to/sendbuddy
npm install
npm run build
```

2. **Создайте .env.production:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

3. **Загрузите папку `dist`** на любой статический хостинг:
   - Netlify: перетащите папку `dist` в Netlify
   - Vercel: `vercel --prod`
   - Timeweb Hosting: загрузите через FTP/SFTP

---

## 🔒 Настройка домена и SSL

### Шаг 1: Настройка DNS

1. В панели управления вашего домена добавьте A-записи:
   - `api.yourdomain.com` → IP адрес backend сервера
   - `yourdomain.com` → IP адрес frontend сервера (или CNAME для статического хостинга)

### Шаг 2: Установка SSL сертификата

**Для Backend (через Let's Encrypt):**

```bash
# Устанавливаем Certbot
apt install certbot python3-certbot-nginx -y

# Получаем сертификат
certbot --nginx -d api.yourdomain.com

# Автоматическое обновление
certbot renew --dry-run
```

**Для Frontend:**
- Если используете Netlify/Vercel — SSL настраивается автоматически
- Если VPS — используйте тот же Certbot

---

## 📁 Настройка файлового хранилища

### Интеграция с Timeweb Cloud S3

Backend уже настроен для работы с S3. Убедитесь, что в `.env` указаны правильные ключи:

```env
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_REGION=ru-1
AWS_S3_BUCKET=sendbuddy-files
AWS_S3_ENDPOINT=https://s3.timeweb.cloud
```

Проверьте, что в `backend/src/files/files.service.ts` используется правильный endpoint для Timeweb Cloud.

---

## ✅ Проверка работы

### 1. Проверка Backend

```bash
# Проверяем логи
docker logs sendbuddy-backend

# Проверяем API
curl https://api.yourdomain.com/api/docs
```

### 2. Проверка Frontend

Откройте в браузере: `https://yourdomain.com`

### 3. Проверка базы данных

```bash
# Подключитесь к backend контейнеру
docker exec -it sendbuddy-backend sh

# Проверьте подключение к БД (если есть CLI)
```

---

## 🔄 Обновление приложения

### Backend

```bash
# Подключитесь к серверу
ssh root@BACKEND_SERVER_IP
cd sendbuddy/backend

# Обновите код
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

### Frontend

```bash
# Локально
npm run build

# Загрузите новую папку dist на хостинг
```

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Backend логи
docker logs -f sendbuddy-backend

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Мониторинг ресурсов

Используйте встроенные инструменты Timeweb Cloud:
- **Мониторинг серверов**: CPU, RAM, Disk
- **Мониторинг БД**: Connections, Queries, Storage

---

## 🛡️ Безопасность

1. **Firewall:**
```bash
# Разрешаем только необходимые порты
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

2. **Регулярные обновления:**
```bash
apt update && apt upgrade -y
```

3. **Резервное копирование БД:**
   - Настройте автоматические бэкапы в панели Timeweb Cloud
   - Или используйте cron для ручных бэкапов

---

## 💰 Ориентировочная стоимость

- **Backend VPS**: ~500-1000₽/месяц (2 CPU, 4 GB RAM)
- **Frontend VPS**: ~300-500₽/месяц (1 CPU, 2 GB RAM) или бесплатно (статический хостинг)
- **PostgreSQL**: ~800-1500₽/месяц (2 CPU, 4 GB RAM)
- **Redis**: ~400-800₽/месяц (1 CPU, 2 GB RAM)
- **S3 Storage**: ~10-50₽/месяц (зависит от объема)

**Итого**: ~2000-4000₽/месяц для MVP

---

## 📞 Поддержка

- **Timeweb Cloud Support**: [support.timeweb.cloud](https://support.timeweb.cloud)
- **Документация**: [timeweb.cloud/docs](https://timeweb.cloud/docs)

---

## 🎉 Готово!

Ваш проект SendBuddy развернут на Timeweb Cloud! 🚀

Если возникнут вопросы — обращайтесь в поддержку Timeweb Cloud или проверьте логи приложения.


# 📋 Скопируйте это на сервер

Вы подключены к серверу! Теперь нужно создать скрипт установки.

## ⚡ Быстрый способ

### Вариант 1: Создать скрипт через cat (рекомендуется)

На сервере выполните:

```bash
cat > install.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Установка SendBuddy..."

# Обновление системы
apt update && apt upgrade -y

# Установка Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Установка Docker Compose
if ! command -v docker compose &> /dev/null; then
    apt install docker-compose-plugin -y
fi

# Установка Git
if ! command -v git &> /dev/null; then
    apt install git -y
fi

# Клонирование проекта
if [ ! -d "parcel-pal-08" ]; then
    git clone https://github.com/ahmed11551/parcel-pal-08.git
fi

cd parcel-pal-08/backend

echo "✅ Установка завершена!"
echo "📝 Теперь создайте .env файл: nano .env"
EOF

chmod +x install.sh
bash install.sh
```

### Вариант 2: Пошаговая установка

Выполните команды по очереди:

```bash
# 1. Обновление системы
apt update && apt upgrade -y

# 2. Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# 3. Установка Git
apt install git -y

# 4. Клонирование проекта
git clone https://github.com/ahmed11551/parcel-pal-08.git

# 5. Переход в папку backend
cd parcel-pal-08/backend
```

## 📝 Создание .env файла

После установки создайте файл `.env`:

```bash
nano .env
```

Скопируйте и заполните (замените значения на свои):

```env
NODE_ENV=production
PORT=3001

# PostgreSQL (создайте в панели Timeweb Cloud)
DB_TYPE=postgres
DB_HOST=ваш_хост.timeweb.cloud
DB_PORT=5432
DB_USERNAME=sendbuddy
DB_PASSWORD=ваш_пароль
DB_DATABASE=sendbuddy

# Redis (создайте в панели Timeweb Cloud)
REDIS_HOST=ваш_хост.timeweb.cloud
REDIS_PORT=6379
REDIS_PASSWORD=ваш_пароль

# JWT (сгенерируйте случайную строку)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://89.169.1.238

# S3 Storage (создайте в панели Timeweb Cloud)
AWS_ACCESS_KEY_ID=ваш_ключ
AWS_SECRET_ACCESS_KEY=ваш_секрет
AWS_REGION=ru-1
AWS_S3_BUCKET=sendbuddy-files
AWS_S3_ENDPOINT=https://s3.timeweb.cloud

# SMS (можно оставить пустым пока)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Платежи (можно оставить пустым пока)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

# Throttling
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

## 🚀 Запуск Backend

```bash
# Сборка образа
docker build -t sendbuddy-backend .

# Запуск контейнера
docker run -d \
  --name sendbuddy-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  sendbuddy-backend

# Проверка логов
docker logs -f sendbuddy-backend
```

## ✅ Проверка

```bash
# Проверьте статус
docker ps

# Проверьте API
curl http://89.169.1.238:3001/api/docs
```

---

**Начните с варианта 1 - это самый быстрый способ!**


# 🚀 Быстрый старт на Reg.ru Cloud (Docker Compose)

## За 10 минут до запуска

Этот гайд использует **Docker Compose** - самый простой и надежный способ деплоя.

### 1. Подготовка сервера (2 минуты)

```bash
# Подключитесь к серверу
ssh root@ваш-ip

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Клонирование и настройка (2 минуты)

```bash
git clone https://github.com/ваш-username/SendBuddynew.git
cd SendBuddynew

# Создайте .env.production
cp .env.production.example .env.production
nano .env.production
```

Заполните:
- `DB_PASSWORD` - пароль для БД
- `JWT_SECRET` - сгенерируйте: `openssl rand -hex 32`
- `FRONTEND_URL` - ваш домен или IP
- `VITE_API_URL` - ваш домен/api или IP:3001/api

### 3. Деплой (1 минута)

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Настройка домена send-buddy.ru (5 минут)

У вас уже настроен домен! Выполните:

```bash
chmod +x setup-domain.sh
./setup-domain.sh
```

Скрипт автоматически:
- Настроит Nginx
- Установит SSL сертификат
- Обновит переменные окружения
- Перезапустит контейнеры

Или см. [DOMAIN_SETUP.md](DOMAIN_SETUP.md) для ручной настройки.

```bash
apt install nginx -y

# Создайте конфиг
cat > /etc/nginx/sites-available/sendbuddy << 'EOF'
server {
    listen 80;
    server_name ваш-домен.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
EOF

ln -s /etc/nginx/sites-available/sendbuddy /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 5. Обновление переменных окружения

После настройки домена обновите `.env.production`:

```bash
nano .env.production
```

Убедитесь что указано:
```env
FRONTEND_URL=https://send-buddy.ru
VITE_API_URL=https://send-buddy.ru/api
```

Перезапустите контейнеры:
```bash
docker compose down
docker compose up -d
```

## ✅ Готово!

Откройте ваш домен или IP адрес в браузере.

## 🔍 Проверка

```bash
# Статус контейнеров
docker compose ps

# Логи
docker compose logs -f

# Health check
curl http://localhost:3001/api/health
```

## 📝 Важно

- Минимум 2GB RAM для работы
- Откройте порты 80, 443, 3000, 3001 в firewall
- Регулярно делайте бэкапы БД
- Если у вас 2GB RAM - запустите `./optimize-2gb-ram.sh` для оптимизации

## 📚 Дополнительная документация

- **Полное руководство**: `DOCKER_COMPOSE_GUIDE.md` - детальная инструкция по Docker Compose
- **Общая документация**: `REG_RU_DEPLOY.md` - все варианты деплоя
- **Railway деплой**: `RAILWAY_DEPLOY.md` - альтернативный вариант


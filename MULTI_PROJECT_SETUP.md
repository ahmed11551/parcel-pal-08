# 🖥️ Размещение нескольких проектов на одном сервере

Да, можно разместить несколько проектов на одном сервере! Вот как это сделать.

## 📋 Подходы

### Вариант 1: Разные порты (проще всего)

Каждый проект использует свои порты:
- **Проект 1**: Frontend на 3000, Backend на 3001
- **Проект 2**: Frontend на 3002, Backend на 3003
- И так далее...

### Вариант 2: Nginx как reverse proxy (рекомендуется)

Все проекты работают через Nginx на портах 80/443, но используют разные домены или поддомены:
- `sendbuddy.ru` → Проект 1
- `otherproject.ru` → Проект 2
- `api.sendbuddy.ru` → Backend проекта 1

## 🚀 Вариант 1: Разные порты

### Настройка docker-compose.yml

Для каждого проекта измените порты в `docker-compose.yml`:

**Проект 1 (SendBuddy):**
```yaml
services:
  backend:
    ports:
      - "3001:3001"  # Backend
  frontend:
    ports:
      - "3000:80"    # Frontend
```

**Проект 2:**
```yaml
services:
  backend:
    ports:
      - "3003:3001"  # Backend (внутренний порт 3001, внешний 3003)
  frontend:
    ports:
      - "3002:80"    # Frontend (внутренний порт 80, внешний 3002)
```

### Структура директорий

```
/root/
├── sendbuddy/
│   ├── docker-compose.yml
│   └── ...
├── otherproject/
│   ├── docker-compose.yml
│   └── ...
└── ...
```

### Запуск проектов

```bash
# Проект 1
cd /root/sendbuddy
docker compose up -d

# Проект 2
cd /root/otherproject
docker compose up -d
```

### Доступ к проектам

- Проект 1: `http://ваш-ip:3000` (frontend), `http://ваш-ip:3001` (backend)
- Проект 2: `http://ваш-ip:3002` (frontend), `http://ваш-ip:3003` (backend)

## 🌐 Вариант 2: Nginx Reverse Proxy (рекомендуется)

Этот вариант лучше для продакшена - все работает через стандартные порты 80/443.

### 1. Настройка docker-compose.yml

Используйте `docker-compose.multi.yml` (уже создан) или измените основной:

```yaml
# Уберите ports, используйте только expose
services:
  backend:
    expose:
      - "3001"  # Только внутренний порт
  frontend:
    expose:
      - "80"    # Только внутренний порт
```

### 2. Настройка Nginx

Создайте конфигурацию для каждого проекта:

**`/etc/nginx/sites-available/sendbuddy`:**

```nginx
server {
    listen 80;
    server_name sendbuddy.ru www.sendbuddy.ru;

    location / {
        proxy_pass http://localhost:3000;  # Frontend проекта 1
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;  # Backend проекта 1
        proxy_set_header Host $host;
    }
}
```

**`/etc/nginx/sites-available/otherproject`:**

```nginx
server {
    listen 80;
    server_name otherproject.ru www.otherproject.ru;

    location / {
        proxy_pass http://localhost:3002;  # Frontend проекта 2
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3003;  # Backend проекта 2
        proxy_set_header Host $host;
    }
}
```

### 3. Активация конфигураций

```bash
ln -s /etc/nginx/sites-available/sendbuddy /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/otherproject /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. SSL для каждого домена

```bash
certbot --nginx -d sendbuddy.ru -d www.sendbuddy.ru
certbot --nginx -d otherproject.ru -d www.otherproject.ru
```

## 🔧 Изоляция проектов

### Использование разных сетей Docker

Каждый проект должен использовать свою сеть:

**Проект 1:**
```yaml
networks:
  sendbuddy-network:
    driver: bridge
```

**Проект 2:**
```yaml
networks:
  otherproject-network:
    driver: bridge
```

### Использование разных volumes

Каждый проект должен использовать свои volumes:

**Проект 1:**
```yaml
volumes:
  sendbuddy_postgres_data:
  sendbuddy_uploads_data:
```

**Проект 2:**
```yaml
volumes:
  otherproject_postgres_data:
  otherproject_uploads_data:
```

## 📊 Мониторинг нескольких проектов

### Просмотр всех контейнеров

```bash
docker ps
```

### Просмотр логов конкретного проекта

```bash
cd /root/sendbuddy
docker compose logs -f

cd /root/otherproject
docker compose logs -f
```

### Использование ресурсов

```bash
docker stats
```

## ⚠️ Важные моменты

### 1. Ресурсы сервера

Убедитесь, что у сервера достаточно ресурсов:
- **2 проекта**: минимум 4GB RAM, 4 CPU
- **3+ проектов**: минимум 8GB RAM, 6 CPU

### 2. Порты

Не используйте одинаковые порты для разных проектов:
- ✅ Проект 1: 3000, 3001
- ✅ Проект 2: 3002, 3003
- ❌ Нельзя: оба на 3000, 3001

### 3. Базы данных

Каждый проект должен иметь свою базу данных:
- ✅ sendbuddy_db
- ✅ otherproject_db
- ❌ Нельзя использовать одну БД для разных проектов

### 4. Имена контейнеров

Используйте уникальные имена:
- ✅ `sendbuddy-backend`, `sendbuddy-frontend`
- ✅ `otherproject-backend`, `otherproject-frontend`
- ❌ Нельзя: оба `backend`, `frontend`

## 🚀 Быстрый старт для нескольких проектов

### 1. Создайте директории

```bash
mkdir -p /root/sendbuddy
mkdir -p /root/otherproject
```

### 2. Клонируйте проекты

```bash
cd /root/sendbuddy
git clone https://github.com/ваш-username/SendBuddynew.git .

cd /root/otherproject
git clone https://github.com/ваш-username/OtherProject.git .
```

### 3. Настройте каждый проект

```bash
# Проект 1
cd /root/sendbuddy
cp .env.production.example .env.production
nano .env.production  # Настройте переменные

# Проект 2
cd /root/otherproject
cp .env.production.example .env.production
nano .env.production  # Настройте переменные (другие порты!)
```

### 4. Запустите проекты

```bash
# Проект 1
cd /root/sendbuddy
docker compose up -d

# Проект 2
cd /root/otherproject
docker compose up -d
```

### 5. Настройте Nginx

Создайте конфигурации для каждого проекта и активируйте их.

## 📝 Пример конфигурации для второго проекта

Если у вас второй проект тоже на Node.js, создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: otherproject-db
    environment:
      POSTGRES_DB: otherproject
      POSTGRES_USER: otherproject_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - otherproject_postgres_data:/var/lib/postgresql/data
    expose:
      - "5432"
    networks:
      - otherproject-network

  backend:
    # ... ваша конфигурация
    ports:
      - "3003:3001"  # Внешний порт 3003
    networks:
      - otherproject-network

  frontend:
    # ... ваша конфигурация
    ports:
      - "3002:80"    # Внешний порт 3002
    networks:
      - otherproject-network

volumes:
  otherproject_postgres_data:

networks:
  otherproject-network:
    driver: bridge
```

## ✅ Итог

**Да, можно разместить несколько проектов на одном сервере!**

Рекомендации:
- Используйте разные порты для каждого проекта
- Настройте Nginx как reverse proxy для удобства
- Используйте разные имена контейнеров и volumes
- Убедитесь, что у сервера достаточно ресурсов



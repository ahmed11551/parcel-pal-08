# 🔧 Исправление ошибки 502 Bad Gateway

## ❌ Проблема

Ошибка: `GET https://send-buddy.ru/ 502 (Bad Gateway)`

Это означает, что nginx не может подключиться к frontend серверу.

---

## 🔍 Диагностика

### 1. Проверьте статус контейнеров:

```bash
docker compose ps
```

**Должны быть запущены:**
- `frontend` - должен быть `Up`
- `backend` - должен быть `Up`
- `nginx` - должен быть `Up` (если используется)
- `postgres` - должен быть `Up`

### 2. Проверьте логи frontend:

```bash
docker compose logs frontend --tail=50
```

### 3. Проверьте логи nginx (если есть):

```bash
docker compose logs nginx --tail=50
```

### 4. Проверьте что frontend отвечает на порту 3000:

```bash
# На сервере
curl http://localhost:3000
```

Если frontend запущен в контейнере, попробуйте:

```bash
docker compose exec frontend curl http://localhost:3000
```

---

## ✅ Решения

### Решение 1: Перезапустить frontend

```bash
cd /root/parcel-pal-08
docker compose restart frontend

# Или полный перезапуск
docker compose down
docker compose up -d
```

### Решение 2: Проверить переменные окружения

Проверьте что в `.env.production` или `docker-compose.yml` правильно указан `FRONTEND_URL`:

```bash
# Проверьте переменные
docker compose exec frontend printenv | grep VITE
```

### Решение 3: Пересобрать frontend

```bash
cd /root/parcel-pal-08
docker compose down
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Решение 4: Проверить nginx конфигурацию

Если используется nginx на хосте (не в контейнере), проверьте конфиг:

```bash
# На сервере
sudo nginx -t

# Проверьте конфиг nginx
sudo cat /etc/nginx/sites-available/send-buddy.ru
# или
sudo cat /etc/nginx/conf.d/send-buddy.conf
```

**Nginx должен проксировать на `http://localhost:3000`** (или IP контейнера).

Пример правильной конфигурации:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name send-buddy.ru www.send-buddy.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Решение 5: Проверить порты

Убедитесь что frontend слушает на правильном порту:

```bash
# Проверьте какие порты прослушиваются
netstat -tlnp | grep 3000
# или
ss -tlnp | grep 3000
```

### Решение 6: Проверить firewall

```bash
# Проверьте что порт 3000 открыт
sudo ufw status
# или
sudo iptables -L -n | grep 3000
```

---

## 🚀 Быстрая команда для исправления

```bash
cd /root/parcel-pal-08

# 1. Остановить все
docker compose down

# 2. Проверить что нет конфликтов портов
netstat -tlnp | grep -E "3000|3001|80|443"

# 3. Запустить все заново
docker compose up -d

# 4. Проверить статус
docker compose ps

# 5. Проверить логи
docker compose logs frontend --tail=30
```

---

## 📋 Проверка после исправления

### 1. Проверьте что frontend запущен:

```bash
docker compose ps frontend
```

Должно быть: `Up (healthy)` или `Up`

### 2. Проверьте что frontend отвечает:

```bash
curl -I http://localhost:3000
```

Должно вернуть: `HTTP/1.1 200 OK`

### 3. Проверьте через браузер:

Откройте `https://send-buddy.ru` - должно работать!

---

## 🔍 Дополнительная диагностика

### Если frontend не запускается:

```bash
# Смотрите детальные логи
docker compose logs frontend

# Проверьте что сборка прошла успешно
docker compose build frontend
```

### Если nginx не может подключиться:

```bash
# Проверьте что frontend доступен из nginx контейнера/процесса
# Если nginx в контейнере:
docker compose exec nginx curl http://frontend:3000

# Если nginx на хосте:
curl http://localhost:3000
```

### Если проблема с SSL:

```bash
# Проверьте SSL сертификат
openssl s_client -connect send-buddy.ru:443 -servername send-buddy.ru < /dev/null 2>/dev/null | grep "verify return code"

# Должно быть: verify return code: 0 (ok)
```

---

## ⚠️ Частые причины 502:

1. **Frontend не запущен** - проверьте `docker compose ps`
2. **Frontend упал** - проверьте логи `docker compose logs frontend`
3. **Неправильный порт в nginx** - проверьте конфиг nginx
4. **Firewall блокирует** - проверьте правила firewall
5. **Контейнер не в сети** - проверьте `docker network ls`
6. **Нехватка памяти** - проверьте `free -h` и `docker stats`

---

## ✅ После исправления

1. Проверьте что сайт открывается: `https://send-buddy.ru`
2. Проверьте что Mini App открывается через Telegram
3. Проверьте логи на ошибки

---

**Если проблема осталась, пришлите вывод команд:**
- `docker compose ps`
- `docker compose logs frontend --tail=50`
- `curl -I http://localhost:3000`


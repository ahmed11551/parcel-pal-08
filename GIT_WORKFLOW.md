# Правильный Git Workflow

## ⚠️ ВАЖНО: Не делайте git push на сервере!

### Правильный процесс:

#### 1. На локальной машине (ваш компьютер):

```bash
cd /Users/ahmeddevops/Desktop/SendBuddynew

# Проверить изменения
git status

# Добавить файлы (кроме backup файлов)
git add backend/src/routes/auth.ts
git add backend/src/utils/sms.ts
git add backend/src/middleware/security.ts
git add backend/src/index.ts
git add src/lib/token-storage.ts
git add src/lib/api.ts
git add src/contexts/AuthContext.tsx
git add src/hooks/useTelegram.ts
git add docker-compose.yml
git add .gitignore

# НЕ добавляйте backup файлы:
# git add backend/src/routes/auth.ts.backup  ❌
# git add backend/src/utils/sms.ts.backup    ❌

# Закоммитить
git commit -m "Production readiness: security improvements, TypeScript fixes, token storage"

# Запушить в GitHub
git push
```

Если git push запрашивает пароль:
- GitHub больше не принимает пароли
- Используйте Personal Access Token вместо пароля
- Или настройте SSH ключи

#### 2. На сервере (только git pull):

```bash
cd /root/parcel-pal-08

# Получить изменения
git pull

# Пересобрать контейнеры
docker compose down
docker compose build --no-cache backend frontend telegram-bot
docker compose up -d

# Проверить логи
docker compose logs backend --tail=50
```

---

## 🔐 Настройка GitHub Authentication

### Вариант 1: Personal Access Token (рекомендуется)

1. Создайте токен на GitHub:
   - Перейдите: https://github.com/settings/tokens
   - Generate new token (classic)
   - Выберите scope: `repo`
   - Скопируйте токен

2. При git push используйте токен как пароль:
   ```
   Username: ahmed11551
   Password: <ваш_токен>
   ```

### Вариант 2: SSH ключи

1. Создайте SSH ключ (если нет):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Добавьте публичный ключ на GitHub:
   - https://github.com/settings/keys
   - New SSH key

3. Измените remote URL на SSH:
   ```bash
   git remote set-url origin git@github.com:ahmed11551/parcel-pal-08.git
   ```

---

## 📋 Чеклист перед коммитом

- [ ] Все изменения сделаны
- [ ] TypeScript ошибок нет
- [ ] Линтер не показывает ошибок
- [ ] Backup файлы в .gitignore
- [ ] .env файлы не коммитятся
- [ ] Проверен git status

---

## 🚫 Что НЕ нужно коммитить:

- ❌ Backup файлы (*.backup)
- ❌ .env файлы
- ❌ node_modules
- ❌ dist директории
- ❌ Логи

Все это уже в .gitignore


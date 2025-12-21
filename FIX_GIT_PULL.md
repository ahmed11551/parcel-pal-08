# Исправление проблемы с git pull (divergent branches)

## Проблема

При попытке `git pull` на сервере возникла ошибка:
```
hint: You have divergent branches and need to specify how to reconcile them.
fatal: Need to specify how to reconcile divergent branches.
```

Это происходит, когда локальная и удаленная ветки разошлись (есть разные коммиты).

## Решение

### Вариант 1: Merge (рекомендуется)

```bash
# На сервере
cd /root/parcel-pal-08

# Настроить стратегию merge по умолчанию (один раз)
git config pull.rebase false

# Теперь можно делать pull
git pull origin main

# Если есть конфликты, разрешите их и сделайте commit
```

### Вариант 2: Rebase (для чистой истории)

```bash
# На сервере
cd /root/parcel-pal-08

# Настроить стратегию rebase
git config pull.rebase true

# Сделать pull с rebase
git pull origin main
```

### Вариант 3: Force pull (если локальные изменения не важны)

⚠️ **ВНИМАНИЕ**: Это удалит все локальные изменения на сервере!

```bash
# На сервере
cd /root/parcel-pal-08

# Сохранить изменения локально (если нужно)
git stash

# Сбросить локальную ветку до удаленной
git fetch origin
git reset --hard origin/main

# Если были сохраненные изменения, восстановить их
git stash pop
```

## Рекомендация

Для продакшн сервера лучше использовать **Вариант 1 (merge)**, так как:
- Это безопаснее
- Сохраняет историю изменений
- Легче откатить если что-то пошло не так

---

## После решения проблемы с git

После успешного pull:

```bash
# Пересобрать контейнеры с новыми изменениями
docker compose down
docker compose build --no-cache frontend backend
docker compose up -d

# Проверить статус
docker compose ps

# Проверить логи
docker compose logs frontend --tail=50
docker compose logs backend --tail=50
```

---

## Также проверьте переменные окружения

Видно предупреждения:
```
WARN[0000] The "SMS_PROVIDER" variable is not set. Defaulting to a blank string.
WARN[0000] The "TELEGRAM_BOT_TOKEN" variable is not set. Defaulting to a blank string.
```

Проверьте `.env.production`:

```bash
cd /root/parcel-pal-08
cat .env.production | grep -E "SMS_PROVIDER|TELEGRAM_BOT_TOKEN"

# Должно быть:
# SMS_PROVIDER=mock
# TELEGRAM_BOT_TOKEN=8146754886:AAF0KRnXaCU3RwwqLSR0YomJkFbG6UFx8l4
```

Если переменных нет, добавьте их в `.env.production` и перезапустите контейнеры.


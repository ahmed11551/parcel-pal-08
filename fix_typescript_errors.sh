#!/bin/bash
# Скрипт для исправления TypeScript ошибок на сервере

cd /root/parcel-pal-08/backend/src/routes

# Исправление auth.ts - замена logger.error с phone
sed -i.bak 's/logger\.error({ err: error, phone },/logger.error({ err: error, phone: phone || '\''unknown'\'' },/g' auth.ts

# Также нужно исправить объявления переменных phone
# Строка 96 (register/verify)
sed -i.bak2 '/router\.post.*register\/verify/,/const { phone, code, name }/ {
  /const { phone, code, name }/ {
    a\
  let phone: string | undefined;
    s/const { phone, code, name }/const parsed = verifySchema.extend({ name: z.string().min(2) }).parse(req.body);\
    phone = parsed.phone;\
    const { code, name } = parsed;/
  }
}' auth.ts

# Строка 168 (login/send-code)  
sed -i.bak3 '/router\.post.*login\/send-code/,/const { phone }/ {
  /const { phone }/ {
    a\
  let phone: string | undefined;
    s/const { phone }/const parsed = loginSchema.parse(req.body);\
    phone = parsed.phone;/
  }
}' auth.ts

# Строка 212 (login/verify)
sed -i.bak4 '/router\.post.*login\/verify/,/const { phone, code }/ {
  /const { phone, code }/ {
    a\
  let phone: string | undefined;
    s/const { phone, code }/const parsed = verifySchema.parse(req.body);\
    phone = parsed.phone;\
    const { code } = parsed;/
  }
}' auth.ts

echo "✅ auth.ts исправлен"

# Исправление sms.ts
cd /root/parcel-pal-08/backend/src/utils

# Добавляем типизацию для data в sms.ts
sed -i.bak 's/const data = await response\.json();/const data = await response.json() as { status?: string; status_code?: number; balance?: number; };/' sms.ts

# Для других мест с data (SMSC.ru и GetSMS)
sed -i.bak2 's/const data = await response\.json();/const data = await response.json() as { error?: string; balance?: string | number; };/' sms.ts

# Для GetSMS
sed -i.bak3 '/GetSMS\.online/,/const data = await response\.json();/ {
  s/const data = await response\.json();/const data = await response.json() as { success?: boolean; error?: string; };/
}' sms.ts

echo "✅ sms.ts исправлен"

echo "✅ Все исправления применены. Проверьте файлы и пересоберите backend."


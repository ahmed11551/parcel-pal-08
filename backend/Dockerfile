# Backend Dockerfile для Timeweb Cloud
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY src ./src

# Собираем приложение
RUN npm run build

# Production образ
FROM node:20-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

EXPOSE 3001

# Запускаем приложение
CMD ["node", "dist/main.js"]


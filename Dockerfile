# Frontend Dockerfile для Timeweb Cloud
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY src ./src
COPY public ./public
COPY index.html ./

# Собираем приложение
RUN npm run build

# Production образ с Nginx
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


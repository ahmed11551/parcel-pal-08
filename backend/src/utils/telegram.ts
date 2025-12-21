import crypto from 'crypto';
import { logger, metrics } from './logger.js';

// Таймаут для Telegram API запросов (5 секунд)
const TELEGRAM_API_TIMEOUT = 5000;

/**
 * Валидация Telegram initData
 * @param initData - Строка initData от Telegram Web App
 * @param botToken - Токен бота (для проверки подписи)
 * @returns Объект с данными пользователя или null
 */
export function validateTelegramInitData(initData: string, botToken: string): {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
} | null {
  try {
    // Парсим initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      return null;
    }

    // Проверяем время (auth_date не должен быть старше 24 часов)
    const authDate = parseInt(params.get('auth_date') || '0');
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) { // 24 часа
      return null;
    }

    // Удаляем hash из параметров для проверки подписи
    params.delete('hash');
    
    // Сортируем параметры по ключу
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    // Проверяем подпись
    if (calculatedHash !== hash) {
      return null;
    }

    // Извлекаем данные пользователя
    const userStr = params.get('user');
    if (!userStr) {
      return null;
    }

    const user = JSON.parse(userStr);
    
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: authDate,
      hash: hash,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error validating Telegram initData');
    return null;
  }
}

/**
 * Извлечение данных пользователя из initData без валидации (для разработки)
 */
export function parseTelegramInitData(initData: string): {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
} | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    
    if (!userStr) {
      return null;
    }

    return JSON.parse(userStr);
  } catch (error) {
    logger.error({ err: error }, 'Error parsing Telegram initData');
    return null;
  }
}


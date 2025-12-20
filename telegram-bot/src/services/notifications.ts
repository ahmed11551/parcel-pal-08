import axios from 'axios';
import { bot } from '../index.js';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

/**
 * Отправка уведомлений через Telegram Bot
 */
export async function sendNotifications() {
  try {
    // Получаем список всех подписанных пользователей
    const response = await axios.get(`${API_URL}/telegram/subscribers`);
    const subscribers = response.data.subscribers || [];

    for (const subscriber of subscribers) {
      // Получаем непрочитанные уведомления
      const notificationsResponse = await axios.get(
        `${API_URL}/telegram/notifications/${subscriber.telegram_id}`
      );
      const notifications = notificationsResponse.data.notifications || [];

      for (const notification of notifications) {
        try {
          // Формируем сообщение
          const message = `*${notification.title}*\n\n${notification.message}`;

          // Добавляем кнопку, если есть данные
          let keyboard = undefined;
          if (notification.data?.taskId) {
            keyboard = {
              inline_keyboard: [[
                {
                  text: '📦 Открыть задание',
                  web_app: { url: `${process.env.MINI_APP_URL}/tasks/${notification.data.taskId}` }
                }
              ]]
            };
          }

          // Отправляем уведомление
          await bot.telegram.sendMessage(subscriber.telegram_id, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });

          // Отмечаем как отправленное
          try {
            await axios.post(`${API_URL}/telegram/notifications/${notification.id}/mark-sent`);
          } catch (error) {
            console.error(`Error marking notification ${notification.id} as sent:`, error);
          }

          // Небольшая задержка между отправками
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`Error sending notification ${notification.id}:`, error.message);
          // Если пользователь заблокировал бота, отмечаем уведомление как отправленное
          if (error.response?.statusCode === 403) {
            await axios.post(`${API_URL}/telegram/notifications/${notification.id}/mark-sent`).catch(() => {});
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in sendNotifications:', error);
  }
}

/**
 * Запуск периодической отправки уведомлений
 */
export function startNotificationService(intervalMs: number = 30000) {
  // Отправляем сразу при запуске
  sendNotifications();

  // Затем каждые N секунд
  setInterval(() => {
    sendNotifications();
  }, intervalMs);

  console.log(`✅ Notification service started (interval: ${intervalMs}ms)`);
}


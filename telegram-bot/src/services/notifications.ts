import axios from 'axios';
import { bot } from '../index.js';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

/**
 * Отправка уведомлений через Telegram Bot
 */
export async function sendNotifications() {
  try {
    console.log('[Notification Service] Checking for notifications...');
    
    // Получаем список всех подписанных пользователей
    const response = await axios.get(`${API_URL}/telegram/subscribers`);
    const subscribers = response.data.subscribers || [];
    
    console.log(`[Notification Service] Found ${subscribers.length} subscribed users`);

    for (const subscriber of subscribers) {
      try {
        // Получаем непрочитанные уведомления
        const notificationsResponse = await axios.get(
          `${API_URL}/telegram/notifications/${subscriber.telegram_id}`
        );
        const notifications = notificationsResponse.data.notifications || [];
        
        if (notifications.length > 0) {
          console.log(`[Notification Service] User ${subscriber.telegram_id} has ${notifications.length} unsent notifications`);
        }

        for (const notification of notifications) {
          try {
            console.log(`[Notification Service] Sending notification ${notification.id} to user ${subscriber.telegram_id}`);
            
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
            
            console.log(`[Notification Service] ✅ Notification ${notification.id} sent successfully to user ${subscriber.telegram_id}`);

            // Отмечаем как отправленное
            try {
              await axios.post(`${API_URL}/telegram/notifications/${notification.id}/mark-sent`);
              console.log(`[Notification Service] ✅ Notification ${notification.id} marked as sent`);
            } catch (error) {
              console.error(`[Notification Service] ❌ Error marking notification ${notification.id} as sent:`, error);
            }

            // Небольшая задержка между отправками
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error: any) {
            console.error(`[Notification Service] ❌ Error sending notification ${notification.id} to user ${subscriber.telegram_id}:`, error.message);
            if (error.response) {
              console.error(`[Notification Service] Response status: ${error.response.status}, data:`, error.response.data);
            }
            // Если пользователь заблокировал бота, отмечаем уведомление как отправленное
            if (error.response?.status === 403 || error.response?.statusCode === 403) {
              console.log(`[Notification Service] User ${subscriber.telegram_id} blocked the bot, marking notification as sent`);
              await axios.post(`${API_URL}/telegram/notifications/${notification.id}/mark-sent`).catch(() => {});
            }
          }
        }
      } catch (error: any) {
        console.error(`[Notification Service] ❌ Error getting notifications for user ${subscriber.telegram_id}:`, error.message);
      }
    }
    
    console.log('[Notification Service] Finished checking notifications');
  } catch (error: any) {
    console.error('[Notification Service] ❌ Error in sendNotifications:', error.message);
    if (error.response) {
      console.error('[Notification Service] Response status:', error.response.status);
      console.error('[Notification Service] Response data:', error.response.data);
    }
  }
}

/**
 * Запуск периодической отправки уведомлений
 */
export function startNotificationService(intervalMs: number = 30000) {
  console.log(`[Notification Service] Starting notification service (interval: ${intervalMs}ms)`);
  
  // Отправляем сразу при запуске (с небольшой задержкой чтобы бот точно был готов)
  setTimeout(() => {
    console.log('[Notification Service] Running initial notification check...');
    sendNotifications();
  }, 2000);

  // Затем каждые N секунд
  setInterval(() => {
    sendNotifications();
  }, intervalMs);

  console.log(`✅ Notification service started (interval: ${intervalMs}ms)`);
}


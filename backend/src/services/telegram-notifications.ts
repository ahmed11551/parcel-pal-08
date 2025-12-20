import { pool } from '../db/index.js';

export interface NotificationData {
  type: 'new_task' | 'task_assigned' | 'task_status_changed' | 'new_message' | 'payment_released' | 'review_received';
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Создать уведомление для Telegram пользователя
 */
export async function createTelegramNotification(
  telegramId: number,
  notification: NotificationData
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO telegram_notifications (telegram_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        telegramId,
        notification.type,
        notification.title,
        notification.message,
        notification.data ? JSON.stringify(notification.data) : null,
      ]
    );
  } catch (error) {
    console.error('Error creating Telegram notification:', error);
    throw error;
  }
}

/**
 * Создать уведомление для пользователя по его user_id
 */
export async function createNotificationForUser(
  userId: number,
  notification: NotificationData
): Promise<void> {
  try {
    // Находим telegram_id по user_id
    const result = await pool.query(
      'SELECT telegram_id, subscribed FROM telegram_users WHERE user_id = $1 AND subscribed = TRUE',
      [userId]
    );

    if (result.rows.length > 0) {
      for (const row of result.rows) {
        await createTelegramNotification(row.telegram_id, notification);
      }
    }
  } catch (error) {
    console.error('Error creating notification for user:', error);
    throw error;
  }
}

/**
 * Отметить уведомление как отправленное
 */
export async function markNotificationAsSent(notificationId: number): Promise<void> {
  try {
    await pool.query(
      'UPDATE telegram_notifications SET sent = TRUE, sent_at = CURRENT_TIMESTAMP WHERE id = $1',
      [notificationId]
    );
  } catch (error) {
    console.error('Error marking notification as sent:', error);
    throw error;
  }
}

/**
 * Получить непрочитанные уведомления для пользователя
 */
export async function getUnsentNotifications(telegramId: number): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT id, type, title, message, data, created_at
       FROM telegram_notifications
       WHERE telegram_id = $1 AND sent = FALSE
       ORDER BY created_at ASC
       LIMIT 50`,
      [telegramId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting unsent notifications:', error);
    return [];
  }
}

/**
 * Уведомление о новом задании
 */
export async function notifyNewTask(telegramId: number, task: any): Promise<void> {
  await createTelegramNotification(telegramId, {
    type: 'new_task',
    title: '📦 Новое задание',
    message: `Появилось новое задание: "${task.title}"\nМаршрут: ${task.from?.airport} → ${task.to?.airport}\nВознаграждение: ${task.reward} ₽`,
    data: { taskId: task.id },
  });
}

/**
 * Уведомление о назначении курьером
 */
export async function notifyTaskAssigned(telegramId: number, task: any): Promise<void> {
  await createTelegramNotification(telegramId, {
    type: 'task_assigned',
    title: '✅ Вы назначены курьером',
    message: `Вы назначены курьером задания: "${task.title}"\nМаршрут: ${task.from?.airport} → ${task.to?.airport}`,
    data: { taskId: task.id },
  });
}

/**
 * Уведомление об изменении статуса задания
 */
export async function notifyTaskStatusChanged(telegramId: number, task: any, status: string): Promise<void> {
  const statusMessages: Record<string, string> = {
    in_transit: '🚚 Посылка в пути',
    delivered: '✅ Посылка доставлена',
    cancelled: '❌ Задание отменено',
  };

  await createTelegramNotification(telegramId, {
    type: 'task_status_changed',
    title: statusMessages[status] || '📋 Статус изменен',
    message: `Статус задания "${task.title}" изменен на: ${status}`,
    data: { taskId: task.id, status },
  });
}

/**
 * Уведомление о новом сообщении
 */
export async function notifyNewMessage(telegramId: number, message: any, task: any): Promise<void> {
  await createTelegramNotification(telegramId, {
    type: 'new_message',
    title: '💬 Новое сообщение',
    message: `Новое сообщение в задании "${task.title}":\n${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
    data: { taskId: task.id, messageId: message.id },
  });
}

/**
 * Уведомление о переводе денег
 */
export async function notifyPaymentReleased(telegramId: number, amount: number, task: any): Promise<void> {
  await createTelegramNotification(telegramId, {
    type: 'payment_released',
    title: '💰 Деньги переведены',
    message: `Вам переведено ${amount} ₽ за доставку задания "${task.title}"`,
    data: { taskId: task.id, amount },
  });
}

/**
 * Уведомление о новом отзыве
 */
export async function notifyReviewReceived(telegramId: number, review: any): Promise<void> {
  await createTelegramNotification(telegramId, {
    type: 'review_received',
    title: '⭐ Новый отзыв',
    message: `Вы получили отзыв: ${review.rating} ⭐\n${review.comment || ''}`,
    data: { reviewId: review.id },
  });
}


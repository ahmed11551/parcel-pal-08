import { Context } from 'telegraf';
import telegramAPI from '../utils/api.js';

export const testNotificationCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  
  if (!telegramId) {
    await ctx.reply('❌ Ошибка: не удалось получить ваш Telegram ID');
    return;
  }

  // Проверка на админа
  const ADMIN_TELEGRAM_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id)) || [];
  
  if (!ADMIN_TELEGRAM_IDS.includes(telegramId)) {
    await ctx.reply('❌ У вас нет доступа к этой команде.');
    return;
  }

  try {
    // Отправляем тестовое уведомление напрямую в бот
    await ctx.reply(
      '🔔 *Тестовое уведомление*\n\n' +
      'Если вы видите это сообщение, значит бот работает!\n\n' +
      'Теперь проверим систему уведомлений через API...',
      {
        parse_mode: 'Markdown'
      }
    );

    // Проверяем подписку
    const subscribersResponse = await telegramAPI.getSubscribers();
    const isSubscribed = subscribersResponse.subscribers?.some((sub: any) => 
      sub.telegram_id === telegramId
    );

    if (isSubscribed) {
      await ctx.reply(
        '✅ Вы подписаны на уведомления!\n\n' +
        'Проверяем непрочитанные уведомления...',
        {
          parse_mode: 'Markdown'
        }
      );

      // Проверяем уведомления
      const notificationsResponse = await telegramAPI.getNotifications(telegramId);
      const notifications = notificationsResponse.notifications || [];

      if (notifications.length > 0) {
        await ctx.reply(
          `📬 У вас ${notifications.length} непрочитанных уведомлений.\n\n` +
          `Последнее: ${notifications[0].title}\n` +
          `${notifications[0].message.substring(0, 100)}...`,
          {
            parse_mode: 'Markdown'
          }
        );
      } else {
        await ctx.reply(
          'ℹ️ У вас нет непрочитанных уведомлений.\n\n' +
          'Уведомления создаются когда:\n' +
          '• Появляется новое задание\n' +
          '• Вам назначают курьером\n' +
          '• Изменяется статус задания\n' +
          '• Приходит новое сообщение\n\n' +
          'Создайте тестовое задание или назначьте себя курьером для проверки.',
          {
            parse_mode: 'Markdown'
          }
        );
      }
    } else {
      await ctx.reply(
        '⚠️ Вы не подписаны на уведомления!\n\n' +
        'Подпишитесь, чтобы получать уведомления:\n' +
        '1. Нажмите кнопку "🔔 Подписаться" в меню\n' +
        '2. Или отправьте команду /start и нажмите "🔔 Подписаться"',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔔 Подписаться', callback_data: 'subscribe' }
              ]
            ]
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Test notification error:', error);
    await ctx.reply(
      `❌ Ошибка при проверке уведомлений:\n${error.message}\n\n` +
      'Проверьте логи бота на сервере.',
      {
        parse_mode: 'Markdown'
      }
    );
  }
};


import { Context } from 'telegraf';
import telegramAPI from '../utils/api.js';

export const statsCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  
  // Проверка на админа (можно вынести в env или конфиг)
  const ADMIN_TELEGRAM_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id)) || [];
  
  if (!ADMIN_TELEGRAM_IDS.includes(telegramId || 0)) {
    await ctx.reply('❌ У вас нет доступа к этой команде.');
    return;
  }

  try {
    const statsData = await telegramAPI.getSubscribersStats();
    
    await ctx.reply(
      `📊 *Статистика подписок SendBuddy*\n\n` +
      `👥 Всего пользователей: *${statsData.stats.totalUsers}*\n` +
      `🔔 Подписано на уведомления: *${statsData.stats.totalSubscribed}*\n\n` +
      `📋 *Детали подписок:*\n` +
      `• Все уведомления: *${statsData.stats.subscribedAll}*\n` +
      `• Только задания: *${statsData.stats.subscribedTasks}*\n` +
      `• Только уведомления: *${statsData.stats.subscribedNotifications}*\n` +
      `• Активных подписок: *${statsData.stats.activeSubscriptions}*\n\n` +
      `📈 Процент подписки: *${statsData.stats.totalUsers > 0 ? ((statsData.stats.totalSubscribed / statsData.stats.totalUsers) * 100).toFixed(1) : 0}%*`,
      {
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('Stats command error:', error);
    await ctx.reply('❌ Ошибка при получении статистики. Попробуйте позже.');
  }
};


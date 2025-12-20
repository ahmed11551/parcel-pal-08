import { Context } from 'telegraf';
import { MINI_APP_URL } from '../index';

export const startCommand = async (ctx: Context) => {
  const firstName = ctx.from?.first_name || 'Пользователь';
  
  await ctx.reply(
    `👋 Привет, ${firstName}!\n\n` +
    `Добро пожаловать в *SendBuddy* — платформу для передачи посылок через путешественников.\n\n` +
    `🚀 *Что я умею:*\n` +
    `• Открыть приложение SendBuddy\n` +
    `• Помочь с вопросами\n` +
    `• Связать с поддержкой\n` +
    `• Оставить отзыв\n` +
    `• Подписаться на уведомления\n\n` +
    `Используйте /help для списка команд.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Открыть SendBuddy',
              web_app: { url: MINI_APP_URL }
            }
          ],
          [
            { text: '❓ Помощь', callback_data: 'help' },
            { text: '💬 Поддержка', callback_data: 'support' }
          ],
          [
            { text: '⭐ Оставить отзыв', callback_data: 'review' },
            { text: '🔔 Подписаться', callback_data: 'subscribe' }
          ]
        ]
      }
    }
  );
};


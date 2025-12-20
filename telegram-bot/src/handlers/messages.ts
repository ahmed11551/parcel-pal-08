import { Context } from 'telegraf';
import telegramAPI from '../utils/api';

export const messageHandler = async (ctx: Context) => {
  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text;
  const chatId = ctx.chat?.id;

  // Если это ответ на вопрос поддержки
  if (text && chatId) {
    // Здесь можно добавить логику обработки сообщений поддержки
    // Пока просто подтверждаем получение
    await ctx.reply(
      '✅ Спасибо за ваше сообщение! Мы получили его и ответим в ближайшее время.\n\n' +
      'Используйте /help для списка команд.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🏠 На главную', callback_data: 'start' }
            ]
          ]
        }
      }
    );
  }
};


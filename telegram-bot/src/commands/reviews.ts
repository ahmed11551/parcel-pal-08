import { Context } from 'telegraf';

export const reviewsCommand = async (ctx: Context) => {
  await ctx.reply(
    `⭐ *Оставить отзыв*\n\n` +
    `Ваше мнение очень важно для нас!\n\n` +
    `Пожалуйста, оцените SendBuddy от 1 до 5 звезд и оставьте комментарий.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⭐ 1', callback_data: 'review_1' },
            { text: '⭐⭐ 2', callback_data: 'review_2' },
            { text: '⭐⭐⭐ 3', callback_data: 'review_3' }
          ],
          [
            { text: '⭐⭐⭐⭐ 4', callback_data: 'review_4' },
            { text: '⭐⭐⭐⭐⭐ 5', callback_data: 'review_5' }
          ],
          [
            { text: '🏠 На главную', callback_data: 'start' }
          ]
        ]
      }
    }
  );
};


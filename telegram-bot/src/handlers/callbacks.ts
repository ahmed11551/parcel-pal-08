import { Context } from 'telegraf';
import { startCommand } from '../commands/start';
import { helpCommand } from '../commands/help';
import { supportCommand } from '../commands/support';
import { reviewsCommand } from '../commands/reviews';
import telegramAPI from '../utils/api';
import { MINI_APP_URL } from '../index';

export const callbackHandler = async (ctx: Context) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;
  const telegramId = ctx.from?.id;

  await ctx.answerCbQuery();

  switch (data) {
    case 'start':
      await startCommand(ctx);
      break;

    case 'help':
      await helpCommand(ctx);
      break;

    case 'support':
      await supportCommand(ctx);
      break;

    case 'review':
      await reviewsCommand(ctx);
      break;

    case 'subscribe':
      if (telegramId) {
        try {
          // Здесь нужно будет связать с пользователем через API
          await ctx.reply(
            '🔔 Вы подписаны на уведомления!\n\n' +
            'Теперь вы будете получать:\n' +
            '• Уведомления о новых заданиях\n' +
            '• Обновления статуса доставки\n' +
            '• Важные новости платформы',
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
        } catch (error) {
          await ctx.reply('❌ Ошибка при подписке. Попробуйте позже.');
        }
      }
      break;

    case 'faq':
      await ctx.reply(
        `❓ *Часто задаваемые вопросы*\n\n` +
        `*Как создать задание?*\n` +
        `Откройте приложение, нажмите "Создать задание" и заполните форму.\n\n` +
        `*Как стать курьером?*\n` +
        `Найдите подходящее задание и нажмите "Стать курьером".\n\n` +
        `*Как происходит оплата?*\n` +
        `Оплата через эскроу. Деньги переводятся только после доставки.\n\n` +
        `*Что можно отправлять?*\n` +
        `Книги, документы, одежда, сувениры. Запрещены: наркотики, оружие, деньги.\n\n` +
        `Больше вопросов? Используйте /support`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💬 Поддержка', callback_data: 'support' }
              ],
              [
                { text: '🏠 На главную', callback_data: 'start' }
              ]
            ]
          }
        }
      );
      break;

    case 'review_1':
    case 'review_2':
    case 'review_3':
    case 'review_4':
    case 'review_5':
      const rating = parseInt(data.split('_')[1]);
      await ctx.reply(
        `Спасибо за оценку ${rating} ⭐!\n\n` +
        `Пожалуйста, напишите ваш отзыв:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ Отмена', callback_data: 'start' }
              ]
            ]
          }
        }
      );
      // Здесь можно сохранить состояние ожидания отзыва
      break;

    default:
      await ctx.reply('Неизвестная команда. Используйте /help');
  }
};


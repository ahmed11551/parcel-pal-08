import { Context } from 'telegraf';
import { startCommand } from '../commands/start.js';
import { helpCommand } from '../commands/help.js';
import { supportCommand } from '../commands/support.js';
import { reviewsCommand } from '../commands/reviews.js';
import telegramAPI from '../utils/api.js';
import { MINI_APP_URL, CHANNEL_USERNAME, REQUIRE_CHANNEL_SUBSCRIPTION, bot } from '../index.js';
import { checkChannelSubscription, getChannelLink } from '../utils/channel.js';
import { confirmPost, cancelPost } from '../commands/post.js';

// Хранилище состояний пользователей (в production использовать Redis)
const userStates = new Map<number, 'support' | 'review' | null>();
const pendingReviews = new Map<number, number>(); // telegramId -> rating

export const callbackHandler = async (ctx: Context) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;
  const telegramId = ctx.from?.id;

  await ctx.answerCbQuery();

  switch (data) {
    case 'start':
      await startCommand(ctx);
      break;

    case 'auth':
      if (telegramId) {
        const firstName = ctx.from?.first_name || 'Пользователь';
        const lastName = ctx.from?.last_name;
        const username = ctx.from?.username;

        try {
          const authResult = await telegramAPI.authSimple(
            telegramId,
            firstName,
            lastName,
            username
          );

          if (authResult.success) {
            await ctx.reply(
              '✅ *Вы успешно авторизованы!*\n\n' +
              'Теперь вы можете пользоваться всеми функциями SendBuddy.',
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
                      { text: '🏠 На главную', callback_data: 'start' }
                    ]
                  ]
                }
              }
            );
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          await ctx.reply(
            '❌ Ошибка при авторизации. Попробуйте еще раз через несколько секунд.',
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '🔄 Попробовать снова', callback_data: 'auth' }
                  ],
                  [
                    { text: '🏠 На главную', callback_data: 'start' }
                  ]
                ]
              }
            }
          );
        }
      }
      break;

    case 'help':
      await helpCommand(ctx);
      break;

    case 'support':
      if (telegramId) {
        userStates.set(telegramId, 'support');
      }
      await ctx.reply(
        '💬 *Поддержка SendBuddy*\n\n' +
        'Напишите ваш вопрос или проблему, и мы обязательно поможем!\n\n' +
        'Вы также можете связаться с нами:\n' +
        '📧 Email: sebiev9595@bk.ru\n' +
        '📱 Телефон: +7 (925) 940-94-04',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ Отмена', callback_data: 'cancel_support' }
              ]
            ]
          }
        }
      );
      break;

    case 'cancel_support':
      if (telegramId) {
        userStates.delete(telegramId);
      }
      await ctx.reply('Отменено. Используйте /help для списка команд.');
      break;

    case 'review':
      await reviewsCommand(ctx);
      break;

    case 'subscribe':
      if (telegramId) {
        try {
          // Сначала авторизуем пользователя (если еще не авторизован)
          const firstName = ctx.from?.first_name || 'Пользователь';
          const lastName = ctx.from?.last_name;
          const username = ctx.from?.username;
          
          try {
            await telegramAPI.authSimple(telegramId, firstName, lastName, username);
          } catch (authError) {
            // Игнорируем ошибку авторизации, продолжаем с подпиской
            console.warn('Auth error during subscribe (continuing anyway):', authError);
          }

          // Подписываем на уведомления
          await telegramAPI.subscribe(telegramId, 'all');
          
          await ctx.reply(
            '🔔 *Вы подписаны на уведомления!*\n\n' +
            'Теперь вы будете получать:\n' +
            '• Уведомления о новых заданиях\n' +
            '• Обновления статуса доставки\n' +
            '• Важные новости платформы',
            {
              parse_mode: 'Markdown',
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
          console.error('Subscribe error:', error);
          await ctx.reply('❌ Ошибка при подписке. Попробуйте позже.');
        }
      }
      break;

    case 'check_subscription':
      if (telegramId && CHANNEL_USERNAME) {
        try {
          const isSubscribed = await checkChannelSubscription(bot, telegramId, CHANNEL_USERNAME);
          
          if (isSubscribed) {
            await ctx.reply(
              '✅ *Отлично! Вы подписаны на канал.*\n\n' +
              'Теперь вы можете пользоваться всеми функциями SendBuddy!',
              {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '🏠 На главную', callback_data: 'start' }
                    ]
                  ]
                }
              }
            );
            // Перезапускаем команду start
            await startCommand(ctx);
          } else {
            await ctx.reply(
              '❌ *Вы еще не подписаны на канал.*\n\n' +
              'Пожалуйста, подпишитесь на наш канал, чтобы продолжить:\n' +
              `${CHANNEL_USERNAME}\n\n` +
              'После подписки нажмите кнопку "✅ Я подписался" еще раз.',
              {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '📢 Подписаться на канал',
                        url: getChannelLink(CHANNEL_USERNAME)
                      }
                    ],
                    [
                      {
                        text: '✅ Я подписался',
                        callback_data: 'check_subscription'
                      }
                    ]
                  ]
                }
              }
            );
          }
        } catch (error) {
          console.error('Check subscription error:', error);
          await ctx.reply('❌ Ошибка при проверке подписки. Попробуйте позже.');
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
      if (telegramId) {
        pendingReviews.set(telegramId, rating);
        userStates.set(telegramId, 'review');
      }
      await ctx.reply(
        `Спасибо за оценку ${rating} ⭐!\n\n` +
        `Пожалуйста, напишите ваш отзыв (или отправьте /skip чтобы пропустить):`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⏭ Пропустить', callback_data: 'skip_review' },
                { text: '❌ Отмена', callback_data: 'cancel_review' }
              ]
            ]
          }
        }
      );
      break;

    case 'skip_review':
      if (telegramId) {
        const rating = pendingReviews.get(telegramId);
        if (rating) {
          try {
            await telegramAPI.createReview(telegramId, rating, '');
            await ctx.reply('✅ Отзыв сохранен! Спасибо!');
          } catch (error) {
            await ctx.reply('❌ Ошибка при сохранении отзыва.');
          }
          pendingReviews.delete(telegramId);
          userStates.delete(telegramId);
        }
      }
      break;

    case 'cancel_review':
      if (telegramId) {
        pendingReviews.delete(telegramId);
        userStates.delete(telegramId);
      }
      await ctx.reply('Отменено. Используйте /help для списка команд.');
      break;

    default:
      await ctx.reply('Неизвестная команда. Используйте /help');
  }
};


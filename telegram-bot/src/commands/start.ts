import { Context } from 'telegraf';
import { MINI_APP_URL, CHANNEL_USERNAME, REQUIRE_CHANNEL_SUBSCRIPTION, bot } from '../index.js';
import telegramAPI from '../utils/api.js';
import { checkChannelSubscription, getChannelLink } from '../utils/channel.js';

export const startCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  const firstName = ctx.from?.first_name || 'Пользователь';
  const lastName = ctx.from?.last_name;
  const username = ctx.from?.username;

  if (!telegramId) {
    await ctx.reply('❌ Ошибка: не удалось получить данные пользователя');
    return;
  }

  // Проверяем подписку на канал (если требуется)
  if (REQUIRE_CHANNEL_SUBSCRIPTION && CHANNEL_USERNAME) {
    const isSubscribed = await checkChannelSubscription(bot, telegramId, CHANNEL_USERNAME);
    
    if (!isSubscribed) {
      await ctx.reply(
        `📢 *Подпишитесь на наш канал!*\n\n` +
        `Чтобы пользоваться всеми функциями SendBuddy, пожалуйста, подпишитесь на наш канал с новостями, акциями и полезной информацией.\n\n` +
        `После подписки нажмите кнопку ниже для проверки.`,
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
              ],
              [
                { text: '❓ Помощь', callback_data: 'help' }
              ]
            ]
          }
        }
      );
      return;
    }
  }

  // Авторизуем пользователя автоматически
  try {
    const authResult = await telegramAPI.authSimple(
      telegramId,
      firstName,
      lastName,
      username
    );

    if (authResult.success) {
      const channelText = CHANNEL_USERNAME 
        ? `\n📢 *Не забудьте подписаться на наш канал:* ${CHANNEL_USERNAME}\nТам новости, акции и полезная информация!\n\n`
        : '\n';

      await ctx.reply(
        `✅ *Вы успешно авторизованы!*\n\n` +
        `👋 Привет, ${firstName}!\n\n` +
        `Добро пожаловать в *SendBuddy* — платформу для передачи посылок через путешественников.\n\n` +
        `🚀 *Что я умею:*\n` +
        `• Открыть приложение SendBuddy\n` +
        `• Помочь с вопросами\n` +
        `• Связать с поддержкой\n` +
        `• Оставить отзыв\n` +
        `• Подписаться на уведомления${channelText}` +
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
              ],
              ...(CHANNEL_USERNAME ? [[
                {
                  text: '📢 Наш канал',
                  url: getChannelLink(CHANNEL_USERNAME)
                }
              ]] : [])
            ]
          }
        }
      );
    } else {
      throw new Error('Auth failed');
    }
  } catch (error: any) {
    console.error('Auth error:', error);
    const errorMessage = error?.response?.data?.error || error?.message || 'Неизвестная ошибка';
    
    await ctx.reply(
      `👋 Привет, ${firstName}!\n\n` +
      `Добро пожаловать в *SendBuddy*!\n\n` +
      `⚠️ Произошла ошибка при авторизации: ${errorMessage}\n\n` +
      `Попробуйте авторизоваться еще раз или обратитесь в поддержку.\n\n` +
      `Используйте /help для списка команд.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔐 Авторизоваться',
                callback_data: 'auth'
              }
            ],
            [
              { text: '❓ Помощь', callback_data: 'help' },
              { text: '💬 Поддержка', callback_data: 'support' }
            ]
          ]
        }
      }
    );
  }
};

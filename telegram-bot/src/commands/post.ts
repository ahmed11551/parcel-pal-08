import { Context } from 'telegraf';
import { CHANNEL_USERNAME, bot } from '../index.js';
import { publishToChannel } from '../utils/channel.js';

// Хранилище состояний для постинга (в production использовать Redis)
export const postingStates = new Map<number, 'waiting_message' | 'waiting_confirm'>();
const pendingPosts = new Map<number, string>();

export const postCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  
  // Проверка на админа
  const ADMIN_TELEGRAM_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id)) || [];
  
  if (!ADMIN_TELEGRAM_IDS.includes(telegramId || 0)) {
    await ctx.reply('❌ У вас нет доступа к этой команде.');
    return;
  }

  if (!CHANNEL_USERNAME) {
    await ctx.reply('❌ Канал не настроен. Установите TELEGRAM_CHANNEL_USERNAME.');
    return;
  }

  postingStates.set(telegramId, 'waiting_message');
  
  await ctx.reply(
    `📢 *Публикация в канал*\n\n` +
    `Напишите сообщение, которое хотите опубликовать в канале ${CHANNEL_USERNAME}\n\n` +
    `*Поддерживаемые форматы:*\n` +
    `• Markdown (жирный, курсив, ссылки)\n` +
    `• HTML\n\n` +
    `Отправьте /cancel чтобы отменить.`,
    {
      parse_mode: 'Markdown'
    }
  );
};

/**
 * Обработка сообщения для публикации в канал
 */
export async function handlePostMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const state = postingStates.get(telegramId);
  if (state !== 'waiting_message') return;

  const message = 'text' in ctx.message ? ctx.message.text : null;
  if (!message) {
    await ctx.reply('❌ Пожалуйста, отправьте текстовое сообщение.');
    return;
  }

  // Проверка на админа
  const ADMIN_TELEGRAM_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id)) || [];
  if (!ADMIN_TELEGRAM_IDS.includes(telegramId)) {
    postingStates.delete(telegramId);
    return;
  }

  // Сохраняем сообщение и переходим к подтверждению
  postingStates.set(telegramId, 'waiting_confirm');
  pendingPosts.set(telegramId, message);

  await ctx.reply(
    `📝 *Предпросмотр сообщения:*\n\n${message}\n\n` +
    `Отправить это сообщение в канал ${CHANNEL_USERNAME}?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Опубликовать', callback_data: 'confirm_post' },
            { text: '❌ Отменить', callback_data: 'cancel_post' }
          ]
        ]
      }
    }
  );
}

/**
 * Подтверждение публикации
 */
export async function confirmPost(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const state = postingStates.get(telegramId);
  if (state !== 'waiting_confirm') return;

  const pendingPost = pendingPosts.get(telegramId);
  if (!pendingPost) {
    await ctx.reply('❌ Сообщение не найдено. Начните заново с /post');
    postingStates.delete(telegramId);
    return;
  }

  try {
    await publishToChannel(bot, CHANNEL_USERNAME!, pendingPost);
    
    await ctx.reply(
      '✅ *Сообщение успешно опубликовано в канал!*\n\n' +
      `Канал: ${CHANNEL_USERNAME}`,
      {
        parse_mode: 'Markdown'
      }
    );

    postingStates.delete(telegramId);
    pendingPosts.delete(telegramId);
  } catch (error: any) {
    console.error('Error posting to channel:', error);
    await ctx.reply(
      `❌ Ошибка при публикации: ${error.message}\n\n` +
      `Проверьте что бот является администратором канала.`
    );
    postingStates.delete(telegramId);
  }
}

/**
 * Отмена публикации
 */
export async function cancelPost(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  postingStates.delete(telegramId);
  pendingPosts.delete(telegramId);

  await ctx.reply('❌ Публикация отменена.');
}


import { Context } from 'telegraf';
import telegramAPI from '../utils/api';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Хранилище состояний пользователей (в production использовать Redis)
const userStates = new Map<number, 'support' | 'review' | null>();
const pendingReviews = new Map<number, number>(); // telegramId -> rating

export const messageHandler = async (ctx: Context) => {
  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  if (!userId || !text) return;

  // Проверяем состояние пользователя
  const state = userStates.get(userId);

  if (state === 'support') {
    // Пользователь пишет сообщение в поддержку
    try {
      await telegramAPI.sendSupportMessage(userId, text);
      await ctx.reply(
        '✅ Ваше сообщение отправлено в поддержку!\n\n' +
        'Мы ответим вам в ближайшее время.\n\n' +
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
      userStates.delete(userId);
    } catch (error) {
      await ctx.reply('❌ Ошибка при отправке сообщения. Попробуйте позже.');
    }
    return;
  }

  if (state === 'review') {
    // Пользователь пишет текст отзыва
    const rating = pendingReviews.get(userId);
    
    if (rating) {
      try {
        await telegramAPI.createReview(userId, rating, text);
        await ctx.reply(
          '✅ Спасибо за ваш отзыв!\n\n' +
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
        pendingReviews.delete(userId);
        userStates.delete(userId);
      } catch (error) {
        await ctx.reply('❌ Ошибка при сохранении отзыва. Попробуйте позже.');
      }
    }
    return;
  }

  // Обычное сообщение - показываем помощь
  if (text.startsWith('/')) {
    // Команда обрабатывается отдельно
    return;
  }

  // Если это не команда, предлагаем помощь
  await ctx.reply(
    '👋 Привет! Я бот SendBuddy.\n\n' +
    'Используйте команды для работы со мной:\n' +
    '/start - Начать работу\n' +
    '/help - Помощь\n' +
    '/support - Поддержка\n' +
    '/reviews - Оставить отзыв\n' +
    '/tasks - Открыть задания',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❓ Помощь', callback_data: 'help' },
            { text: '💬 Поддержка', callback_data: 'support' }
          ],
          [
            { text: '🚀 Открыть приложение', web_app: { url: process.env.MINI_APP_URL || 'https://send-buddy.ru' } }
          ]
        ]
      }
    }
  );
};


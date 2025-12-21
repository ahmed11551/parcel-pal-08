import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { startCommand } from './commands/start.js';
import { helpCommand } from './commands/help.js';
import { supportCommand } from './commands/support.js';
import { reviewsCommand } from './commands/reviews.js';
import { statsCommand } from './commands/stats.js';
import { messageHandler } from './handlers/messages.js';
import { callbackHandler } from './handlers/callbacks.js';
import { startNotificationService } from './services/notifications.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://send-buddy.ru';

// Имя бота для логирования
const BOT_NAME = 'SendBuddyExpress_Bot';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не установлен!');
  console.error('💡 Установите переменную окружения TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

console.log(`🤖 Инициализация бота: ${BOT_NAME}`);
console.log(`📡 API URL: ${API_URL}`);
console.log(`🌐 Mini App URL: ${MINI_APP_URL}`);

const bot = new Telegraf(BOT_TOKEN);

// Команды
bot.command('start', startCommand);
bot.command('help', helpCommand);
bot.command('support', supportCommand);
bot.command('reviews', reviewsCommand);
bot.command('tasks', (ctx) => {
  ctx.reply('📦 Открываю задания...', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Открыть SendBuddy',
          web_app: { url: `${MINI_APP_URL}` }
        }
      ]]
    }
  });
});

// Обработчики
bot.on('message', messageHandler);
bot.on('callback_query', callbackHandler);

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка в боте:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// Запуск бота
const startBot = async () => {
  try {
    if (process.env.TELEGRAM_WEBHOOK_URL) {
      // Webhook режим
      await bot.telegram.setWebhook(process.env.TELEGRAM_WEBHOOK_URL);
      console.log('✅ Webhook установлен');
    } else {
      // Long polling режим
      await bot.launch();
      console.log('✅ Бот запущен (Long Polling)');
    }
    
    console.log(`✅ ${BOT_NAME} готов к работе!`);
    
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe();
    console.log(`📋 Бот: @${botInfo.username} (${botInfo.first_name})`);
    
    // Запускаем сервис уведомлений (проверка каждые 30 секунд)
    startNotificationService(30000);
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startBot();

export { bot, API_URL, MINI_APP_URL };


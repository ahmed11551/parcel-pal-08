import { Telegraf } from 'telegraf';

/**
 * Проверяет, подписан ли пользователь на канал
 * @param bot - Экземпляр бота
 * @param userId - Telegram ID пользователя
 * @param channelIdentifier - Username канала (@SendBuddyNews) или chat_id (для приватных каналов)
 * @returns true если подписан, false если нет
 */
export async function checkChannelSubscription(
  bot: Telegraf,
  userId: number,
  channelIdentifier: string
): Promise<boolean> {
  try {
    // Если это invite link (начинается с +), извлекаем chat_id из ссылки
    // или используем как есть если это username
    let channelId = channelIdentifier;
    
    // Если это username, добавляем @ если нужно
    if (!channelIdentifier.startsWith('+') && !channelIdentifier.startsWith('-')) {
      channelId = channelIdentifier.startsWith('@') 
        ? channelIdentifier 
        : `@${channelIdentifier}`;
    }
    // Если это invite link, нужно получить chat_id из ссылки
    // Для приватных каналов лучше использовать chat_id напрямую

    const member = await bot.telegram.getChatMember(channelId, userId);
    
    // Статусы: 'creator', 'administrator', 'member', 'restricted', 'left', 'kicked'
    return member.status === 'creator' || 
           member.status === 'administrator' || 
           member.status === 'member' ||
           member.status === 'restricted';
  } catch (error: any) {
    console.error('Error checking channel subscription:', error);
    
    // Если канал не найден или бот не админ - возвращаем true чтобы не блокировать
    if (error.response?.error_code === 400 || 
        error.response?.error_code === 403) {
      console.warn('Channel not found or bot is not admin, allowing access');
      return true;
    }
    
    return false;
  }
}

/**
 * Получает ссылку на канал
 * @param channelIdentifier - Username (@SendBuddyNews) или invite link (https://t.me/+...)
 */
export function getChannelLink(channelIdentifier: string): string {
  // Если это уже полная ссылка, возвращаем как есть
  if (channelIdentifier.startsWith('http')) {
    return channelIdentifier;
  }
  
  // Если это invite link формат (начинается с +), формируем ссылку
  if (channelIdentifier.startsWith('+')) {
    return `https://t.me/${channelIdentifier}`;
  }
  
  // Для username канала
  const username = channelIdentifier.startsWith('@') 
    ? channelIdentifier.slice(1) 
    : channelIdentifier;
  return `https://t.me/${username}`;
}


import { Telegraf } from 'telegraf';

/**
 * Проверяет, подписан ли пользователь на канал
 * @param bot - Экземпляр бота
 * @param userId - Telegram ID пользователя
 * @param channelUsername - Username канала (например: @SendBuddyNews)
 * @returns true если подписан, false если нет
 */
export async function checkChannelSubscription(
  bot: Telegraf,
  userId: number,
  channelUsername: string
): Promise<boolean> {
  try {
    // Убираем @ если есть
    const channelId = channelUsername.startsWith('@') 
      ? channelUsername 
      : `@${channelUsername}`;

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
 */
export function getChannelLink(channelUsername: string): string {
  const username = channelUsername.startsWith('@') 
    ? channelUsername.slice(1) 
    : channelUsername;
  return `https://t.me/${username}`;
}


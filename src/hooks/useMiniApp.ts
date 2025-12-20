import { useEffect, useState } from 'react';
import { isTelegramWebApp, getTelegramUser, initTelegramWebApp } from '@/lib/telegram';
import { isVKApp, initVKApp, getVKUser, getVKUserId } from '@/lib/vk';

export type MiniAppPlatform = 'telegram' | 'vk' | 'web';

interface MiniAppUser {
  id: string | number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  phone?: string;
}

export function useMiniApp() {
  const [platform, setPlatform] = useState<MiniAppPlatform>('web');
  const [user, setUser] = useState<MiniAppUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Проверяем Telegram
      if (isTelegramWebApp()) {
        const tg = initTelegramWebApp();
        if (tg) {
          setPlatform('telegram');
          const tgUser = getTelegramUser();
          if (tgUser) {
            setUser({
              id: tgUser.id,
              firstName: tgUser.first_name,
              lastName: tgUser.last_name,
              username: tgUser.username,
              photoUrl: tgUser.photo_url,
            });
          }
          setIsInitialized(true);
          return;
        }
      }

      // Проверяем VK
      if (isVKApp()) {
        const vkUser = await initVKApp();
        if (vkUser) {
          setPlatform('vk');
          setUser({
            id: vkUser.id || getVKUserId() || 0,
            firstName: vkUser.first_name || '',
            lastName: vkUser.last_name,
            photoUrl: vkUser.photo_200 || vkUser.photo_100,
          });
        } else {
          // Пытаемся получить ID из URL
          const userId = getVKUserId();
          if (userId) {
            setPlatform('vk');
            setUser({
              id: userId,
              firstName: 'Пользователь',
            });
          }
        }
        setIsInitialized(true);
        return;
      }

      // Обычный веб
      setPlatform('web');
      setIsInitialized(true);
    };

    init();
  }, []);

  return {
    platform,
    user,
    isInitialized,
    isTelegram: platform === 'telegram',
    isVK: platform === 'vk',
    isWeb: platform === 'web',
  };
}


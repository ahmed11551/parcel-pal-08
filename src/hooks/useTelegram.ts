import { useEffect, useState } from 'react';
import { 
  isTelegramWebApp, 
  initTelegramWebApp, 
  getTelegramUser, 
  getTelegramInitData,
  setupTelegramBackButton,
  setupTelegramMainButton
} from '@/lib/telegram';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTelegram = async () => {
      if (isTelegramWebApp()) {
        setIsTelegram(true);
        
        // Инициализируем Telegram Web App
        const tg = initTelegramWebApp();
        if (tg) {
          // Получаем данные пользователя
          const user = getTelegramUser();
          if (user) {
            setTelegramUser(user);
            
            // Пытаемся авторизоваться через Telegram
            const initData = getTelegramInitData();
            if (initData) {
              try {
                setLoading(true);
                const response = await api.telegramAuth(initData);
                
                if (response.success && response.token) {
                  // Сохраняем токен
                  localStorage.setItem('token', response.token);
                  setIsAuthenticated(true);
                  
                  // Обновляем пользователя в API клиенте
                  if (response.user) {
                    localStorage.setItem('user', JSON.stringify(response.user));
                  }
                } else if (response.needsPhoneAuth) {
                  // Нужна авторизация по телефону
                  setIsAuthenticated(false);
                }
              } catch (error) {
                console.error('Telegram auth error:', error);
                setIsAuthenticated(false);
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };

    checkTelegram();
  }, []);

  const linkTelegramAccount = async () => {
    if (!isTelegram) return false;
    
    const initData = getTelegramInitData();
    if (!initData) return false;

    try {
      const response = await api.linkTelegram(initData);
      return response.success;
    } catch (error) {
      console.error('Link Telegram error:', error);
      return false;
    }
  };

  const subscribe = async (subscriptionType?: string) => {
    if (!telegramUser) return false;
    
    try {
      const response = await api.subscribeTelegram(telegramUser.id, subscriptionType);
      return response.success;
    } catch (error) {
      console.error('Subscribe error:', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!telegramUser) return false;
    
    try {
      const response = await api.unsubscribeTelegram(telegramUser.id);
      return response.success;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return false;
    }
  };

  const sendSupportMessage = async (message: string) => {
    if (!telegramUser) return false;
    
    try {
      const response = await api.sendSupportMessage(telegramUser.id, message);
      return response.success;
    } catch (error) {
      console.error('Send support message error:', error);
      return false;
    }
  };

  const createReview = async (rating: number, text?: string) => {
    if (!telegramUser) return false;
    
    try {
      const response = await api.createTelegramReview(telegramUser.id, rating, text);
      return response.success;
    } catch (error) {
      console.error('Create review error:', error);
      return false;
    }
  };

  return {
    isTelegram,
    telegramUser,
    isAuthenticated,
    loading,
    linkTelegramAccount,
    subscribe,
    unsubscribe,
    sendSupportMessage,
    createReview,
  };
}

export function useTelegramBackButton(onBack: () => void) {
  useEffect(() => {
    if (isTelegramWebApp()) {
      return setupTelegramBackButton(onBack);
    }
  }, [onBack]);
}

export function useTelegramMainButton(text: string, onClick: () => void) {
  useEffect(() => {
    if (isTelegramWebApp()) {
      return setupTelegramMainButton(text, onClick);
    }
  }, [text, onClick]);
}


import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { isTelegramWebApp, getTelegramUser, getTelegramInitData } from '@/lib/telegram';
import { isVKApp, getVKUser, getVKUserId } from '@/lib/vk';
import { getToken, storeToken, clearToken, getUser, storeUser, hasValidToken } from '@/lib/token-storage';

interface User {
  id: string;
  phone: string;
  name?: string;
  avatar?: string;
  rating: number;
  completedDeliveries: number;
  sentDeliveries: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Проверяем Mini Apps для автоматического входа
      let miniAppUser = null;
      let platform: 'telegram' | 'vk' | null = null;

      // Проверяем Telegram
      if (isTelegramWebApp()) {
        const tgUser = getTelegramUser();
        if (tgUser) {
          miniAppUser = {
            id: String(tgUser.id),
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
            photoUrl: tgUser.photo_url,
          };
          platform = 'telegram';
        }
      }

      // Проверяем VK
      if (!miniAppUser && isVKApp()) {
        const vkUser = await getVKUser();
        if (vkUser) {
          miniAppUser = {
            id: String(vkUser.id || getVKUserId() || ''),
            firstName: vkUser.first_name || 'Пользователь',
            lastName: vkUser.last_name,
            photoUrl: vkUser.photo_200 || vkUser.photo_100,
          };
          platform = 'vk';
        }
      }

      // Если есть пользователь из Mini App и нет сохраненного токена
      if (miniAppUser && platform && !hasValidToken()) {
        // Можно предложить автоматический вход
        // Пока оставляем как есть - пользователь может войти через соцсеть
      }

      // Проверяем, есть ли сохраненный токен
      const token = getToken();
      const savedUser = getUser();

      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          // Проверяем валидность токена
          authAPI.getMe()
            .then((response) => {
              setUser(response.data);
              storeUser(response.data);
            })
            .catch(() => {
              // Токен невалиден
              clearToken();
              setUser(null);
            })
            .finally(() => setIsLoading(false));
        } catch {
          clearToken();
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    storeToken(token);
    storeUser(userData);
    setUser(userData);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    storeUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


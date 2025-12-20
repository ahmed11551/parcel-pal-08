// VK Mini App integration
// VK Bridge будет загружен динамически, так как это внешний скрипт

declare global {
  interface Window {
    vkBridge?: {
      send: (method: string, params?: Record<string, any>) => Promise<any>;
      subscribe: (event: string, callback: (data: any) => void) => void;
      unsubscribe: (event: string, callback: (data: any) => void) => void;
      support: (method: string) => boolean;
    };
  }
}

export const isVKApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Проверяем по URL параметрам
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('vk_platform') || urlParams.has('vk_user_id')) {
    return true;
  }
  
  // Проверяем наличие VK Bridge
  return !!window.vkBridge;
};

export const initVKApp = async (): Promise<any> => {
  if (!isVKApp()) return null;

  try {
    // Загружаем VK Bridge если еще не загружен
    if (!window.vkBridge) {
      await loadVKBridge();
    }

    if (window.vkBridge) {
      // Инициализируем приложение
      await window.vkBridge.send('VKWebAppInit');
      
      // Получаем информацию о пользователе
      const userInfo = await window.vkBridge.send('VKWebAppGetUserInfo');
      return userInfo;
    }
  } catch (error) {
    console.error('VK Bridge initialization error:', error);
  }
  
  return null;
};

const loadVKBridge = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.vkBridge) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkontakte/vk-bridge@2.3.0/dist/browser.min.js';
    script.onload = () => {
      // VK Bridge загружается в window
      if (window.vkBridge) {
        resolve();
      } else {
        reject(new Error('VK Bridge failed to load'));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const getVKUser = async () => {
  if (!isVKApp() || !window.vkBridge) return null;

  try {
    const userInfo = await window.vkBridge.send('VKWebAppGetUserInfo');
    return userInfo;
  } catch (error) {
    console.error('Error getting VK user:', error);
    return null;
  }
};

export const getVKUserId = (): number | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('vk_user_id');
  return userId ? parseInt(userId, 10) : null;
};


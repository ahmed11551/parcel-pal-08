// Telegram Web App SDK integration
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup: (params: { text?: string }, callback?: (data: string) => void) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean) => void) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void;
          getItem: (key: string, callback?: (error: Error | null, value: string | null) => void) => void;
          getItems: (keys: string[], callback?: (error: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void;
          removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void;
          getKeys: (callback?: (error: Error | null, keys: string[]) => void) => void;
        };
        BiometricManager: {
          init: (params: { request_id: string }, callback?: (success: boolean) => void) => void;
          openSettings: () => void;
          updateBiometricToken: (token: string) => void;
        };
        isVersionAtLeast: (version: string) => boolean;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendEvent: (eventType: string, eventData: Record<string, unknown>) => void;
        receiveEvent: (eventType: string, eventHandler: (eventData: Record<string, unknown>) => void) => void;
        invoiceClosed: (callback: (url: string, status: string) => void) => void;
        popupClosed: (callback: (buttonId: string) => void) => void;
        qrTextReceived: (callback: (data: string) => void) => void;
        clipboardTextReceived: (callback: (data: string) => void) => void;
        writeAccessRequested: (callback: (granted: boolean) => void) => void;
        contactRequested: (callback: (granted: boolean) => void) => void;
      };
    };
  }
}

export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
};

export const initTelegramWebApp = () => {
  if (isTelegramWebApp()) {
    const tg = window.Telegram!.WebApp;
    tg.ready();
    tg.expand();
    return tg;
  }
  return null;
};

export const getTelegramUser = () => {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp.initDataUnsafe.user;
  }
  return null;
};

export const getTelegramInitData = () => {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp.initData;
  }
  return null;
};

export const setupTelegramBackButton = (onBack: () => void) => {
  if (isTelegramWebApp()) {
    const tg = window.Telegram!.WebApp;
    tg.BackButton.show();
    tg.BackButton.onClick(onBack);
    return () => {
      tg.BackButton.offClick(onBack);
      tg.BackButton.hide();
    };
  }
  return () => {};
};

export const setupTelegramMainButton = (text: string, onClick: () => void) => {
  if (isTelegramWebApp()) {
    const tg = window.Telegram!.WebApp;
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
    return () => {
      tg.MainButton.offClick(onClick);
      tg.MainButton.hide();
    };
  }
  return () => {};
};

// Применение темы Telegram к приложению
export const applyTelegramTheme = () => {
  if (isTelegramWebApp()) {
    const tg = window.Telegram!.WebApp;
    const theme = tg.themeParams;
    
    if (theme.bg_color) {
      document.documentElement.style.setProperty('--telegram-bg-color', theme.bg_color);
    }
    if (theme.text_color) {
      document.documentElement.style.setProperty('--telegram-text-color', theme.text_color);
    }
    if (theme.button_color) {
      document.documentElement.style.setProperty('--telegram-button-color', theme.button_color);
    }
    if (theme.button_text_color) {
      document.documentElement.style.setProperty('--telegram-button-text-color', theme.button_text_color);
    }
    
    // Применяем цветовую схему
    if (tg.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

// Инициализация при загрузке приложения
if (typeof window !== 'undefined') {
  if (isTelegramWebApp()) {
    const tg = initTelegramWebApp();
    if (tg) {
      applyTelegramTheme();
      
      // Слушаем изменения темы
      tg.onEvent('themeChanged', applyTelegramTheme);
    }
  }
}


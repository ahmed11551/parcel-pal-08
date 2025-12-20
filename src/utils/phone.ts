/**
 * Форматирование и валидация телефонных номеров
 */

/**
 * Нормализует номер телефона (убирает все кроме цифр)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Форматирует номер телефона для отображения
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 11 && normalized.startsWith('7')) {
    // Российский номер: +7 (999) 123-45-67
    return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9)}`;
  } else if (normalized.length === 10) {
    // Номер без кода страны: (999) 123-45-67
    return `+7 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 8)}-${normalized.slice(8)}`;
  }
  
  return phone;
}

/**
 * Валидирует номер телефона
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Российский номер: 11 цифр (начинается с 7) или 10 цифр
  return (normalized.length === 11 && normalized.startsWith('7')) || normalized.length === 10;
}

/**
 * Преобразует номер в формат для API (+7...)
 */
export function formatPhoneForAPI(phone: string): string {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 10) {
    return `+7${normalized}`;
  } else if (normalized.length === 11 && normalized.startsWith('7')) {
    return `+${normalized}`;
  } else if (normalized.length === 11 && normalized.startsWith('8')) {
    return `+7${normalized.slice(1)}`;
  }
  
  return phone.startsWith('+') ? phone : `+${normalized}`;
}


/**
 * Список аэропортов России
 */

export interface Airport {
  code: string;
  name: string;
  city: string;
}

export const airports: Airport[] = [
  // Москва
  { code: "SVO", name: "Шереметьево", city: "Москва" },
  { code: "DME", name: "Домодедово", city: "Москва" },
  { code: "VKO", name: "Внуково", city: "Москва" },
  
  // Санкт-Петербург
  { code: "LED", name: "Пулково", city: "Санкт-Петербург" },
  
  // Поволжье
  { code: "KZN", name: "Казань", city: "Казань" },
  { code: "UFA", name: "Уфа", city: "Уфа" },
  { code: "KUF", name: "Курумоч", city: "Самара" },
  { code: "NNN", name: "Стригино", city: "Нижний Новгород" },
  { code: "NSK", name: "Норильск", city: "Норильск" },
  
  // Урал
  { code: "SVX", name: "Кольцово", city: "Екатеринбург" },
  { code: "CEK", name: "Челябинск", city: "Челябинск" },
  
  // Сибирь
  { code: "OVB", name: "Толмачево", city: "Новосибирск" },
  { code: "KJA", name: "Емельяново", city: "Красноярск" },
  { code: "IKT", name: "Иркутск", city: "Иркутск" },
  { code: "OMS", name: "Омск", city: "Омск" },
  { code: "TOF", name: "Богашево", city: "Томск" },
  { code: "KRR", name: "Пашковский", city: "Краснодар" },
  
  // Юг России
  { code: "AER", name: "Сочи", city: "Сочи" },
  { code: "ROV", name: "Платов", city: "Ростов-на-Дону" },
  { code: "AAQ", name: "Витязево", city: "Анапа" },
  { code: "GDZ", name: "Геленджик", city: "Геленджик" },
  { code: "MCX", name: "Махачкала", city: "Махачкала" },
  { code: "NAL", name: "Нальчик", city: "Нальчик" },
  
  // Северный Кавказ
  { code: "GRV", name: "Грозный (Северный)", city: "Грозный" },
  { code: "IGT", name: "Магас (им. С.С. Осканова)", city: "Магас" },
  { code: "MRV", name: "Минеральные Воды", city: "Минеральные Воды" },
  { code: "STW", name: "Ставрополь", city: "Ставрополь" },
  
  // Дальний Восток
  { code: "VVO", name: "Владивосток", city: "Владивосток" },
  { code: "KHV", name: "Хабаровск", city: "Хабаровск" },
  { code: "YKS", name: "Якутск", city: "Якутск" },
  { code: "PKC", name: "Петропавловск-Камчатский", city: "Петропавловск-Камчатский" },
  { code: "UUS", name: "Южно-Сахалинск", city: "Южно-Сахалинск" },
  { code: "BQS", name: "Игнатьево", city: "Благовещенск" },
  // Центральная Россия
  { code: "VOR", name: "Воронеж", city: "Воронеж" },
  { code: "LPK", name: "Липецк", city: "Липецк" },
  { code: "TLL", name: "Тула", city: "Тула" },
  { code: "KLD", name: "Мигалово", city: "Тверь" },
  { code: "IWA", name: "Иваново", city: "Иваново" },
  { code: "BZK", name: "Брянск", city: "Брянск" },
  { code: "KLF", name: "Калуга", city: "Калуга" },
  
  // Северо-Запад
  { code: "KGD", name: "Храброво", city: "Калининград" },
  { code: "ARH", name: "Талаги", city: "Архангельск" },
  { code: "MMK", name: "Мурманск", city: "Мурманск" },
  { code: "PES", name: "Бесовец", city: "Петрозаводск" },
  
  // Другие крупные города
  { code: "SCW", name: "Сыктывкар", city: "Сыктывкар" },
  { code: "ULV", name: "Ульяновск", city: "Ульяновск" },
  { code: "RGK", name: "Горно-Алтайск", city: "Горно-Алтайск" },
  { code: "ABA", name: "Абакан", city: "Абакан" },
  { code: "NOZ", name: "Спиченково", city: "Новокузнецк" },
  { code: "BAX", name: "Барнаул", city: "Барнаул" },
];

/**
 * Получить аэропорт по коду
 */
export function getAirportByCode(code: string): Airport | undefined {
  return airports.find(airport => airport.code === code.toUpperCase());
}

/**
 * Получить список аэропортов для конкретного города
 */
export function getAirportsByCity(city: string): Airport[] {
  return airports.filter(airport => 
    airport.city.toLowerCase().includes(city.toLowerCase())
  );
}

/**
 * Поиск аэропортов по запросу (код, название, город)
 */
export function searchAirports(query: string): Airport[] {
  const lowerQuery = query.toLowerCase();
  return airports.filter(airport =>
    airport.code.toLowerCase().includes(lowerQuery) ||
    airport.name.toLowerCase().includes(lowerQuery) ||
    airport.city.toLowerCase().includes(lowerQuery)
  );
}


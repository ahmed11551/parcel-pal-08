import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  Camera, 
  MapPin, 
  Calendar, 
  Package, 
  DollarSign,
  Info,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

const sizeOptions = [
  { value: "S", label: "Маленький", description: "До 1 кг, помещается в карман" },
  { value: "M", label: "Средний", description: "1-3 кг, помещается в сумку" },
  { value: "L", label: "Большой", description: "3-5 кг, требует отдельного места" },
];

const airports = [
  { code: "SVO", name: "Шереметьево", city: "Москва" },
  { code: "DME", name: "Домодедово", city: "Москва" },
  { code: "VKO", name: "Внуково", city: "Москва" },
  { code: "LED", name: "Пулково", city: "Санкт-Петербург" },
  { code: "KZN", name: "Казань", city: "Казань" },
  { code: "SVX", name: "Кольцово", city: "Екатеринбург" },
  { code: "AER", name: "Сочи", city: "Сочи" },
  { code: "ROV", name: "Платов", city: "Ростов-на-Дону" },
];

export default function CreateTaskPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    size: "",
    estimatedValue: "",
    fromAirport: "",
    fromPoint: "",
    toAirport: "",
    toPoint: "",
    dateFrom: "",
    dateTo: "",
    reward: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.size;
      case 2:
        return formData.fromAirport && formData.toAirport;
      case 3:
        return formData.dateFrom && formData.dateTo && formData.reward;
      default:
        return false;
    }
  };

  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s
                      ? "gradient-hero text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 md:w-32 h-1 mx-2 rounded ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-md">
            {/* Step 1: Item Details */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Информация о посылке
                </h2>
                <p className="text-muted-foreground mb-8">
                  Опишите, что нужно передать
                </p>

                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Фото посылки *
                  </label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Нажмите, чтобы загрузить фото
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Название *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Книги для учебы"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Описание *
                  </label>
                  <textarea
                    placeholder="Опишите содержимое посылки"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Size */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Размер *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {sizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleInputChange("size", option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.size === option.value
                            ? "border-primary bg-primary-light"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-bold text-foreground">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Value */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Оценочная стоимость (₽)
                  </label>
                  <input
                    type="number"
                    placeholder="Для страховки"
                    value={formData.estimatedValue}
                    onChange={(e) => handleInputChange("estimatedValue", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Максимум 10 000 ₽ для доставки через платформу
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Route */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Маршрут доставки
                </h2>
                <p className="text-muted-foreground mb-8">
                  Укажите аэропорты отправления и прибытия
                </p>

                {/* From */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Аэропорт отправления *
                  </label>
                  <select
                    value={formData.fromAirport}
                    onChange={(e) => handleInputChange("fromAirport", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите аэропорт</option>
                    {airports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.city} — {airport.name} ({airport.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Место встречи в аэропорту
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Стойка информации, терминал D"
                    value={formData.fromPoint}
                    onChange={(e) => handleInputChange("fromPoint", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* To */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Аэропорт назначения *
                  </label>
                  <select
                    value={formData.toAirport}
                    onChange={(e) => handleInputChange("toAirport", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите аэропорт</option>
                    {airports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.city} — {airport.name} ({airport.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Место встречи в аэропорту
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Зона прилета, выход 3"
                    value={formData.toPoint}
                    onChange={(e) => handleInputChange("toPoint", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Dates & Reward */}
            {step === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Сроки и вознаграждение
                </h2>
                <p className="text-muted-foreground mb-8">
                  Укажите желаемые даты доставки
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Дата от *
                    </label>
                    <input
                      type="date"
                      value={formData.dateFrom}
                      onChange={(e) => handleInputChange("dateFrom", e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Дата до *
                    </label>
                    <input
                      type="date"
                      value={formData.dateTo}
                      onChange={(e) => handleInputChange("dateTo", e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Вознаграждение курьеру (₽) *
                  </label>
                  <input
                    type="number"
                    placeholder="Рекомендуется: 1500 - 3000 ₽"
                    value={formData.reward}
                    onChange={(e) => handleInputChange("reward", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Комиссия платформы 15% — {formData.reward ? Math.round(Number(formData.reward) * 0.15) : 0} ₽
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-muted p-6 rounded-xl mb-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Итого к оплате
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Вознаграждение курьеру</span>
                      <span className="text-foreground">{formData.reward || 0} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Комиссия платформы (15%)</span>
                      <span className="text-foreground">{formData.reward ? Math.round(Number(formData.reward) * 0.15) : 0} ₽</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Итого</span>
                        <span className="text-primary">{formData.reward ? Math.round(Number(formData.reward) * 1.15) : 0} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  Назад
                </Button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!isStepValid()}
                >
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  disabled={!isStepValid()}
                >
                  Опубликовать задание
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout/Layout";
import { 
  Shield, 
  CheckCircle2, 
  Lock, 
  UserCheck,
  CreditCard,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const safetyFeatures = [
  {
    icon: UserCheck,
    title: "Верификация пользователей",
    description: "Все пользователи проходят проверку по номеру телефона. Мы проверяем подлинность каждого аккаунта.",
  },
  {
    icon: CreditCard,
    title: "Эскроу-платежи",
    description: "Деньги хранятся на защищенном счете и переводятся курьеру только после подтверждения доставки получателем.",
  },
  {
    icon: Shield,
    title: "Система рейтингов",
    description: "Каждый пользователь имеет рейтинг на основе отзывов. Это помогает выбрать надежного курьера или отправителя.",
  },
  {
    icon: MessageCircle,
    title: "Встроенный чат",
    description: "Общайтесь с курьером или отправителем прямо в приложении. Все сообщения сохраняются для безопасности.",
  },
  {
    icon: Lock,
    title: "Защита данных",
    description: "Ваши личные данные защищены и не передаются третьим лицам. Мы используем современные методы шифрования.",
  },
  {
    icon: CheckCircle2,
    title: "Поддержка 24/7",
    description: "Наша служба поддержки работает круглосуточно и готова помочь в любой ситуации.",
  },
];

const prohibitedItems = [
  "Наркотические вещества и психотропные препараты",
  "Оружие и боеприпасы",
  "Деньги и ценные бумаги",
  "Ювелирные изделия и драгоценности",
  "Электроника дороже 10 000 ₽",
  "Скоропортящиеся продукты",
  "Животные",
  "Опасные химические вещества",
];

const allowedItems = [
  "Книги и документы",
  "Одежда и аксессуары",
  "Сувениры и подарки",
  "Ключи (кроме автомобильных)",
  "Мелкая электроника (наушники, кабели и т.д.)",
  "Косметика и парфюмерия",
  "Медикаменты (не рецептурные)",
];

export default function SafetyPage() {
  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <div className="w-20 h-20 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Безопасность
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ваша безопасность — наш приоритет. Мы используем современные технологии для защиты всех участников платформы.
            </p>
          </div>

          {/* Safety Features */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {safetyFeatures.map((feature) => (
              <div key={feature.title} className="bg-card p-6 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Allowed Items */}
          <div className="bg-card p-8 rounded-2xl shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              Разрешенные категории
            </h2>
            <ul className="space-y-3">
              {allowedItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prohibited Items */}
          <div className="bg-card p-8 rounded-2xl shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-destructive" />
              Запрещенные категории
            </h2>
            <ul className="space-y-3">
              {prohibitedItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-destructive flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Важно:</strong> Отправка запрещенных предметов может повлечь за собой юридическую ответственность. При обнаружении таких предметов мы оставляем за собой право заблокировать аккаунт и передать информацию в соответствующие органы.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-card p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Рекомендации по безопасности</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Проверяйте рейтинг</h3>
                  <p className="text-muted-foreground text-sm">Перед выбором курьера или отправителя обязательно проверьте его рейтинг и количество выполненных доставок.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Общайтесь в приложении</h3>
                  <p className="text-muted-foreground text-sm">Используйте встроенный чат для общения. Это поможет в случае споров и обеспечит безопасность переписки.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Встречайтесь в публичных местах</h3>
                  <p className="text-muted-foreground text-sm">Договаривайтесь о встрече в аэропорту в указанных местах. Это безопаснее для всех участников.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Подтверждайте получение</h3>
                  <p className="text-muted-foreground text-sm">Не забудьте подтвердить получение посылки в приложении. Это разблокирует платеж курьеру.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Есть вопросы по безопасности?</p>
            <Button variant="outline" asChild>
              <Link to="/how-it-works">Узнать больше</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}


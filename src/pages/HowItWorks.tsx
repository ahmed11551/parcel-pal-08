import { Layout } from "@/components/layout/Layout";
import { 
  Package, 
  Users, 
  CreditCard, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Package,
    title: "Создайте задание",
    description: "Сфотографируйте посылку, укажите маршрут и предложите вознаграждение",
  },
  {
    icon: Users,
    title: "Найдите курьера",
    description: "Путешественники откликаются на ваше задание — выберите лучшего",
  },
  {
    icon: CreditCard,
    title: "Безопасная сделка",
    description: "Оплата через эскроу — деньги переводятся только после доставки",
  },
  {
    icon: CheckCircle2,
    title: "Получите посылку",
    description: "Встретьтесь в аэропорту и подтвердите получение в приложении",
  },
];

export default function HowItWorksPage() {
  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-6 sm:py-8 md:py-12">
        <div className="container max-w-4xl px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Как это работает
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Простой процесс от создания задания до получения посылки
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {steps.map((step, index) => (
              <div key={step.title} className="relative group">
                <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-hero rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:shadow-glow transition-shadow">
                    <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-primary mb-2">Шаг {index + 1}</div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Часто задаваемые вопросы</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Сколько стоит доставка?</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Вы сами устанавливаете вознаграждение для курьера. Обычно это 1500-3000 рублей в зависимости от размера и срочности. Комиссия платформы составляет 15%.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Как обеспечивается безопасность?</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Все пользователи проходят верификацию по номеру телефона. Платежи проходят через эскроу-систему, деньги переводятся курьеру только после подтверждения доставки. Также работает система рейтингов.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Что можно отправлять?</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Разрешены книги, документы, одежда, сувениры, ключи (кроме автомобильных), мелкая электроника. Запрещены наркотики, оружие, деньги, ювелирные изделия и техника дороже 10 000 ₽.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Как быстро происходит доставка?</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Обычно 1-2 дня, в зависимости от расписания рейсов курьера. Это намного быстрее обычной почты.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/create-task">
                Создать задание
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}


import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Package, 
  Users, 
  CreditCard, 
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  MessageCircle
} from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Создайте задание",
    description: "Сфотографируйте посылку, укажите маршрут и предложите вознаграждение курьеру",
  },
  {
    icon: Users,
    title: "Найдите курьера",
    description: "Путешественники откликаются на ваше задание — выберите лучшего по рейтингу",
  },
  {
    icon: CreditCard,
    title: "Безопасная сделка",
    description: "Оплата через эскроу — деньги переводятся только после подтверждения доставки",
  },
  {
    icon: CheckCircle2,
    title: "Получите посылку",
    description: "Встретьтесь в аэропорту и подтвердите получение в приложении",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Быстрее почты",
    description: "Доставка за 1-2 дня вместо недели через обычные службы",
  },
  {
    icon: Shield,
    title: "Безопасно",
    description: "Верификация пользователей, рейтинги и эскроу-платежи",
  },
  {
    icon: CreditCard,
    title: "Выгодно",
    description: "Стоимость ниже экспресс-доставки, курьер получает вознаграждение",
  },
  {
    icon: MessageCircle,
    title: "Прозрачно",
    description: "Встроенный чат и отслеживание статуса в реальном времени",
  },
];

export default function HowItWorksPage() {
  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Как это работает
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Простой процесс от создания задания до получения посылки
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {steps.map((step, index) => (
              <div 
                key={step.title} 
                className="relative group"
              >
                <div className="bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
                  <div className="w-14 h-14 gradient-hero rounded-xl flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">Шаг {index + 1}</div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-card rounded-2xl shadow-md p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Почему выбирают SendBuddy
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Готовы начать?
            </h2>
            <p className="text-muted-foreground mb-6">
              Присоединяйтесь к тысячам пользователей, которые уже используют SendBuddy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/register">
                  Создать аккаунт
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/tasks">
                  Посмотреть задания
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


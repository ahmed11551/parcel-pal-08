import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { 
  Plane, 
  Package, 
  Shield, 
  Star, 
  ArrowRight, 
  CheckCircle2,
  Users,
  Clock,
  CreditCard,
  MessageCircle
} from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";

const stats = [
  { value: "10K+", label: "Успешных доставок" },
  { value: "5K+", label: "Путешественников" },
  { value: "4.9", label: "Средний рейтинг" },
  { value: "50+", label: "Городов" },
];

const howItWorks = [
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

const testimonials = [
  {
    name: "Алексей М.",
    role: "Отправитель",
    rating: 5,
    text: "Отправил важные документы из Москвы в Питер за один день. Курьер был очень вежливый и пунктуальный!",
    avatar: "А",
  },
  {
    name: "Мария К.",
    role: "Путешественник",
    rating: 5,
    text: "Летаю часто по работе. SendBuddy помогает компенсировать расходы на билеты. Очень удобно!",
    avatar: "М",
  },
  {
    name: "Дмитрий С.",
    role: "Отправитель",
    rating: 5,
    text: "Сервис просто спас, когда нужно было срочно передать ключи родителям в другой город.",
    avatar: "Д",
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-subtle">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Безопасная P2P доставка
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Передайте посылку{" "}
                <span className="text-gradient">с попутчиком</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                Быстрая и выгодная доставка через путешественников. Безопасные сделки, верифицированные пользователи.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" variant="hero" asChild>
                  <Link to="/create-task">
                    Отправить посылку
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/tasks">
                    Стать курьером
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <img 
                src={heroImage} 
                alt="SendBuddy - P2P доставка" 
                className="w-full rounded-2xl shadow-lg"
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center p-6 bg-card rounded-2xl shadow-sm animate-fade-up"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-32 bg-card">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Как это работает
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Простой процесс от создания задания до получения посылки
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div 
                key={step.title} 
                className="relative group"
              >
                <div className="bg-background p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
                  <div className="w-14 h-14 gradient-hero rounded-xl flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">Шаг {index + 1}</div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-32 gradient-subtle">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Почему выбирают{" "}
                <span className="text-gradient">SendBuddy</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Мы создали платформу, которая делает передачу посылок безопасной и выгодной для всех участников
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
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
            
            <div className="bg-card p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-6">Разрешенные категории</h3>
              <ul className="space-y-4">
                {[
                  "Книги и документы",
                  "Одежда и аксессуары",
                  "Сувениры и подарки",
                  "Ключи (кроме автомобильных)",
                  "Мелкая электроника (наушники, кабели)",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">Важно:</strong> Запрещены наркотики, оружие, деньги, ювелирные изделия и техника дороже 10 000 ₽
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-card">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Отзывы пользователей
            </h2>
            <p className="text-muted-foreground text-lg">
              Что говорят о нас наши пользователи
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.name} 
                className="bg-background p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-muted-foreground text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 gradient-hero">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Готовы начать?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам пользователей, которые уже используют SendBuddy для быстрой и безопасной доставки
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="hero-outline" asChild>
              <Link to="/register">
                Создать аккаунт
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

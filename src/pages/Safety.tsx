import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Shield,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  MessageSquare,
  ArrowRight,
  AlertTriangle
} from "lucide-react";

const safetyFeatures = [
  {
    icon: UserCheck,
    title: "Верификация пользователей",
    description: "Все пользователи проходят верификацию по телефону. Можно привязать профиль Telegram или VK для дополнительной безопасности.",
  },
  {
    icon: CreditCard,
    title: "Эскроу-платежи",
    description: "Деньги блокируются на счету платформы и переводятся курьеру только после подтверждения доставки. Комиссия 15%.",
  },
  {
    icon: MessageSquare,
    title: "Встроенный чат",
    description: "Общение происходит только через платформу. Запрещено обмениваться контактами до завершения поездки.",
  },
  {
    icon: Shield,
    title: "Система рейтингов",
    description: "После каждой доставки пользователи оставляют отзывы и ставят рейтинг. Это помогает выбрать надежного курьера.",
  },
];

const allowedItems = [
  "Книги и документы (кроме паспортов и банковских карт)",
  "Небрендовая одежда и аксессуары",
  "Сувениры",
  "Ключи (кроме автомобильных)",
  "Мелкая электроника (наушники, кабели) с лимитом стоимости до 10 000 ₽",
];

const forbiddenItems = [
  "Наркотики и психоактивные вещества",
  "Оружие, боеприпасы и их части",
  "Жидкости (кроме разрешенных)",
  "Скоропортящиеся продукты",
  "Деньги, ценные бумаги, драгоценные металлы",
  "Ювелирные изделия",
  "Паспорта и банковские карты",
  "Техника дороже 10 000 ₽",
  "Животные и растения",
  "Взрывчатые, легковоспламеняющиеся, токсичные вещества",
];

export default function SafetyPage() {
  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Безопасность
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Мы создали платформу с максимальной защитой для всех участников
            </p>
          </div>

          {/* Safety Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {safetyFeatures.map((feature) => (
              <div key={feature.title} className="bg-card p-8 rounded-2xl shadow-md">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Allowed Items */}
          <div className="bg-card rounded-2xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              Разрешенные предметы
            </h2>
            <ul className="space-y-3">
              {allowedItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Forbidden Items */}
          <div className="bg-card rounded-2xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <X className="w-6 h-6 text-destructive" />
              Запрещенные предметы
            </h2>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <strong>Важно:</strong> Размещение задания на доставку запрещенных предметов является нарушением условий использования и может повлечь блокировку аккаунта и привлечение к ответственности.
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {forbiddenItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Responsibility */}
          <div className="bg-muted rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ответственность
            </h2>
            <p className="text-muted-foreground mb-4">
              Пользователь самостоятельно несет полную ответственность за содержание посылки и ее соответствие перечню разрешенных предметов.
            </p>
            <p className="text-muted-foreground">
              Платформа является информационным посредником и не несет ответственности за утерю, повреждение или задержку посылки. Максимальная ответственность платформы ограничивается суммой комиссии, полученной по конкретной сделке.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Готовы начать безопасную доставку?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/register">
                  Создать аккаунт
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/terms">
                  Условия использования
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  HelpCircle,
  ArrowRight,
  Shield,
  CreditCard,
  Package,
  Users
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Общие вопросы",
    items: [
      {
        question: "Что такое SendBuddy?",
        answer: "SendBuddy — это P2P платформа для передачи небольших посылок через путешественников. Вы можете отправить посылку с попутчиком или заработать, доставив чужую посылку.",
      },
      {
        question: "Как работает платформа?",
        answer: "Отправитель создает задание с описанием посылки и маршрутом. Курьеры откликаются на задание. Отправитель выбирает курьера, оплачивает через эскроу. После доставки деньги переводятся курьеру.",
      },
      {
        question: "Сколько стоит доставка?",
        answer: "Стоимость доставки определяет отправитель, предлагая вознаграждение курьеру. Комиссия платформы составляет 15% от суммы вознаграждения.",
      },
    ],
  },
  {
    title: "Безопасность",
    items: [
      {
        question: "Безопасно ли это?",
        answer: "Да. Все пользователи проходят верификацию по телефону. Платежи проходят через эскроу — деньги переводятся только после подтверждения доставки. Есть система рейтингов и отзывов.",
      },
      {
        question: "Что делать, если посылка потерялась?",
        answer: "При возникновении спора обратитесь в поддержку. Администратор изучит переписку и примет решение о возврате средств из суммы эскроу.",
      },
      {
        question: "Как защищены мои данные?",
        answer: "Все персональные данные защищены в соответствии с ФЗ-152. Мы не передаем контактные данные до завершения поездки.",
      },
    ],
  },
  {
    title: "Платежи",
    items: [
      {
        question: "Как происходит оплата?",
        answer: "Оплата происходит через систему эскроу. Деньги блокируются на счету платформы при выборе курьера и переводятся только после подтверждения доставки.",
      },
      {
        question: "Какие способы оплаты доступны?",
        answer: "Мы поддерживаем оплату через ЮKassa и CloudPayments. Можно оплатить банковской картой.",
      },
      {
        question: "Когда вернутся деньги при отмене?",
        answer: "При отмене заказа до передачи посылки деньги возвращаются полностью. При отмене после передачи — решение принимает администратор.",
      },
    ],
  },
  {
    title: "Доставка",
    items: [
      {
        question: "Что можно отправлять?",
        answer: "Разрешены: книги, документы (кроме паспортов и карт), небрендовая одежда, сувениры, ключи (кроме автомобильных), мелкая электроника до 10 000 ₽.",
      },
      {
        question: "Что запрещено?",
        answer: "Запрещены: наркотики, оружие, жидкости, скоропортящиеся продукты, деньги, ювелирные изделия, паспорта, банковские карты, техника дороже 10 000 ₽, животные, растения.",
      },
      {
        question: "Как быстро происходит доставка?",
        answer: "Доставка зависит от маршрута курьера. Обычно это 1-2 дня, что быстрее обычной почты.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Часто задаваемые вопросы
            </h1>
            <p className="text-lg text-muted-foreground">
              Ответы на популярные вопросы о SendBuddy
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8 mb-12">
            {faqCategories.map((category) => (
              <div key={category.title} className="bg-card rounded-2xl shadow-md p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">{category.title}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="bg-card rounded-2xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Не нашли ответ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Свяжитесь с нашей службой поддержки
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">
                Написать в поддержку
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}


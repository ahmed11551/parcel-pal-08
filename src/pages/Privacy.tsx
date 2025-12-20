import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container py-6 sm:py-8 md:py-12 max-w-4xl px-4">
        <Button variant="ghost" asChild className="mb-4 sm:mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Link>
        </Button>

        <div className="bg-card rounded-lg border p-4 sm:p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Политика конфиденциальности</h1>
              <p className="text-muted-foreground">Последнее обновление: 16 декабря 2025 г.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Обработка персональных данных осуществляется в соответствии с ФЗ-152 "О персональных данных".
              </p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Платформа SendBuddy обязуется защищать персональные данные пользователей в соответствии с 
                действующим законодательством. Настоящая политика конфиденциальности описывает, как мы собираем, 
                используем и защищаем вашу персональную информацию.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Собираемая информация</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы собираем следующие типы персональных данных:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Контактные данные:</strong> номер телефона (обязательно), имя, аватар</li>
                <li><strong>Данные для верификации:</strong> информация из социальных сетей (Telegram, VK) при использовании социального входа</li>
                <li><strong>Данные о заданиях:</strong> информация о созданных заданиях, маршрутах, фотографии предметов</li>
                <li><strong>Данные о транзакциях:</strong> информация о платежах и доставках</li>
                <li><strong>Технические данные:</strong> IP-адрес, тип браузера, данные об устройстве</li>
                <li><strong>Данные о взаимодействии:</strong> сообщения в чате, отзывы и рейтинги</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Цели использования данных</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы используем персональные данные для следующих целей:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Предоставление услуг платформы (создание заданий, поиск курьеров, обработка платежей)</li>
                <li>Верификация пользователей и обеспечение безопасности</li>
                <li>Связь с пользователями по вопросам использования сервиса</li>
                <li>Улучшение качества сервиса и разработка новых функций</li>
                <li>Показ целевой рекламы (с вашего согласия)</li>
                <li>Соблюдение требований законодательства</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Защита данных</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы применяем следующие меры для защиты ваших персональных данных:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Шифрование данных при передаче (HTTPS/TLS)</li>
                <li>Хранение паролей в зашифрованном виде</li>
                <li>Ограниченный доступ к персональным данным только для уполномоченных сотрудников</li>
                <li>Регулярное обновление систем безопасности</li>
                <li>Резервное копирование данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Передача данных третьим лицам</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Мы не продаем ваши персональные данные. Мы можем передавать данные третьим лицам только в следующих случаях:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Платежные системы:</strong> для обработки платежей (ЮKassa, CloudPayments)</li>
                <li><strong>SMS-сервисы:</strong> для отправки кодов верификации (Twilio)</li>
                <li><strong>Хранилище файлов:</strong> для хранения фотографий (AWS S3, Yandex Cloud)</li>
                <li><strong>По требованию закона:</strong> при запросах уполномоченных органов</li>
                <li><strong>С вашего согласия:</strong> в других случаях с вашего явного согласия</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Ваши права</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Вы имеете право:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Получать информацию о ваших персональных данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления ваших данных (при отсутствии правовых оснований для хранения)</li>
                <li>Отозвать согласие на обработку данных</li>
                <li>Ограничить обработку данных</li>
                <li>Подать жалобу в уполномоченный орган по защите персональных данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Хранение данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы храним ваши персональные данные в течение срока, необходимого для целей их обработки, 
                или в течение срока, установленного законодательством. После истечения срока хранения данные 
                удаляются или обезличиваются.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies и аналогичные технологии</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы используем cookies и аналогичные технологии для улучшения работы платформы, анализа 
                использования и показа релевантной рекламы. Вы можете управлять настройками cookies в 
                вашем браузере.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Изменения в политике</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы можем изменять настоящую политику конфиденциальности. О существенных изменениях мы 
                уведомим вас через платформу или по электронной почте. Продолжение использования сервиса 
                после изменений означает согласие с новой политикой.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Контакты</h2>
              <p className="text-muted-foreground leading-relaxed">
                По вопросам, связанным с обработкой персональных данных, вы можете обращаться через 
                форму обратной связи на платформе или по адресу электронной почты, указанному в контактах.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Используя платформу SendBuddy, вы подтверждаете, что прочитали и согласны с настоящей 
                политикой конфиденциальности.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


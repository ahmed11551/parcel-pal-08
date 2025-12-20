import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Link>
        </Button>

        <div className="bg-card rounded-lg border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Условия использования</h1>
              <p className="text-muted-foreground">Последнее обновление: 16 декабря 2025 г.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Настоящий документ является публичной офертой. Используя Платформу, вы соглашаетесь с условиями.
              </p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Статус Платформы</h2>
              <p className="text-muted-foreground leading-relaxed">
                Платформа SendBuddy является информационным посредником, соединяющим Отправителя и Курьера. 
                Платформа не является перевозчиком, экспедитором или стороной договора перевозки. 
                Платформа предоставляет услуги по доступу к функционалу для создания заданий на доставку 
                и поиска курьеров.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Предмет соглашения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Используя платформу SendBuddy, вы соглашаетесь с настоящими условиями использования. 
                Отношения по доставке возникают напрямую между пользователями (Отправителем и Курьером). 
                Платформа не несет ответственности за выполнение договоренностей между пользователями.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Разрешенные и запрещенные предметы</h2>
              
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Разрешенные предметы:</h3>
                <ul className="list-disc list-inside text-green-800 dark:text-green-200 space-y-1">
                  <li>Книги и документы (кроме паспортов и банковских карт)</li>
                  <li>Небрендовая одежда и аксессуары</li>
                  <li>Сувениры</li>
                  <li>Ключи (кроме автомобильных)</li>
                  <li>Мелкая электроника (наушники, кабели) с лимитом стоимости до 10 000 руб.</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">❌ Запрещенные предметы:</h3>
                <ul className="list-disc list-inside text-red-800 dark:text-red-200 space-y-1">
                  <li>Наркотики и психоактивные вещества</li>
                  <li>Оружие и боеприпасы</li>
                  <li>Жидкости (кроме разрешенных)</li>
                  <li>Скоропортящиеся продукты</li>
                  <li>Деньги и ценные бумаги</li>
                  <li>Ювелирные изделия</li>
                  <li>Паспорта и банковские карты</li>
                  <li>Техника дороже 10 000 руб.</li>
                  <li>Животные и растения</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Гарантии и ответственность</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Пользователи самостоятельно несут полную ответственность за содержание Посылки и ее соответствие 
                Перечню запрещенных предметов. Платформа не несет ответственности за:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Утерю, повреждение или задержку Посылки</li>
                <li>Любые убытки, возникшие в связи с использованием сервиса</li>
                <li>Несоответствие Посылки описанию</li>
                <li>Действия третьих лиц</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Максимальная ответственность Платформы ограничивается суммой комиссии, полученной по данной сделке.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Процедура разрешения споров</h2>
              <p className="text-muted-foreground leading-relaxed">
                При возникновении спора Платформа (Администратор) имеет право запросить у сторон фото/видео 
                доказательства и принять решение о возврате/не возврате средств из суммы эскроу на свое усмотрение. 
                Решение Администратора является окончательным.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Монетизация</h2>
              <p className="text-muted-foreground leading-relaxed">
                Комиссия платформы составляет 15% от суммы вознаграждения, удерживаемая при успешной доставке. 
                Для отправителя оплата происходит через безопасную сделку (эскроу). Деньги блокируются на счету 
                платформы до успешного завершения доставки.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Интеллектуальная собственность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Все права на программное обеспечение, дизайн, логотип и другие материалы платформы принадлежат 
                Sebiev IT Group. Использование материалов платформы без разрешения запрещено.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Изменение условий</h2>
              <p className="text-muted-foreground leading-relaxed">
                Платформа оставляет за собой право изменять условия использования. Пользователи будут уведомлены 
                об изменениях через платформу. Продолжение использования сервиса после изменений означает 
                согласие с новыми условиями.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                По вопросам, связанным с условиями использования, обращайтесь через форму обратной связи 
                на платформе.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


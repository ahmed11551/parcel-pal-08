import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  MapPin, 
  Calendar, 
  Package, 
  Star, 
  ArrowRight,
  Filter,
  Search,
  Plane,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const sizeLabels: Record<string, string> = {
  S: "Маленький",
  M: "Средний",
  L: "Большой",
};

const airportNames: Record<string, { city: string; name: string }> = {
  SVO: { city: "Москва", name: "Шереметьево" },
  DME: { city: "Москва", name: "Домодедово" },
  VKO: { city: "Москва", name: "Внуково" },
  LED: { city: "Санкт-Петербург", name: "Пулково" },
  KZN: { city: "Казань", name: "Казань" },
  SVX: { city: "Екатеринбург", name: "Кольцово" },
  AER: { city: "Сочи", name: "Сочи" },
  ROV: { city: "Ростов-на-Дону", name: "Платов" },
};

// Mock data for tasks (fallback)
const mockTasks = [
  {
    id: 1,
    title: "Книги для учебы",
    description: "Несколько учебников по программированию, общий вес около 2 кг",
    size: "M",
    reward: 2500,
    from: { city: "Москва", airport: "SVO", point: "Стойка информации, терминал D" },
    to: { city: "Санкт-Петербург", airport: "LED", point: "Зона прилета, выход 3" },
    dateFrom: "2024-01-20",
    dateTo: "2024-01-25",
    sender: { name: "Алексей М.", rating: 4.9, deliveries: 12 },
    photo: "📚",
    status: "active",
  },
  {
    id: 2,
    title: "Ключи от квартиры",
    description: "Связка ключей с брелоком, срочно нужно передать",
    size: "S",
    reward: 1500,
    from: { city: "Москва", airport: "DME", point: "Выход к такси" },
    to: { city: "Казань", airport: "KZN", point: "Зал ожидания" },
    dateFrom: "2024-01-18",
    dateTo: "2024-01-20",
    sender: { name: "Мария К.", rating: 5.0, deliveries: 8 },
    photo: "🔑",
    status: "active",
  },
  {
    id: 3,
    title: "Сувениры из поездки",
    description: "Магниты и небольшие подарки для семьи",
    size: "S",
    reward: 1800,
    from: { city: "Сочи", airport: "AER", point: "Кафе у выхода 1" },
    to: { city: "Москва", airport: "VKO", point: "Зона прилета" },
    dateFrom: "2024-01-22",
    dateTo: "2024-01-28",
    sender: { name: "Дмитрий С.", rating: 4.7, deliveries: 5 },
    photo: "🎁",
    status: "active",
  },
  {
    id: 4,
    title: "Документы для офиса",
    description: "Важные документы в папке А4",
    size: "S",
    reward: 3000,
    from: { city: "Екатеринбург", airport: "SVX", point: "Информационная стойка" },
    to: { city: "Москва", airport: "SVO", point: "Бизнес-зал, терминал B" },
    dateFrom: "2024-01-19",
    dateTo: "2024-01-21",
    sender: { name: "Елена В.", rating: 4.8, deliveries: 15 },
    photo: "📄",
    status: "active",
  },
];

export default function TasksPage() {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', searchFrom, searchTo],
    queryFn: () => api.getTasks({
      from: searchFrom || undefined,
      to: searchTo || undefined,
      status: 'active'
    }),
    retry: 1,
  });

  const tasks = data?.tasks || [];

  const handleSearch = () => {
    refetch();
  };

  if (error) {
    toast.error("Ошибка при загрузке заданий");
  }

  return (
    <Layout>
      <div className="gradient-subtle min-h-screen">
        {/* Header */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="container px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Доступные задания
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8">
              Найдите подходящее задание по вашему маршруту и заработайте
            </p>

            {/* Filters */}
            <div className="bg-card p-4 sm:p-6 rounded-2xl shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Откуда"
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Куда"
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
                <Button size="lg" className="w-full sm:col-span-2 md:col-span-1" onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Поиск...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      Найти задания
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks List */}
        <section className="pb-12 sm:pb-16 md:pb-20">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <p className="text-muted-foreground text-sm sm:text-base">
                Найдено <span className="font-semibold text-foreground">{tasks.length}</span> заданий
              </p>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                <Filter className="w-4 h-4" />
                Фильтры
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Задания не найдены</p>
                <p className="text-muted-foreground text-sm mt-2">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
            <div className="grid gap-6">
                {tasks.map((task: any) => {
                  const fromInfo = airportNames[task.from?.airport] || { city: task.from?.airport, name: task.from?.airport };
                  const toInfo = airportNames[task.to?.airport] || { city: task.to?.airport, name: task.to?.airport };
                  
                  return (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="group bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Photo placeholder */}
                    <div className="w-full sm:w-24 h-24 sm:h-24 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {task.photoUrl ? (
                        <img src={task.photoUrl} alt={task.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                            {task.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{task.reward.toLocaleString()} ₽</div>
                          <div className="text-muted-foreground text-sm">вознаграждение</div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Plane className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">{fromInfo.city}</div>
                            <div className="text-xs text-muted-foreground">{task.from?.airport}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-1 sm:ml-0">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-secondary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">{toInfo.city}</div>
                            <div className="text-xs text-muted-foreground">{task.to?.airport}</div>
                          </div>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {task.dateFrom} — {task.dateTo}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="w-4 h-4" />
                          {sizeLabels[task.size]}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 gradient-hero rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold">
                            {task.sender?.name?.[0] || '?'}
                          </div>
                          <span className="text-foreground">{task.sender?.name || 'Неизвестно'}</span>
                          {task.sender?.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-secondary text-secondary" />
                            <span className="text-foreground font-medium">{task.sender.rating}</span>
                          </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                  );
                })}
            </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

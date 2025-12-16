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
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksAPI } from "@/lib/api";
import { toast } from "sonner";

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

const sizeLabels: Record<string, string> = {
  S: "Маленький",
  M: "Средний",
  L: "Большой",
};

export default function TasksPage() {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [filters, setFilters] = useState<{ fromAirport?: string; toAirport?: string }>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getAll(filters),
  });

  const tasks = data?.data?.tasks || [];

  useEffect(() => {
    if (error) {
      toast.error("Ошибка при загрузке заданий");
    }
  }, [error]);

  const handleSearch = () => {
    setFilters({
      fromAirport: searchFrom || undefined,
      toAirport: searchTo || undefined,
    });
  };

  return (
    <Layout>
      <div className="gradient-subtle min-h-screen">
        {/* Header */}
        <section className="py-12 md:py-16">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Доступные задания
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Найдите подходящее задание по вашему маршруту и заработайте
            </p>

            {/* Filters */}
            <div className="bg-card p-6 rounded-2xl shadow-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Откуда"
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Куда"
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button size="lg" className="w-full" onClick={handleSearch}>
                  <Search className="w-5 h-5" />
                  Найти задания
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks List */}
        <section className="pb-20">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {isLoading ? (
                  "Загрузка..."
                ) : (
                  <>
                    Найдено <span className="font-semibold text-foreground">{tasks.length}</span> заданий
                  </>
                )}
              </p>
              <Button variant="ghost" size="sm">
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
                <p className="text-muted-foreground">Задания не найдены</p>
              </div>
            ) : (
            <div className="grid gap-6">
                {tasks.map((task: any) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="group bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                      {/* Photo */}
                      <div className="w-24 h-24 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {task.photos && task.photos.length > 0 ? (
                          <img
                            src={task.photos[0]}
                            alt={task.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-muted-foreground" />
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
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Plane className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{task.fromAirport}</div>
                            <div className="text-xs text-muted-foreground">{task.fromPoint || "Место встречи"}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-secondary-foreground" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{task.toAirport}</div>
                            <div className="text-xs text-muted-foreground">{task.toPoint || "Место встречи"}</div>
                          </div>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.dateFrom).toLocaleDateString('ru-RU')} — {new Date(task.dateTo).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="w-4 h-4" />
                          {sizeLabels[task.size] || task.size}
                        </div>
                        {task.sender && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 gradient-hero rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold">
                              {task.sender.name?.[0] || "?"}
                          </div>
                            <span className="text-foreground">{task.sender.name || "Пользователь"}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-secondary text-secondary" />
                              <span className="text-foreground font-medium">{task.sender.rating?.toFixed(1) || "0.0"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

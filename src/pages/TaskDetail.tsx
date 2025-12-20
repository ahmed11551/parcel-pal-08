import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  MapPin, 
  Calendar, 
  Package, 
  Star, 
  ArrowRight,
  Plane,
  User,
  MessageCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = api.getCurrentUser();

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(parseInt(id!)),
    enabled: !!id,
  });

  const handleAssign = async () => {
    if (!id) return;
    try {
      await api.assignTask(parseInt(id));
      toast.success("Вы назначены курьером!");
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при назначении");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Задание не найдено</h1>
          <Link to="/tasks">
            <Button>Вернуться к заданиям</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const fromInfo = airportNames[task.from?.airport] || { city: task.from?.airport, name: task.from?.airport };
  const toInfo = airportNames[task.to?.airport] || { city: task.to?.airport, name: task.to?.airport };
  const isOwner = currentUser?.id === task.sender?.id;
  const isAssigned = task.courierId && task.courierId === currentUser?.id;
  const canAssign = !isOwner && !task.courierId && task.status === 'active' && api.isAuthenticated();

  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-6 sm:py-8 md:py-12">
        <div className="container max-w-4xl px-4">
          <Link to="/tasks" className="text-muted-foreground hover:text-foreground mb-4 sm:mb-6 inline-block text-sm sm:text-base">
            ← Назад к заданиям
          </Link>

          <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
            {/* Photo */}
            {task.photoUrl && (
              <div className="w-full h-64 md:h-96 bg-muted">
                <img 
                  src={task.photoUrl} 
                  alt={task.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">{task.title}</h1>
                  <p className="text-muted-foreground text-base sm:text-lg break-words">{task.description}</p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{task.reward.toLocaleString()} ₽</div>
                  <div className="text-muted-foreground text-sm">вознаграждение</div>
                </div>
              </div>

              {/* Route */}
              <div className="bg-muted p-4 sm:p-6 rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground text-base sm:text-lg">{fromInfo.city}</div>
                      <div className="text-muted-foreground text-sm">{task.from?.airport} - {fromInfo.name}</div>
                      {task.from?.point && (
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{task.from.point}</div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground hidden sm:block flex-shrink-0" />
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 sm:ml-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground text-base sm:text-lg">{toInfo.city}</div>
                      <div className="text-muted-foreground text-sm">{task.to?.airport} - {toInfo.name}</div>
                      {task.to?.point && (
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{task.to.point}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Сроки</div>
                    <div className="font-semibold text-foreground">
                      {new Date(task.dateFrom).toLocaleDateString('ru-RU')} — {new Date(task.dateTo).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Размер</div>
                    <div className="font-semibold text-foreground">{sizeLabels[task.size] || task.size}</div>
                  </div>
                </div>
              </div>

              {/* Sender */}
              <div className="border-t border-border pt-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {task.sender?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{task.sender?.name || 'Неизвестно'}</div>
                    {task.sender?.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="text-foreground">{task.sender.rating}</span>
                        {task.sender.deliveries && (
                          <span className="text-muted-foreground">• {task.sender.deliveries} доставок</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canAssign && (
                <Button size="lg" className="w-full" onClick={handleAssign}>
                  Стать курьером
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              )}

              {isOwner && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center">
                    Это ваше задание
                  </div>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/tasks">
                      Посмотреть другие задания
                    </Link>
                  </Button>
                </div>
              )}

              {isAssigned && (
                <div className="space-y-2">
                  <div className="text-sm text-primary text-center font-semibold">
                    Вы назначены курьером этого задания
                  </div>
                </div>
              )}

              {!api.isAuthenticated() && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">Войдите, чтобы стать курьером</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" asChild>
                      <Link to="/login">Войти</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register">Регистрация</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


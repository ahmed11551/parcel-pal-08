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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CreditCard, Copy } from "lucide-react";
import { useState } from "react";

const sizeLabels: Record<string, string> = {
  S: "Маленький",
  M: "Средний",
  L: "Большой",
};

import { getAirportByCode } from "@/utils/airports";

// Функция для получения информации об аэропорте
const getAirportInfo = (code: string) => {
  const airport = getAirportByCode(code);
  return airport ? { city: airport.city, name: airport.name } : { city: code, name: code };
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

  const fromInfo = getAirportInfo(task.from?.airport || '');
  const toInfo = getAirportInfo(task.to?.airport || '');
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
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground text-center">
                    Это ваше задание
                  </div>
                  
                  {/* Status info for owner */}
                  {task.status === 'assigned' && task.courier && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Курьер назначен: {task.courier.name}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Ожидайте подтверждения получения посылки
                      </div>
                    </div>
                  )}
                  
                  {task.status === 'in_transit' && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <div className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                        Посылка в пути
                      </div>
                      <div className="text-sm text-indigo-700 dark:text-indigo-300">
                        Курьер везет вашу посылку
                      </div>
                    </div>
                  )}
                  
                  {task.status === 'delivered' && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                      <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Доставка завершена!
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Посылка успешно доставлена
                      </div>
                    </div>
                  )}
                  
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/orders">
                      Мои задания
                    </Link>
                  </Button>
                </div>
              )}

              {isAssigned && (
                <div className="space-y-4">
                  <div className="text-sm text-primary text-center font-semibold mb-4">
                    Вы назначены курьером этого задания
                  </div>
                  
                  {/* Actions for courier based on status */}
                  {task.status === 'assigned' && (
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={async () => {
                        try {
                          await api.updateTaskStatus(task.id, 'in_transit');
                          toast.success("Посылка отмечена как полученная! Теперь она в пути.");
                          window.location.reload(); // Reload to show updated status
                        } catch (error: any) {
                          toast.error(error.message || "Ошибка при обновлении статуса");
                        }
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Получил посылку (В пути)
                    </Button>
                  )}
                  
                  {task.status === 'in_transit' && (
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={async () => {
                        try {
                          await api.updateTaskStatus(task.id, 'delivered');
                          toast.success("Доставка подтверждена! Платеж будет переведен курьеру.");
                          window.location.reload(); // Reload to show updated status
                        } catch (error: any) {
                          toast.error(error.message || "Ошибка при обновлении статуса");
                        }
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Подтвердить доставку
                    </Button>
                  )}
                  
                  {task.status === 'delivered' && (
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <div className="font-semibold text-green-900 dark:text-green-100">
                        Доставка завершена!
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Платеж будет переведен на ваш счет
                      </div>
                    </div>
                  )}
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


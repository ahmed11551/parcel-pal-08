import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Package,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Plane,
  ArrowRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getAirportByCode } from "@/utils/airports";

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Активно", color: "bg-yellow-500" },
  assigned: { label: "Курьер назначен", color: "bg-blue-500" },
  in_transit: { label: "В пути", color: "bg-indigo-500" },
  delivered: { label: "Доставлено", color: "bg-emerald-500" },
  cancelled: { label: "Отменено", color: "bg-red-500" },
};

// Helper function to get airport info
const getAirportInfo = (code: string) => {
  const airport = getAirportByCode(code);
  return airport ? { city: airport.city, name: airport.name } : { city: code, name: code };
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [role, setRole] = useState<"sender" | "carrier">("carrier");

  // Map carrier to courier for API
  const apiRole = role === "carrier" ? "courier" : "sender";

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["myTasks", apiRole],
    queryFn: () => api.getMyTasks(apiRole),
    enabled: !!user,
  });

  const tasks = tasksData?.tasks || [];

  const markReceivedMutation = useMutation({
    mutationFn: (taskId: number) => api.updateTaskStatus(taskId, 'in_transit'),
    onSuccess: () => {
      toast.success("Посылка отмечена как полученная");
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Ошибка");
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: (taskId: number) => api.updateTaskStatus(taskId, 'delivered'),
    onSuccess: () => {
      toast.success("Доставка подтверждена!");
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Ошибка");
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Мои задания</h1>

          <Tabs value={role} onValueChange={(v) => setRole(v as "sender" | "carrier")}>
            <TabsList className="mb-6">
              <TabsTrigger value="carrier">Как курьер</TabsTrigger>
              <TabsTrigger value="sender">Как отправитель</TabsTrigger>
            </TabsList>

            <TabsContent value={role}>
              {tasks.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Заданий пока нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task: any) => {
                    const fromInfo = getAirportInfo(task.from?.airport || '');
                    const toInfo = getAirportInfo(task.to?.airport || '');
                    const isCourier = role === "carrier";
                    const otherUser = isCourier ? task.sender : task.courier;

                    return (
                      <div
                        key={task.id}
                        className="bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Task Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                  {task.title}
                                </h3>
                                <Badge
                                  className={statusLabels[task.status]?.color || "bg-gray-500"}
                                >
                                  {statusLabels[task.status]?.label || task.status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {task.reward?.toLocaleString()} ₽
                                </div>
                                <div className="text-sm text-muted-foreground">вознаграждение</div>
                              </div>
                            </div>

                            {/* Route */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Plane className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <div className="font-semibold">{fromInfo.city} ({task.from?.airport})</div>
                                  <div className="text-xs text-muted-foreground">
                                    {task.from?.point || fromInfo.name}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <div className="font-semibold">{toInfo.city} ({task.to?.airport})</div>
                                  <div className="text-xs text-muted-foreground">
                                    {task.to?.point || toInfo.name}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-4 mb-4">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div className="text-sm text-muted-foreground">
                                {new Date(task.dateFrom).toLocaleDateString('ru-RU')} — {new Date(task.dateTo).toLocaleDateString('ru-RU')}
                              </div>
                            </div>

                            {/* User Info */}
                            {otherUser && (
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 gradient-hero rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                                  {otherUser.name?.[0] || "?"}
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold">
                                    {otherUser.name || (isCourier ? "Отправитель" : "Курьер")}
                                  </span>
                                  {otherUser.rating && (
                                    <span className="text-muted-foreground ml-2">
                                      ⭐ {otherUser.rating}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 lg:w-48">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className="w-full"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Подробнее
                            </Button>

                            {/* Курьер: может отметить как получено если статус assigned */}
                            {isCourier && task.status === "assigned" && (
                              <Button
                                onClick={() => markReceivedMutation.mutate(task.id)}
                                disabled={markReceivedMutation.isPending}
                                className="w-full"
                              >
                                {markReceivedMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Обновление...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Получил посылку
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Курьер: может отметить как доставлено если статус in_transit */}
                            {isCourier && task.status === "in_transit" && (
                              <Button
                                onClick={() => markDeliveredMutation.mutate(task.id)}
                                disabled={markDeliveredMutation.isPending}
                                className="w-full"
                              >
                                {markDeliveredMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Обновление...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Доставлено
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Отправитель: может посмотреть задание если активное */}
                            {!isCourier && task.status === "active" && (
                              <Button
                                variant="outline"
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="w-full"
                              >
                                Посмотреть задание
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}


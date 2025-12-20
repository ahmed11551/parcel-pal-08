import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersAPI, paymentsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Plane,
  ArrowRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает выбора", color: "bg-yellow-500" },
  carrier_selected: { label: "Курьер выбран", color: "bg-blue-500" },
  paid: { label: "Оплачено", color: "bg-green-500" },
  package_received: { label: "Посылка получена", color: "bg-purple-500" },
  in_transit: { label: "В пути", color: "bg-indigo-500" },
  delivered: { label: "Доставлено", color: "bg-emerald-500" },
  completed: { label: "Завершено", color: "bg-gray-500" },
  cancelled: { label: "Отменено", color: "bg-red-500" },
  dispute: { label: "Спор", color: "bg-orange-500" },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [role, setRole] = useState<"sender" | "carrier">("carrier");

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", role],
    queryFn: () => ordersAPI.getAll(role),
  });

  const orders = ordersData?.data || [];

  const markReceivedMutation = useMutation({
    mutationFn: (id: string) => ordersAPI.markPackageReceived(id),
    onSuccess: () => {
      toast.success("Посылка отмечена как полученная");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка");
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: (id: string) => ordersAPI.markDelivered(id),
    onSuccess: () => {
      toast.success("Доставка подтверждена!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка");
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (orderId: string) =>
      paymentsAPI.create({ orderId, provider: "yookassa" }),
    onSuccess: (response) => {
      if (response.data.confirmationUrl) {
        window.location.href = response.data.confirmationUrl;
      } else {
        toast.success("Платеж создан");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при создании платежа");
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
          <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>

          <Tabs value={role} onValueChange={(v) => setRole(v as "sender" | "carrier")}>
            <TabsList className="mb-6">
              <TabsTrigger value="carrier">Как курьер</TabsTrigger>
              <TabsTrigger value="sender">Как отправитель</TabsTrigger>
            </TabsList>

            <TabsContent value={role}>
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Заказов пока нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Task Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-foreground mb-2">
                                {order.task?.title}
                              </h3>
                              <Badge
                                className={statusLabels[order.status]?.color || "bg-gray-500"}
                              >
                                {statusLabels[order.status]?.label || order.status}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {order.reward.toLocaleString()} ₽
                              </div>
                              <div className="text-sm text-muted-foreground">вознаграждение</div>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Plane className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold">{order.task?.fromAirport}</div>
                                <div className="text-xs text-muted-foreground">
                                  {order.task?.fromPoint}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold">{order.task?.toAirport}</div>
                                <div className="text-xs text-muted-foreground">
                                  {order.task?.toPoint}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* User Info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 gradient-hero rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                              {role === "carrier"
                                ? order.sender?.name?.[0] || "?"
                                : order.carrier?.name?.[0] || "?"}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">
                                {role === "carrier"
                                  ? order.sender?.name || "Отправитель"
                                  : order.carrier?.name || "Курьер"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/chat/${order.id}`)}
                            className="w-full"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Чат
                          </Button>

                          {role === "carrier" && order.status === "paid" && (
                            <Button
                              onClick={() => markReceivedMutation.mutate(order.id)}
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

                          {role === "carrier" && order.status === "package_received" && (
                            <Button
                              onClick={() => markDeliveredMutation.mutate(order.id)}
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

                          {role === "sender" && order.status === "carrier_selected" && (
                            <Button
                              onClick={() => createPaymentMutation.mutate(order.id)}
                              disabled={createPaymentMutation.isPending}
                              className="w-full"
                            >
                              {createPaymentMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Создание...
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Оплатить
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}


import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI, ordersAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  Package,
  Star,
  ArrowRight,
  Plane,
  DollarSign,
  User,
  Loader2,
  MessageSquare,
  CheckCircle2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const sizeLabels: Record<string, string> = {
  S: "Маленький",
  M: "Средний",
  L: "Большой",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksAPI.getById(id!),
    enabled: !!id,
  });

  const taskData = task?.data;

  const { data: responses } = useQuery({
    queryKey: ["task-responses", id],
    queryFn: () => tasksAPI.getResponses(id!),
    enabled: !!id && !!taskData && taskData.senderId === user?.id,
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: { taskId: string; carrierMessage?: string }) => ordersAPI.create(data),
    onSuccess: () => {
      toast.success("Отклик отправлен!");
      setShowResponseDialog(false);
      setResponseMessage("");
      queryClient.invalidateQueries({ queryKey: ["task", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при отправке отклика");
    },
  });

  const selectCarrierMutation = useMutation({
    mutationFn: ({ taskId, orderId }: { taskId: string; orderId: string }) =>
      ordersAPI.selectCarrier(taskId, orderId),
    onSuccess: () => {
      toast.success("Курьер выбран!");
      queryClient.invalidateQueries({ queryKey: ["task-responses", id] });
      navigate("/orders");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при выборе курьера");
    },
  });

  const handleResponse = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = () => {
    if (!id) return;
    createOrderMutation.mutate({
      taskId: id,
      carrierMessage: responseMessage || undefined,
    });
  };

  const handleSelectCarrier = (orderId: string) => {
    if (!id) return;
    selectCarrierMutation.mutate({ taskId: id, orderId });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!taskData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Задание не найдено</h2>
            <Button onClick={() => navigate("/tasks")}>Вернуться к заданиям</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner = taskData.senderId === user?.id;
  const hasResponded = taskData.orders?.some((order: any) => order.carrierId === user?.id);

  return (
    <Layout>
      <div className="gradient-subtle min-h-screen py-12">
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/tasks")} className="mb-6">
            ← Назад к заданиям
          </Button>

          <div className="bg-card rounded-2xl shadow-md overflow-hidden">
            {/* Photos */}
            {taskData.photos && taskData.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 p-6">
                {taskData.photos.map((photo: string, index: number) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ))}
              </div>
            )}

            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{taskData.title}</h1>
                  <p className="text-muted-foreground">{taskData.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{taskData.reward.toLocaleString()} ₽</div>
                  <div className="text-sm text-muted-foreground">вознаграждение</div>
                </div>
              </div>

              {/* Route */}
              <div className="bg-muted p-6 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Plane className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{taskData.fromAirport}</div>
                        <div className="text-sm text-muted-foreground">{taskData.fromPoint}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{taskData.toAirport}</div>
                        <div className="text-sm text-muted-foreground">{taskData.toPoint}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Даты доставки</div>
                    <div className="font-semibold">
                      {new Date(taskData.dateFrom).toLocaleDateString("ru-RU")} —{" "}
                      {new Date(taskData.dateTo).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Размер</div>
                    <div className="font-semibold">{sizeLabels[taskData.size] || taskData.size}</div>
                  </div>
                </div>
                {taskData.estimatedValue && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Оценочная стоимость</div>
                      <div className="font-semibold">{taskData.estimatedValue.toLocaleString()} ₽</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sender Info */}
              {taskData.sender && (
                <div className="border-t border-border pt-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 gradient-hero rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {taskData.sender.name?.[0] || "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{taskData.sender.name || "Пользователь"}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span>{taskData.sender.rating?.toFixed(1) || "0.0"}</span>
                        <span className="text-muted-foreground">
                          • {taskData.sender.completedDeliveries || 0} доставок
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isOwner && (
                <div className="border-t border-border pt-6">
                  {hasResponded ? (
                    <Button disabled className="w-full">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Вы уже откликнулись
                    </Button>
                  ) : (
                    <Button onClick={handleResponse} className="w-full" size="lg">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Откликнуться на задание
                    </Button>
                  )}
                </div>
              )}

              {/* Responses (for owner) */}
              {isOwner && responses?.data && responses.data.length > 0 && (
                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-xl font-bold mb-4">Отклики курьеров ({responses.data.length})</h3>
                  <div className="space-y-4">
                    {responses.data.map((order: any) => (
                      <div key={order.id} className="bg-muted p-4 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-10 h-10 gradient-hero rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                              {order.carrier?.name?.[0] || "?"}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-foreground">{order.carrier?.name || "Курьер"}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Star className="w-4 h-4 fill-secondary text-secondary" />
                                <span>{order.carrier?.rating?.toFixed(1) || "0.0"}</span>
                                <span>• {order.carrier?.completedDeliveries || 0} доставок</span>
                              </div>
                              {order.carrierMessage && (
                                <p className="text-sm text-foreground mt-2">{order.carrierMessage}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleSelectCarrier(order.id)}
                            disabled={order.status !== "pending"}
                          >
                            Выбрать
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Откликнуться на задание</DialogTitle>
            <DialogDescription>Напишите сообщение отправителю (необязательно)</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Например: Готов доставить, вылетаю 20 января..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={4}
            className="mt-4"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowResponseDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmitResponse} disabled={createOrderMutation.isPending}>
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Отправка...
                </>
              ) : (
                "Отправить отклик"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


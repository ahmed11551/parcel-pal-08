import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI, reviewsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User,
  Star,
  Package,
  Mail,
  Phone,
  Edit,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => usersAPI.getMe(),
    enabled: !!user,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", user?.id],
    queryFn: () => reviewsAPI.getByUser(user?.id!),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersAPI.updateMe(data),
    onSuccess: (response) => {
      updateUser(response.data);
      setIsEditing(false);
      toast.success("Профиль обновлен");
      queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ошибка при обновлении профиля");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const profile = userData?.data || user;

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
        <div className="container max-w-4xl">
          <div className="bg-card rounded-2xl shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary-foreground/20">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{profile?.name || "Пользователь"}</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{profile?.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{profile?.completedDeliveries || 0} доставок</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{profile?.sentDeliveries || 0} отправок</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditData({
                      name: profile?.name || "",
                      avatar: profile?.avatar || "",
                    });
                    setIsEditing(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Contact Info */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Контактная информация</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{profile?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-muted p-6 rounded-xl">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile?.rating?.toFixed(1) || "0.0"}
                  </div>
                  <div className="text-sm text-muted-foreground">Рейтинг</div>
                </div>
                <div className="bg-muted p-6 rounded-xl">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile?.completedDeliveries || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Выполнено доставок</div>
                </div>
                <div className="bg-muted p-6 rounded-xl">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {profile?.sentDeliveries || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Отправлено посылок</div>
                </div>
              </div>

              {/* Reviews */}
              {reviewsData?.data && reviewsData.data.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Отзывы ({reviewsData.data.length})</h2>
                  <div className="space-y-4">
                    {reviewsData.data.map((review: any) => (
                      <div key={review.id} className="bg-muted p-4 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 gradient-hero rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                              {review.reviewer?.name?.[0] || "?"}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {review.reviewer?.name || "Пользователь"}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "fill-secondary text-secondary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-foreground mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Ваше имя"
              />
            </div>
            <div>
              <Label htmlFor="avatar">URL аватара</Label>
              <Input
                id="avatar"
                value={editData.avatar}
                onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


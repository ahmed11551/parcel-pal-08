import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.getTask(Number(taskId!)),
    enabled: !!taskId,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", taskId],
    queryFn: () => api.getMessages(Number(taskId!)),
    enabled: !!taskId,
    refetchInterval: 3000, // Polling каждые 3 секунды
  });

  const messages = messagesData?.messages || [];

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => api.sendMessage(Number(taskId!), content),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", taskId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Ошибка при отправке сообщения");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: () => api.markMessagesAsRead(Number(taskId!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", taskId] });
    },
  });

  useEffect(() => {
    if (messages.length > 0 && taskId) {
      // Mark as read if there are unread messages for current user
      const hasUnread = messages.some((msg: any) => !msg.read && msg.senderId !== user?.id);
      if (hasUnread) {
        markAsReadMutation.mutate();
      }
    }
  }, [messages.length, taskId, user?.id]);

  useEffect(() => {
    // Автоскролл к последнему сообщению
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !taskId) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine other user (sender or courier)
  const otherUser = task?.sender?.id === user?.id ? task?.courier : task?.sender;

  if (taskLoading || !task) {
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
      <div className="gradient-subtle min-h-screen">
        <div className="container max-w-4xl py-6">
          {/* Header */}
          <div className="bg-card rounded-2xl shadow-md mb-4 p-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/tasks/${taskId}`)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 gradient-hero rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                {otherUser?.name?.[0] || "?"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{otherUser?.name || "Пользователь"}</div>
                <div className="text-sm text-muted-foreground">
                  Задание #{taskId?.slice(0, 8)} • {task?.title}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-card rounded-2xl shadow-md h-[calc(100vh-280px)] flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Нет сообщений. Начните общение!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg: any) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl p-4 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message || msg.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="h-auto"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Запрещено обмениваться контактами до завершения поездки
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


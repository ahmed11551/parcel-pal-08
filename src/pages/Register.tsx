import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Phone, User, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"info" | "verify">("info");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendCode = async () => {
    if (!formData.name || formData.phone.length < 10) {
      toast.error("Заполните все поля");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Необходимо согласиться с условиями использования");
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendCode(formData.phone);
      setStep("verify");
      toast.success("Код отправлен на ваш номер телефона");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 4) {
      toast.error("Введите код из SMS");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyCode(formData.phone, code);
      
      // Обновляем имя пользователя после регистрации
      if (formData.name && response.data.user) {
        response.data.user.name = formData.name;
      }
      
      login(response.data.accessToken, response.data.user);
      toast.success("Регистрация выполнена успешно");
      navigate("/");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen gradient-subtle flex items-center justify-center py-12">
        <div className="container max-w-md">
          <div className="bg-card p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Регистрация
              </h1>
              <p className="text-muted-foreground">
                {step === "info"
                  ? "Создайте аккаунт в SendBuddy"
                  : "Подтвердите номер телефона"}
              </p>
            </div>

            {step === "info" ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Имя
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Номер телефона
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Я согласен с{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      условиями использования
                    </Link>{" "}
                    и{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      политикой конфиденциальности
                    </Link>
                  </span>
                </label>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={!formData.name || formData.phone.length < 10 || !agreedToTerms || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      Получить код
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Код из SMS
                  </label>
                  <input
                    type="text"
                    placeholder="• • • •"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={4}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Код отправлен на {formData.phone}
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handleVerifyCode}
                  disabled={code.length < 4 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      Создать аккаунт
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setStep("info")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Изменить данные
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground text-sm">
                Уже есть аккаунт?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

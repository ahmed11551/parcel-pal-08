import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Phone, ArrowRight, Shield, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatPhoneForAPI, validatePhone, normalizePhone } from "@/utils/phone";

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string>("");

  const handleSendCode = async () => {
    const normalized = normalizePhone(phone);
    if (!validatePhone(phone)) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = formatPhoneForAPI(phone);
      const response = await api.loginSendCode(formattedPhone);
      setStep("code");
      
      // В development режиме показываем код
      if (response.devMode && response.code) {
        setDevCode(response.code);
        toast.success(`Код отправлен! (Dev режим: ${response.code})`, { duration: 10000 });
      } else {
        toast.success("Код отправлен на ваш номер");
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length < 4) return;
    
    setLoading(true);
    try {
      const formattedPhone = formatPhoneForAPI(phone);
      await api.loginVerify(formattedPhone, code);
      toast.success("Вход выполнен успешно");
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.message || "Неверный код");
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
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Вход в SendBuddy
              </h1>
              <p className="text-muted-foreground">
                {step === "phone"
                  ? "Введите номер телефона для входа"
                  : "Введите код из SMS"}
              </p>
            </div>

            {step === "phone" ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Номер телефона
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Разрешаем только цифры, +, пробелы, скобки, дефисы
                        value = value.replace(/[^\d+\s()\-]/g, '');
                        setPhone(value);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-base sm:text-lg"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={!validatePhone(phone) || loading}
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
                    Код отправлен на {phone}
                  </p>
                  {devCode && (
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-xs text-primary font-mono text-center">
                        Dev режим: Код - {devCode}
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  size="lg" 
                  className="w-full" 
                  disabled={code.length < 4 || loading}
                  onClick={handleVerify}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      Войти
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setStep("phone")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Изменить номер
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground text-sm">
                Нет аккаунта?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

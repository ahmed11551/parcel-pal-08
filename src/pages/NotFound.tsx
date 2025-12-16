import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="container max-w-2xl text-center">
          <div className="bg-card rounded-lg border p-12 shadow-sm">
            <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-4">Страница не найдена</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              К сожалению, страница <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> не существует.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  На главную
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/tasks">
                  <Search className="w-4 h-4 mr-2" />
                  Найти задания
                </Link>
              </Button>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-4">Популярные страницы:</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/tasks" className="text-primary hover:underline text-sm">Задания</Link>
                <Link to="/create-task" className="text-primary hover:underline text-sm">Создать задание</Link>
                <Link to="/login" className="text-primary hover:underline text-sm">Войти</Link>
                <Link to="/register" className="text-primary hover:underline text-sm">Регистрация</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, Package, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border safe-area-top">
      <nav className="container flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SendBuddy</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/tasks" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Задания
          </Link>
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Как это работает
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Мои заказы
          </Link>
              <Link to="/create-task" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Создать задание
          </Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <span>{user?.name || "Профиль"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Профиль
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
          <Button variant="ghost" asChild>
            <Link to="/login">Войти</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Регистрация</Link>
          </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-fade-in">
          <div className="container py-4 flex flex-col gap-4">
            <Link
              to="/tasks"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Задания
            </Link>
            <Link
              to="/how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Как это работает
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/orders"
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Мои заказы
            </Link>
            <Link
                  to="/create-task"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
                  Создать задание
            </Link>
            <Link
                  to="/profile"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
                  Профиль
            </Link>
              </>
            )}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {isAuthenticated ? (
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              ) : (
                <>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Войти</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/register">Регистрация</Link>
              </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

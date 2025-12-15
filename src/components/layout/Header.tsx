import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, Package, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <nav className="container flex items-center justify-between h-16">
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
          <Link to="/safety" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Безопасность
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Войти</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Регистрация</Link>
          </Button>
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
            <Link
              to="/safety"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Безопасность
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Войти</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

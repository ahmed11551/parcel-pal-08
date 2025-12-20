import { Link } from "react-router-dom";
import { Plane, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SendBuddy</span>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed">
              Безопасная P2P-платформа для передачи посылок через путешественников
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Платформа</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/tasks" className="text-background/60 hover:text-background transition-colors text-sm">
                  Задания
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-background/60 hover:text-background transition-colors text-sm">
                  Как это работает
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-background/60 hover:text-background transition-colors text-sm">
                  Безопасность
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Поддержка</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-background/60 hover:text-background transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-background/60 hover:text-background transition-colors text-sm">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-background/60 hover:text-background transition-colors text-sm">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-background/60 text-sm">
                <Mail className="w-4 h-4" />
                support@sendbuddy.app
              </li>
              <li className="flex items-center gap-2 text-background/60 text-sm">
                <Phone className="w-4 h-4" />
                +7 (800) 123-45-67
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/40 text-xs sm:text-sm text-center md:text-left">
            © 2025-2026 SendBuddy. Все права защищены. Sebiev IT Group.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="text-background/40 hover:text-background transition-colors text-xs sm:text-sm">
              Telegram
            </a>
            <a href="#" className="text-background/40 hover:text-background transition-colors text-xs sm:text-sm">
              VK
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

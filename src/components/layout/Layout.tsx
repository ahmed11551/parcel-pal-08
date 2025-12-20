import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 pb-safe overflow-x-hidden">
        <div className="w-full max-w-full">
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

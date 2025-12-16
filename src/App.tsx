import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initTelegramWebApp } from "./lib/telegram";
import { initVKApp } from "./lib/vk";
import Index from "./pages/Index";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import CreateTask from "./pages/CreateTask";
import Orders from "./pages/Orders";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Safety from "./pages/Safety";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      initTelegramWebApp();
    }

    // Инициализация VK Mini App
    if (window.vkBridge || (window.location.search.includes('vk_platform') && window.location.search.includes('vk_app_id'))) {
      initVKApp();
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route
                path="/create-task"
                element={
                  <PrivateRoute>
                    <CreateTask />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat/:orderId"
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/safety" element={<Safety />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

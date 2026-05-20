import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CategoryDetail from "./pages/CategoryDetail";
import SubcategoryDetail from "./pages/SubcategoryDetail";
import FeaturedCardsPage from "./pages/FeaturedCardsPage";
import AllSubcategoriesPage from "./pages/AllSubcategoriesPage";
import ContactUs from "./pages/ContactUs";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    { path: "/", element: <Index /> },
    { path: "/contact", element: <ContactUs /> },
    { path: "/category/:id", element: <CategoryDetail /> },
    { path: "/category/:categoryId/subcategory/:subcategoryId", element: <SubcategoryDetail /> },
    { path: "/category/:categoryId/subcategories", element: <AllSubcategoriesPage /> },
    { path: "/featured-cards/:sectionId", element: <FeaturedCardsPage /> },
    { path: "/admin/login", element: <AdminLogin /> },
    { path: "/admin", element: <AdminDashboard /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => {
  useEffect(() => {
    /*
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Disable Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
      }
      // Disable Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
      }
      // Disable Ctrl+U (view source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
      }
    };

    // Disable devtools via console
    const disableDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        document.body.innerHTML =
          "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 24px; font-weight: bold; color: red;'>Inspect Element is disabled!</div>";
      }
    };

    const devToolsCheck = setInterval(disableDevTools, 1000);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsCheck);
    };
    */
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider
            router={router}
            future={{
              v7_startTransition: true,
            }}
          />
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;

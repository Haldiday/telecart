import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import { SearchProvider } from "./contexts/SearchContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CategoryDetail from "./pages/CategoryDetail";
import SubcategoryBrands from "./components/home/SubcategoryBrands";
import FeaturedCardsPage from "./pages/FeaturedCardsPage";
import AllSubcategoriesPage from "./pages/AllSubcategoriesPage";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import RefundPolicy1 from "./pages/RefundPolicy1";
import RefundPolicy2 from "./pages/RefundPolicy2";
import RefundPolicy3 from "./pages/RefundPolicy3";
import RefundPolicy4 from "./pages/RefundPolicy4";
import FAQs from "./pages/FAQs";
import AdvertisePage from "./pages/AdvertisePage";
import GetListedPage from "./pages/GetListedPage";
import WriteForUsPage from "./pages/WriteForUsPage";
import VendorGuidelinesPage from "./pages/VendorGuidelinesPage";
import BrowseAllDirectoriesPage from "./pages/BrowseAllDirectoriesPage";
import SeeAllPage from "./pages/SeeAllPage";
import FeaturedCardsSeeAllPage from "./pages/FeaturedCardsSeeAllPage";
import OffersSeeAllPage from "./pages/OffersSeeAllPage";
import Ads3ColSeeAllPage from "./pages/Ads3ColSeeAllPage";
import BrandActionLinksPage from "./pages/BrandActionLinksPage";
import BrandActionLinksSeeAllPage from "./pages/BrandActionLinksSeeAllPage";
import { AuthLayout } from "./components/layout/AuthLayout";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    {
      element: <AuthLayout />,
      children: [
        { path: "/", element: <Index /> },
        { path: "/contact", element: <ContactUs /> },
        { path: "/about-us", element: <AboutUs /> },
        { path: "/privacy-policy", element: <PrivacyPolicy /> },
        { path: "/terms-of-service", element: <TermsOfService /> },
        { path: "/refund-policy", element: <RefundPolicy /> },
        { path: "/refund-policy-1", element: <RefundPolicy1 /> },
        { path: "/refund-policy-2", element: <RefundPolicy2 /> },
        { path: "/refund-policy-3", element: <RefundPolicy3 /> },
        { path: "/refund-policy-4", element: <RefundPolicy4 /> },
        { path: "/faqs", element: <FAQs /> },
        { path: "/advertise", element: <AdvertisePage /> },
        { path: "/get-listed", element: <GetListedPage /> },
        { path: "/write-for-us", element: <WriteForUsPage /> },
                  { path: "/vendor-guidelines", element: <VendorGuidelinesPage /> },
        { path: "/browse-all-directories", element: <BrowseAllDirectoriesPage /> },
        { path: "/see-all", element: <SeeAllPage /> },
        { path: "/see-all/featured-cards/:sectionId", element: <FeaturedCardsSeeAllPage /> },
        { path: "/see-all/offers/:sectionId", element: <OffersSeeAllPage /> },
        { path: "/see-all/3-ads/:sectionId", element: <Ads3ColSeeAllPage /> },
        { path: "/category/:id", element: <CategoryDetail /> },
        { path: "/category/:categoryId/subcategory/:subcategoryId/brands", element: <SubcategoryBrands /> },
        { path: "/category/:categoryId/subcategory/:subcategoryId/brand/:brandId/action-links", element: <BrandActionLinksPage /> },
        { path: "/category/:categoryId/subcategory/:subcategoryId/brand/:brandId/action-links/see-all", element: <BrandActionLinksSeeAllPage /> },
        { path: "/category/:categoryId/subcategories", element: <AllSubcategoriesPage /> },
        { path: "/featured-cards/:sectionId", element: <FeaturedCardsPage /> },
        { path: "/admin/login", element: <AdminLogin /> },
        { path: "/admin", element: <AdminDashboard /> },
        { path: "*", element: <NotFound /> },
      ]
    }
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

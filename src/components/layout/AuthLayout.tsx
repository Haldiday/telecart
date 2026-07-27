import { Outlet, useLocation } from "react-router-dom";
import { SearchProvider } from "@/contexts/SearchContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useLayoutEffect } from "react";

export const AuthLayout = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <AuthProvider>
      <SearchProvider>
        <Outlet />
      </SearchProvider>
    </AuthProvider>
  );
};

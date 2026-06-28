import { Outlet, useLocation } from "react-router-dom";
import { SearchProvider } from "@/contexts/SearchContext";
import { useLayoutEffect } from "react";

export const AuthLayout = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <SearchProvider>
      <Outlet />
    </SearchProvider>
  );
};

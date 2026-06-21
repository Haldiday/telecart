import { Outlet } from "react-router-dom";
import { SearchProvider } from "@/contexts/SearchContext";

export const AuthLayout = () => {
  return (
    <SearchProvider>
      <Outlet />
    </SearchProvider>
  );
};

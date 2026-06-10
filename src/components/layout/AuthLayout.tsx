import { Outlet } from "react-router-dom";
import { MSG91AuthProvider } from "@/contexts/MSG91AuthContext";
import { MSG91LoginModal } from "@/components/auth/MSG91LoginModal";
import { LinkInterceptor } from "@/components/LinkInterceptor";

export const AuthLayout = () => {
  return (
    <MSG91AuthProvider>
      <LinkInterceptor />
      <Outlet />
      {/* <MSG91LoginModal /> */}
    </MSG91AuthProvider>
  );
};

import { Outlet } from "react-router-dom";
import { MSG91AuthProvider } from "@/contexts/MSG91AuthContext";
import { MSG91LoginModal } from "@/components/auth/MSG91LoginModal";

export const AuthLayout = () => {
  return (
    <MSG91AuthProvider>
      <Outlet />
      {/* <MSG91LoginModal /> */}
    </MSG91AuthProvider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSmartNavigationUrl } from '@/lib/smart-embed';

interface UserData {
  name: string;
  phoneNumber: string;
  email: string;
  isSignedUp?: boolean;
}

interface MSG91AuthContextType {
  isLoggedIn: boolean;
  userData: UserData | null;
  login: (userData: UserData) => void;
  logout: () => void;
  checkAuthAndNavigate: (targetPath: string) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  pendingPath: string | null;
}

const MSG91AuthContext = createContext<MSG91AuthContextType | undefined>(undefined);

export const MSG91AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedSession = localStorage.getItem('msg91_session');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setUserData(data);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (data: UserData) => {
    const sessionData = { ...data, timestamp: Date.now(), isSignedUp: true };
    localStorage.setItem('msg91_session', JSON.stringify(sessionData));
    setUserData(sessionData);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    
    // Redirect to pending path if it exists
    if (pendingPath) {
      navigate(getSmartNavigationUrl(pendingPath));
      setPendingPath(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('msg91_session');
    setIsLoggedIn(false);
    setUserData(null);
    navigate('/'); // Always go to home on logout
  };

  const checkAuthAndNavigate = (targetPath: string) => {
    // Commented out login requirement
    /*
    if (isLoggedIn) {
      if (isExternalUrl(targetPath)) {
        window.location.href = targetPath;
      } else {
        navigate(targetPath);
      }
    } else {
      setPendingPath(targetPath);
      setShowLoginModal(true);
    }
    */
    
    // Direct navigation
    navigate(getSmartNavigationUrl(targetPath));
  };

  return (
    <MSG91AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        login, 
        logout, 
        checkAuthAndNavigate, 
        showLoginModal, 
        setShowLoginModal,
        pendingPath
      }}
    >
      {children}
    </MSG91AuthContext.Provider>
  );
};

export const useMSG91Auth = () => {
  const context = useContext(MSG91AuthContext);
  if (context === undefined) {
    throw new Error('useMSG91Auth must be used within a MSG91AuthProvider');
  }
  return context;
};

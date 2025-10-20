import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import { SecurityAlert, useSessionTimeout } from './SecurityAlert';

interface SecurityContextType {
  showSecurityAlert: (type: 'session_timeout' | 'security_warning' | 'unlock_required', message?: string) => void;
  hideSecurityAlert: () => void;
  isSecurityAlertOpen: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { isUnlocked: isLocked } = useLocalWallet();
  const { warningShown, setWarningShown } = useSessionTimeout();
  
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'session_timeout' | 'security_warning' | 'unlock_required';
    message?: string;
  }>({
    isOpen: false,
    type: 'security_warning'
  });

  const showSecurityAlert = (
    type: 'session_timeout' | 'security_warning' | 'unlock_required', 
    message?: string
  ) => {
    setAlertState({
      isOpen: true,
      type,
      message
    });
  };

  const hideSecurityAlert = () => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // 监听钱包锁定状态变化
  useEffect(() => {
    if (isLocked && !alertState.isOpen) {
      showSecurityAlert('unlock_required');
    }
  }, [isLocked]);

  // 监听会话超时警告
  useEffect(() => {
    if (warningShown && !alertState.isOpen) {
      showSecurityAlert('session_timeout');
      setWarningShown(false);
    }
  }, [warningShown]);

  const contextValue: SecurityContextType = {
    showSecurityAlert,
    hideSecurityAlert,
    isSecurityAlertOpen: alertState.isOpen
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
      <SecurityAlert
        isOpen={alertState.isOpen}
        onClose={hideSecurityAlert}
        type={alertState.type}
        message={alertState.message}
      />
    </SecurityContext.Provider>
  );
};
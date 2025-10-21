import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface SecurityAlertProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'session_timeout' | 'security_warning' | 'unlock_required';
  message?: string;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  message 
}) => {
  const { t } = useTranslation();
  const { unlockWallet: unlock, settings, currentWallet } = useLocalWallet();
  const sessionTimeout = settings?.sessionTimeout || 30;
  const { handleSuccess, handleError } = useErrorHandler();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      handleError(new Error('No password'), t('common.wallet.enter_password'));
      return;
    }

    if (!currentWallet) {
      handleError(new Error('No wallet found'), t('common.wallet.no_wallet_found'));
      return;
    }

    setIsUnlocking(true);
    try {
      await unlock(currentWallet.id, password);
      setPassword('');
      handleSuccess(t('common.wallet.wallet_unlocked'));
      onClose();
    } catch (error) {
      handleError(error, t('common.wallet.password_error'));
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUnlocking) {
      handleUnlock();
    }
  };

  const getAlertContent = () => {
    switch (type) {
      case 'session_timeout':
        return {
          icon: <Clock className="w-6 h-6 text-orange-500" />,
          title: t('common.wallet.session_timeout'),
          description: t('common.wallet.session_timeout_desc', { timeout: sessionTimeout }),
          actions: (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t('common.wallet.got_it')}
              </Button>
            </DialogFooter>
          )
        };

      case 'security_warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          title: t('common.wallet.security_warning'),
          description: message || t('common.wallet.security_warning_desc'),
          actions: (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t('common.wallet.i_understand')}
              </Button>
            </DialogFooter>
          )
        };

      case 'unlock_required':
        return {
          icon: <Lock className="w-6 h-6 text-primary" />,
          title: t('common.wallet.wallet_locked'),
          description: t('common.wallet.unlock_required_desc'),
          actions: (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unlock-password">{t('common.wallet.wallet_password')}</Label>
                <div className="relative">
                  <Input
                    id="unlock-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('common.wallet.enter_wallet_password')}
                    disabled={isUnlocking}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isUnlocking}
                >
                  {t('common.wallet.cancel')}
                </Button>
                <Button 
                  onClick={handleUnlock}
                  disabled={!password || isUnlocking}
                >
                  {isUnlocking ? t('common.wallet.unlocking') : t('common.wallet.unlock')}
                </Button>
              </DialogFooter>
            </div>
          )
        };

      default:
        return {
          icon: <Shield className="w-6 h-6 text-muted-foreground" />,
          title: t('common.wallet.security_tip'),
          description: t('common.wallet.unknown_security_type'),
          actions: (
            <DialogFooter>
              <Button onClick={onClose}>{t('common.wallet.confirm')}</Button>
            </DialogFooter>
          )
        };
    }
  };

  const content = getAlertContent();

  // 清理密码输入框
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {content.icon}
            {content.title}
          </DialogTitle>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        {content.actions}
      </DialogContent>
    </Dialog>
  );
};

// 会话超时管理 Hook
export const useSessionTimeout = () => {
  const { isUnlocked: isLocked, settings, lockWallet: lock } = useLocalWallet();
  const sessionTimeout = settings?.sessionTimeout || 30;
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [warningShown, setWarningShown] = useState(false);

  const resetTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!isLocked) {
      // 设置会话超时
      const newTimeoutId = setTimeout(() => {
        lock();
        setWarningShown(false);
      }, sessionTimeout * 60 * 1000);

      setTimeoutId(newTimeoutId);

      // 在超时前5分钟显示警告
      if (sessionTimeout > 5) {
        setTimeout(() => {
          if (!warningShown && !isLocked) {
            setWarningShown(true);
            // 这里可以触发警告对话框
          }
        }, (sessionTimeout - 5) * 60 * 1000);
      }
    }
  };

  useEffect(() => {
    resetTimeout();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLocked, sessionTimeout]);

  // 监听用户活动来重置超时
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetTimeoutHandler = () => {
      if (!isLocked) {
        resetTimeout();
        setWarningShown(false);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
    };
  }, [isLocked, sessionTimeout]);

  return {
    resetTimeout,
    warningShown,
    setWarningShown
  };
};
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSolana } from '../../components/solana-provider';
import { useWalletConnect } from '../providers/WalletConnectProvider';
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
  Wallet,
  Shield,
  Clock,
  Trash2,
  Copy,
  Settings,
  Lock,
  Unlock,
  AlertTriangle,
  Smartphone,
  Key
} from 'lucide-react';

interface WalletManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletManagement: React.FC<WalletManagementProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  // 使用新的 Solana Provider
  const { selectedWallet, selectedAccount } = useSolana();
  
  // 从新的钱包系统获取状态
  const connected = !!selectedWallet && !!selectedAccount;
  const publicKey = selectedAccount?.publicKey || null;
  const disconnect = () => {
    // 断开连接功能暂时禁用
    console.log('Disconnect wallet');
  };

  const { 
    isConnected: wcConnected, 
    sessions, 
    disconnectSession: wcDisconnect,
    accounts: wcAccounts 
  } = useWalletConnect();
  const {
    wallets,
    currentWallet,
    isUnlocked: isLocked,
    unlockWallet: unlock,
    lockWallet: lock,
    settings,
    updateSettings
  } = useLocalWallet();
  
  const sessionTimeout = settings?.sessionTimeout || 30;
  const setSessionTimeout = (timeout: number) => {
    updateSettings({ sessionTimeout: timeout });
  };
  const { handleSuccess, handleError, handleWarning } = useErrorHandler();

  const [activeTab, setActiveTab] = useState<'wallets' | 'security' | 'sessions'>('wallets');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [newTimeout, setNewTimeout] = useState((sessionTimeout || 30).toString());
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleUnlock = async () => {
    try {
      if (currentWallet) {
        await unlock(currentWallet.id, unlockPassword);
        setUnlockPassword('');
        handleSuccess(t('wallet.wallet_unlocked'));
      }
    } catch (error) {
      handleError(error, t('wallet.unlock_failed'));
    }
  };

  const handleLock = () => {
    lock();
    handleSuccess(t('wallet.wallet_locked'));
  };

  const handleRemoveWallet = async (walletId: string | null) => {
    if (!walletId) {
      handleError(new Error('Missing wallet id'), t('wallet.remove_wallet_failed'));
      return;
    }

    try {
      // 需要密码来删除钱包，这里暂时跳过实际删除
      // await removeWallet(walletId, password);
      setConfirmRemove(null);
      handleWarning(t('wallet.remove_wallet_requires_password'));
    } catch (error) {
      handleError(error, t('wallet.remove_wallet_failed'));
    }
  };

  const handleUpdateTimeout = () => {
    const timeout = parseInt(newTimeout);
    if (timeout >= 5 && timeout <= 1440) {
      setSessionTimeout(timeout);
      handleSuccess(t('wallet.session_timeout_updated'));
    } else {
      handleError(new Error('Invalid timeout'), t('wallet.session_timeout_range_error'));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    handleSuccess(t('wallet.copied'));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('wallet.wallet_management_title')}
          </DialogTitle>
          <DialogDescription>
            {t('wallet.management_desc')}
          </DialogDescription>
        </DialogHeader>

        {/* 标签页导航 */}
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
              activeTab === 'wallets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            {t('wallet.wallets')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            {t('wallet.security')}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            {t('wallet.sessions')}
          </button>
        </div>

        <div className="mt-3 sm:mt-4">
          {/* 钱包标签页 */}
          {activeTab === 'wallets' && (
            <div className="space-y-3 sm:space-y-4">
              {/* 浏览器钱包 */}
              {connected && publicKey && (
                <div className="p-2 sm:p-3 lg:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-medium">{t('wallet.browser_wallet')}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 break-all">
                          {publicKey ? formatAddress(publicKey.toString()) : t('wallet.not_connected')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publicKey && copyToClipboard(publicKey.toString())}
                        disabled={!publicKey}
                        className="touch-manipulation text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={disconnect}
                        className="touch-manipulation text-xs sm:text-sm px-2 sm:px-3"
                      >
                        {t('wallet.disconnect')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* WalletConnect 钱包 */}
              {wcConnected && wcAccounts.length > 0 && (
                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{t('wallet.mobile_wallet')}</h3>
                        <p className="text-sm text-gray-500 break-all">
                          {formatAddress(wcAccounts[0])}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(wcAccounts[0])}
                        className="touch-manipulation"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => wcDisconnect()}
                        className="touch-manipulation"
                      >
                        {t('wallet.disconnect')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 本地钱包 */}
              {wallets.map((wallet) => (
                <div key={wallet.id} className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{wallet.name}</h3>
                        <p className="text-sm text-gray-500 break-all">
                          {formatAddress(wallet.publicKey)}
                        </p>
                        {wallet.id === currentWallet?.id && (
                          <span className="text-xs text-green-600 font-medium">{t('wallet.current_wallet')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(wallet.publicKey)}
                        className="touch-manipulation"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmRemove(wallet.id)}
                        className="text-red-600 hover:text-red-700 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {!connected && !wcConnected && wallets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('wallet.no_connected_wallets')}</p>
                </div>
              )}
            </div>
          )}

          {/* 安全标签页 */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* 钱包锁定状态 */}
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-red-500" />
                    ) : (
                      <Unlock className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <h3 className="font-medium">{t('wallet.wallet_lock')}</h3>
                      <p className="text-sm text-gray-500">
                        {isLocked ? t('wallet.wallet_locked') : t('wallet.wallet_unlocked')}
                      </p>
                    </div>
                  </div>
                  {!isLocked && (
                    <Button onClick={handleLock} variant="outline" size="sm" className="touch-manipulation">
                      {t('wallet.lock_now')}
                    </Button>
                  )}
                </div>

                {isLocked && (
                  <div className="space-y-3">
                    <Label htmlFor="unlock-password">{t('wallet.enter_password_to_unlock')}</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="unlock-password"
                        type="password"
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        placeholder={t('wallet.enter_wallet_password')}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleUnlock} 
                        disabled={!unlockPassword}
                        className="touch-manipulation"
                      >
                        {t('wallet.unlock')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 会话超时设置 */}
              <div className="p-3 sm:p-4 border rounded-lg">
                <h3 className="font-medium mb-3">{t('wallet.session_timeout_settings')}</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    value={newTimeout}
                    onChange={(e) => setNewTimeout(e.target.value)}
                    placeholder={t('wallet.timeout_minutes_placeholder')}
                    min="1"
                    max="1440"
                    className="flex-1"
                  />
                  <Button onClick={handleUpdateTimeout} variant="outline" className="touch-manipulation">
                    {t('buttons.update')}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('wallet.current_setting')}: {sessionTimeout || 30} {t('wallet.minutes')}
                </p>
              </div>

              {/* 安全提示 */}
              <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800">{t('wallet.security_tips')}</h4>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• {t('wallet.security_tip_1')}</li>
                      <li>• {t('wallet.security_tip_2')}</li>
                      <li>• {t('wallet.security_tip_3')}</li>
                      <li>• {t('wallet.security_tip_4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 会话标签页 */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              {/* WalletConnect 会话 */}
              {sessions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">{t('wallet.walletconnect_sessions')}</h3>
                  {sessions.map((session) => (
                    <div key={session.topic} className="p-3 sm:p-4 border rounded-lg mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium break-all">{session.peer.metadata.name}</h4>
                          <p className="text-sm text-gray-500 break-all">
                            {session.peer.metadata.url}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => wcDisconnect()}
                          className="text-red-600 hover:text-red-700 touch-manipulation flex-shrink-0"
                        >
                          {t('wallet.disconnect')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 本地钱包会话信息 */}
              {currentWallet && !isLocked && (
                <div>
                  <h3 className="font-medium mb-3">{t('wallet.local_wallet_sessions')}</h3>
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-sm text-gray-500">{t('wallet.current_wallet')}:</span>
                        <span className="text-sm font-medium break-all">{currentWallet.name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-sm text-gray-500">{t('wallet.session_status')}:</span>
                        <span className="text-sm text-green-600">{t('wallet.active')}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-sm text-gray-500">{t('wallet.auto_lock')}:</span>
                        <span className="text-sm">{sessionTimeout || 30} {t('wallet.minutes')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sessions.length === 0 && (!currentWallet || isLocked) && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('wallet.no_active_sessions')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 删除确认对话框 */}
        {confirmRemove && (
          <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
            <DialogContent className="max-w-sm mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="text-base">{t('wallet.confirm_remove_wallet')}</DialogTitle>
                <DialogDescription className="text-sm">
                  {t('wallet.remove_wallet_warning')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmRemove(null)}
                  className="touch-manipulation"
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveWallet(confirmRemove)}
                  className="touch-manipulation"
                >
                  {t('wallet.confirm_remove')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
"use client";

import React, { useState } from 'react';
import {
  Wallet,
  LogOut,
  QrCode,
  Key,
  Smartphone,
  Shield,
  Settings,
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  useConnect,
  useDisconnect,
  type UiWallet,
  type UiWalletAccount
} from '@wallet-standard/react';
import { useSolana } from '../../components/solana-provider';
import { useWalletConnect } from '../providers/WalletConnectProvider';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import { QRCodeDisplay } from './QRCodeDisplay';
import { PrivateKeyImport } from './PrivateKeyImport';
import { WalletManagement } from './WalletManagement';
import { LocalWalletLogin } from './LocalWalletLogin';

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function WalletIcon({ wallet, className }: { wallet: UiWallet; className?: string }) {
  return (
    <Avatar className={className}>
      {wallet.icon && (
        <AvatarImage src={wallet.icon} alt={`${wallet.name} icon`} />
      )}
      <AvatarFallback>{wallet.name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function WalletMenuItem({ wallet, onConnect }: { wallet: UiWallet; onConnect: () => void }) {
  const { setWalletAndAccount } = useSolana();
  const { handleError, handleSuccess } = useErrorHandler();
  const { t } = useTranslation('common');
  
  // 安全地获取 connect 函数，避免在钱包不可用时崩溃
  let isConnecting = false;
  let connect: (() => Promise<readonly UiWalletAccount[]>) | null = null;
  
  try {
    const [connecting, connectFn] = useConnect(wallet);
    isConnecting = connecting;
    connect = connectFn;
  } catch (error) {
    // 如果 useConnect hook 失败，说明钱包不可用
    console.warn(`Wallet ${wallet.name} is not available:`, error);
    connect = null;
  }

  // 检查钱包是否真正可用
  type LegacyWalletWindow = Window & {
    phantom?: { solana?: unknown };
    solflare?: unknown;
    backpack?: unknown;
    coinbaseSolana?: unknown;
  };

  const isWalletAvailable = () => {
    if (!wallet) return false;

    // 检查钱包是否有必要的属性
    if (!wallet.name || !wallet.accounts) return false;
    
    // 检查是否有 connect 函数
    if (!connect) return false;
    
    // 对于浏览器扩展钱包，检查是否真正安装
    if (typeof window !== 'undefined') {
      const legacyWindow = window as LegacyWalletWindow;
      // 检查常见的钱包对象
      const walletName = wallet.name.toLowerCase();
      if (walletName.includes('phantom')) {
        return Boolean(legacyWindow.phantom?.solana);
      } else if (walletName.includes('solflare')) {
        return Boolean(legacyWindow.solflare);
      } else if (walletName.includes('backpack')) {
        return Boolean(legacyWindow.backpack);
      } else if (walletName.includes('coinbase')) {
        return Boolean(legacyWindow.coinbaseSolana);
      }
    }
    
    return true; // 对于其他钱包，假设可用
  };

  const handleConnect = async () => {
    if (isConnecting) return;

    // 检查钱包基本可用性
    if (!wallet) {
      handleError(t('wallet.connection_failed'));
      return;
    }

    // 检查钱包是否真正可用
    if (!isWalletAvailable()) {
      handleError(`${wallet.name} ${t('wallet.not_installed')}`);
      return;
    }

    // 检查连接函数是否可用
    if (!connect) {
      handleError(`${wallet.name} ${t('wallet.not_installed')}`);
      return;
    }

    try {
      console.log(`Attempting to connect to ${wallet.name}...`);
      const accounts = await connect();

      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        console.log(`Successfully connected to ${wallet.name}:`, account);
        setWalletAndAccount(wallet, account);
        handleSuccess(`${wallet.name} ${t('wallet.connection_success')}`);
        onConnect();
      } else {
        console.warn(`${wallet.name} connection returned no accounts`);
        handleError(t('wallet.no_accounts'));
      }
    } catch (err: unknown) {
      console.error(`Failed to connect ${wallet.name}:`, err);

      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : null;

      let errorMessage = t('wallet.connection_failed');
      if (message) {
        if (
          message.includes('No underlying Wallet Standard wallet') ||
          message.includes('not found') ||
          message.includes('unregistered')
        ) {
          errorMessage = `${wallet.name} ${t('wallet.not_installed')}`;
        } else if (
          message.includes('User rejected') ||
          message.includes('user rejected') ||
          message.includes('cancelled')
        ) {
          errorMessage = t('wallet.user_rejected');
        } else if (message.includes('timeout')) {
          errorMessage = t('wallet.connection_timeout');
        } else if (message.toLowerCase().includes('network')) {
          errorMessage = t('wallet.network_error');
        } else {
          errorMessage = `${wallet.name}: ${message}`;
        }
      }

      // 显示用户友好的错误提示
      handleError(errorMessage);
    }
  };

  return (
    <button
      className="flex w-full items-center justify-between px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent disabled:pointer-events-none disabled:opacity-50"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      <div className="flex items-center gap-2">
        <WalletIcon wallet={wallet} className="h-6 w-6" />
        <span className="font-medium">{wallet.name}</span>
      </div>
      {isConnecting && (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      )}
    </button>
  );
}

function DisconnectButton({ wallet, onDisconnect }: { wallet: UiWallet; onDisconnect: () => void }) {
  const { setWalletAndAccount } = useSolana();
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  const { t } = useTranslation('common');

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setWalletAndAccount(null, null);
      onDisconnect();
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  return (
    <DropdownMenuItem
      className="text-destructive focus:text-destructive cursor-pointer"
      onClick={handleDisconnect}
      disabled={isDisconnecting}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {t('wallet.disconnect')}
    </DropdownMenuItem>
  );
}

export function EnhancedWalletButton() {
  const {
    wallets,
    selectedWallet,
    selectedAccount,
    isConnected,
    disconnect: resetSolanaConnection
  } = useSolana();
  const { isConnected: wcConnected, currentAccount: wcAccount, disconnectSession } = useWalletConnect();
  const { 
    currentWallet, 
    isUnlocked, 
    lockWallet, 
    wallets: localWallets 
  } = useLocalWallet();
  const { t } = useTranslation('common');
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPrivateKeyImport, setShowPrivateKeyImport] = useState(false);
  const [showWalletManagement, setShowWalletManagement] = useState(false);
  const [showLocalWalletLogin, setShowLocalWalletLogin] = useState(false);

  // 确定当前连接状态和显示信息
  const getConnectionInfo = () => {
    if (isConnected && selectedWallet && selectedAccount) {
      return {
        type: 'extension',
        name: selectedWallet.name,
        address: selectedAccount.address,
        icon: selectedWallet.icon
      };
    }
    
    if (wcConnected && wcAccount) {
      return {
        type: 'walletconnect',
        name: 'WalletConnect',
        address: wcAccount,
        icon: null
      };
    }
    
    if (isUnlocked && currentWallet) {
      return {
        type: 'local',
        name: currentWallet.name,
        address: currentWallet.publicKey,
        icon: null
      };
    }
    
    return null;
  };

  const connectionInfo = getConnectionInfo();
  const hasAnyConnection = connectionInfo !== null;

  // 处理断开连接
  const handleNonExtensionDisconnect = async () => {
    try {
      if (wcConnected) {
        await disconnectSession();
      }

      if (isUnlocked) {
        lockWallet();
      }

      resetSolanaConnection();
      setDropdownOpen(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={hasAnyConnection && connectionInfo ? "outline" : "default"}
            className={`min-w-[100px] sm:min-w-[140px] justify-center text-sm sm:text-base min-h-[36px] sm:min-h-[44px] px-2 sm:px-4 py-1 sm:py-2 touch-manipulation active:scale-95 transition-transform ${
              hasAnyConnection && connectionInfo 
                ? "" 
                : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            }`}
          >
            {hasAnyConnection && connectionInfo ? (
              <>
                <div className="flex items-center gap-1 sm:gap-2">
                  {connectionInfo.icon ? (
                    <Avatar className="h-3 w-3 sm:h-4 sm:w-4">
                      <AvatarImage src={connectionInfo.icon} alt={`${connectionInfo.name} icon`} />
                      <AvatarFallback>{connectionInfo.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      {connectionInfo.type === 'walletconnect' ? (
                        <QrCode className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                      ) : connectionInfo.type === 'local' ? (
                        <Key className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                      ) : (
                        <Wallet className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                      )}
                    </div>
                  )}
                  <span className="font-mono text-xs sm:text-sm">
                    {truncateAddress(connectionInfo.address)}
                  </span>
                </div>
              </>
            ) : (
              <span>{t('wallet.login')}</span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[280px] sm:w-[320px] max-h-[80vh] overflow-y-auto">
          {!hasAnyConnection ? (
            <>
              <DropdownMenuLabel className="text-sm">{t('wallet.select_connection')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* 扫码连接选项 */}
              <DropdownMenuItem
                className="cursor-pointer touch-manipulation p-4 min-h-[60px] active:bg-accent/80 transition-colors"
                onClick={() => {
                  setShowQRCode(true);
                  setDropdownOpen(false);
                }}
              >
                <QrCode className="mr-2 h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm">{t('wallet.scan_connect')}</span>
                  <span className="text-xs text-muted-foreground">{t('wallet.scan_connect_desc')}</span>
                </div>
              </DropdownMenuItem>

              {/* 私钥导入选项 */}
              <DropdownMenuItem
                className="cursor-pointer touch-manipulation p-4 min-h-[60px] active:bg-accent/80 transition-colors"
                onClick={() => {
                  setShowPrivateKeyImport(true);
                  setDropdownOpen(false);
                }}
              >
                <Key className="mr-2 h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm">{t('wallet.import_create')}</span>
                  <span className="text-xs text-muted-foreground">{t('wallet.import_create_desc')}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* 浏览器扩展钱包 */}
              {wallets.length > 0 ? (
                <>
                  <DropdownMenuLabel className="text-sm">{t('wallet.browser_extension')}</DropdownMenuLabel>
                  {wallets.map((wallet, index) => (
                    <WalletMenuItem
                      key={`${wallet.name}-${index}`}
                      wallet={wallet}
                      onConnect={() => setDropdownOpen(false)}
                    />
                  ))}
                </>
              ) : (
                <div className="px-3 py-4 text-center">
                  <Smartphone className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('wallet.no_extension')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('wallet.install_extension')}
                  </p>
                </div>
              )}

              {/* 本地钱包选项 */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-sm">{t('wallet.local_wallet')}</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer touch-manipulation p-4 min-h-[60px] active:bg-accent/80 transition-colors"
                onClick={() => {
                  // 检查是否已解锁，如果已解锁则直接进入钱包管理，否则显示登录界面
                  if (isUnlocked && currentWallet) {
                    setShowWalletManagement(true);
                  } else {
                    setShowLocalWalletLogin(true);
                  }
                  setDropdownOpen(false);
                }}
              >
                <Shield className="mr-2 h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm">{t('wallet.local_wallet')}</span>
                  <span className="text-xs text-muted-foreground">
                    {localWallets.length > 0 
                      ? `${localWallets.length} ${t('wallet.local_wallet_status')} ${isUnlocked ? `(${t('wallet.unlocked')})` : `(${t('wallet.need_login')})`}` 
                      : t('wallet.local_wallet_desc')
                    }
                  </span>
                </div>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-sm">{t('wallet.connected_wallet')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {connectionInfo.icon ? (
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={connectionInfo.icon} alt={`${connectionInfo.name} icon`} />
                      <AvatarFallback>{connectionInfo.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {connectionInfo.type === 'walletconnect' ? (
                        <QrCode className="w-3 h-3 text-white" />
                      ) : connectionInfo.type === 'local' ? (
                        <Key className="w-3 h-3 text-white" />
                      ) : (
                        <Wallet className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{connectionInfo.name}</span>
                    <span className="text-xs text-muted-foreground font-mono break-all">
                      {truncateAddress(connectionInfo.address)}
                    </span>
                    <span className="text-xs text-blue-600">
                      {connectionInfo.type === 'extension' && t('wallet.browser_extension_type')}
                      {connectionInfo.type === 'walletconnect' && t('wallet.walletconnect_type')}
                      {connectionInfo.type === 'local' && t('wallet.local_wallet_type')}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* 钱包管理选项 */}
              {connectionInfo.type === 'local' && (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer touch-manipulation p-4 min-h-[60px]"
                    onClick={() => {
                      setShowWalletManagement(true);
                      setDropdownOpen(false);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('wallet.wallet_management')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    className="cursor-pointer touch-manipulation p-4 min-h-[60px]"
                    onClick={() => {
                      lockWallet();
                      setDropdownOpen(false);
                    }}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {t('wallet.lock_wallet')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                </>
              )}

              {/* 断开连接 */}
              {connectionInfo.type === 'extension' && selectedWallet ? (
                <DisconnectButton
                  wallet={selectedWallet}
                  onDisconnect={() => {
                    resetSolanaConnection();
                    setDropdownOpen(false);
                  }}
                />
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer touch-manipulation p-4 min-h-[60px]"
                  onClick={handleNonExtensionDisconnect}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('wallet.disconnect')}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 二维码连接对话框 */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-[90vw] sm:max-w-md lg:max-w-lg mx-2 sm:mx-auto p-3 sm:p-4 lg:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {t('wallet.scan_title')}
            </DialogTitle>
          </DialogHeader>
          <QRCodeDisplay
            onConnectionSuccess={() => setShowQRCode(false)}
            onConnectionError={(error) => {
              console.error('QR connection error:', error);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 私钥导入对话框 */}
      <Dialog open={showPrivateKeyImport} onOpenChange={setShowPrivateKeyImport}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg lg:max-w-xl mx-2 sm:mx-auto p-3 sm:p-4 lg:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {t('wallet.wallet_management_title')}
            </DialogTitle>
          </DialogHeader>
          <PrivateKeyImport
            onImportSuccess={() => setShowPrivateKeyImport(false)}
            onCancel={() => setShowPrivateKeyImport(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 本地钱包登录对话框 */}
      <Dialog open={showLocalWalletLogin} onOpenChange={setShowLocalWalletLogin}>
        <DialogContent className="max-w-[90vw] sm:max-w-md mx-2 sm:mx-auto p-3 sm:p-4 lg:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('wallet.local_wallet')}
            </DialogTitle>
          </DialogHeader>
          <LocalWalletLogin
            onSuccess={() => {
              setShowLocalWalletLogin(false);
              // 登录成功后可以选择是否直接打开钱包管理
              setShowWalletManagement(true);
            }}
            onCancel={() => setShowLocalWalletLogin(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 钱包管理对话框 */}
      <WalletManagement
        isOpen={showWalletManagement}
        onClose={() => setShowWalletManagement(false)}
      />
    </>
  );
}
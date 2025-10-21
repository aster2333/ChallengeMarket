"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, Check, Wifi, WifiOff, AlertCircle, Smartphone } from 'lucide-react';
import { useWalletConnect } from '../providers/WalletConnectProvider';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';

interface QRCodeDisplayProps {
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: Error) => void;
  className?: string;
}

// 简单的错误处理钩子
const useErrorHandler = () => {
  const handleError = (error: Error | string) => {
    const message = typeof error === 'string' ? error : error.message;
    toast.error(message);
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  return { handleError, handleSuccess };
};

export function QRCodeDisplay({ 
  onConnectionSuccess, 
  onConnectionError, 
  className = '' 
}: QRCodeDisplayProps) {
  const { createSession, isConnecting, isConnected } = useWalletConnect();
  const { handleError, handleSuccess } = useErrorHandler();
  const { t } = useTranslation();
  
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [uri, setUri] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connected' | 'failed'>('idle');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    try {
      setIsGenerating(true);
      setConnectionStatus('waiting');

      // 创建 WalletConnect 会话
      const sessionUri = await createSession();
      setUri(sessionUri);

      // 生成二维码 - 根据屏幕尺寸调整大小
      const isMobile = window.innerWidth < 640;
      const qrCodeSize = isMobile ? 260 : 300;

      const qrCodeOptions = {
        width: qrCodeSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      };

      const dataURL = await QRCode.toDataURL(sessionUri, qrCodeOptions);
      setQrCodeDataURL(dataURL);

      console.log('QR Code generated for URI:', sessionUri);

    } catch (error) {
      console.error('Failed to generate QR code:', error);
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      setConnectionStatus('failed');
      handleError(normalizedError);
      onConnectionError?.(normalizedError);
    } finally {
      setIsGenerating(false);
    }
  }, [createSession, handleError, onConnectionError]);

  // 复制 URI 到剪贴板
  const copyURI = useCallback(async () => {
    if (!uri) return;
    
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      toast.success(t('wallet.qr_link_copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying connection link:', error);
      toast.error(t('wallet.qr_copy_failed'));
    }
  }, [uri, t]);

  // 刷新二维码
  const refreshQRCode = useCallback(async () => {
    try {
      setIsGenerating(true);
      setConnectionStatus('waiting');
      setErrorMessage('');
      
      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error(t('wallet.qr_network_error'));
      }
      
      const newUri = await createSession();
      setUri(newUri);
      
      // 生成二维码
      await generateQRCode();
      
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      let message = t('wallet.qr_refresh_failed');
      if (error instanceof Error) {
        message = error.message;
      }
      setErrorMessage(message);
      setConnectionStatus('failed');
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [createSession, generateQRCode, t]);

  // 监听连接状态变化
  useEffect(() => {
    if (isConnected && connectionStatus === 'waiting') {
      setConnectionStatus('connected');
      onConnectionSuccess?.();
      handleSuccess(t('wallet.connection_success'));
    }
  }, [isConnected, connectionStatus, onConnectionSuccess, handleSuccess, t]);

  // 监听WalletConnect错误事件
  useEffect(() => {
    const handleWalletConnectError = (event: CustomEvent) => {
      const message = event.detail?.message || '连接失败';
      setErrorMessage(message);
      setConnectionStatus('failed');
      setIsGenerating(false);
      toast.error(message);
    };

    window.addEventListener('walletconnect-error', handleWalletConnectError as EventListener);
    
    return () => {
      window.removeEventListener('walletconnect-error', handleWalletConnectError as EventListener);
    };
  }, []);

  // 组件挂载时生成二维码
  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // 渲染连接状态指示器
  const renderStatusIndicator = () => {
    switch (connectionStatus) {
      case 'waiting':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Wifi className="w-5 h-5 animate-pulse" />
            <span className="text-base">{t('wallet.qr_waiting')}</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi className="w-5 h-5" />
            <span className="text-base">{t('wallet.qr_success')}</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <WifiOff className="w-5 h-5" />
            <span className="text-base">{t('wallet.qr_failed')}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-card rounded-lg border shadow-sm p-3 sm:p-4 lg:p-6 max-w-sm sm:max-w-md mx-auto ${className}`}>
      {/* 标题 */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('wallet.qr_scan_title')}</h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground px-2 leading-relaxed">
          {t('wallet.qr_scan_desc')}
        </p>
      </div>

      {/* 二维码显示区域 */}
      <div className="flex flex-col items-center">
        {isGenerating ? (
          <div className="w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[280px] aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 animate-spin" />
              <span className="text-sm sm:text-base text-muted-foreground">{t('wallet.qr_generating')}</span>
            </div>
          </div>
        ) : qrCodeDataURL ? (
          <div className="relative w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[280px]">
            <img 
              src={qrCodeDataURL} 
              alt="WalletConnect QR Code"
              className="w-full aspect-square rounded-lg border shadow-sm"
            />
            {connectionStatus === 'connected' && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <div className="bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-full text-sm sm:text-base font-medium">
                  ✓ {t('wallet.qr_connected')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[280px] aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <WifiOff className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-2 sm:mb-3" />
              <span className="text-sm sm:text-base text-muted-foreground">{t('wallet.qr_generate_failed')}</span>
              <button
                onClick={refreshQRCode}
                className="mt-2 sm:mt-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {t('wallet.qr_retry')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="mt-4 sm:mt-6 flex justify-center">
        {renderStatusIndicator()}
      </div>

      {/* 错误信息显示 */}
      {errorMessage && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
        <button
          onClick={copyURI}
          disabled={!uri || copied}
          className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-medium text-foreground bg-muted hover:bg-muted/80 active:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] sm:min-h-[50px]"
        >
          {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
          {copied ? t('wallet.qr_copied') : t('wallet.qr_copy_link')}
        </button>
        
        <button
          onClick={refreshQRCode}
          disabled={isGenerating || isConnecting}
          className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] sm:min-h-[50px]"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${(isGenerating || isConnecting) ? 'animate-spin' : ''}`} />
          {t('wallet.qr_refresh')}
        </button>
      </div>

      {/* 使用说明 */}
      <div className="mt-3 sm:mt-4 lg:mt-6 p-2 sm:p-3 lg:p-4 bg-blue-50 rounded-lg">
        <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1 sm:mb-2">{t('wallet.qr_instructions_title')}</h4>
        <ul className="text-xs text-blue-800 space-y-0.5 sm:space-y-1 leading-relaxed">
          <li>• {t('wallet.qr_instruction_1')}</li>
          <li>• {t('wallet.qr_instruction_2')}</li>
          <li>• {t('wallet.qr_instruction_3')}</li>
          <li>• {t('wallet.qr_instruction_4')}</li>
        </ul>
      </div>

      {/* 支持的钱包列表 */}
      <div className="mt-3 sm:mt-4 text-center">
        <p className="text-xs text-muted-foreground mb-1 sm:mb-2">{t('wallet.qr_supported_wallets')}</p>
        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded touch-manipulation">Phantom</span>
          <span className="px-2 py-1 bg-muted rounded touch-manipulation">Solflare</span>
          <span className="px-2 py-1 bg-muted rounded touch-manipulation">Glow</span>
          <span className="px-2 py-1 bg-muted rounded touch-manipulation">Exodus</span>
        </div>
      </div>
    </div>
  );
}
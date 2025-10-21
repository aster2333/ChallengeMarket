"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
// import { Alert, AlertDescription } from './ui/alert';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';

interface LocalWalletLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function LocalWalletLogin({ onSuccess, onCancel }: LocalWalletLoginProps) {
  const { 
    wallets, 
    createWallet, 
    unlockWallet, 
    isUnlocked,
    currentWallet 
  } = useLocalWallet();
  const { handleSuccess } = useErrorHandler();
  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletName, setWalletName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查是否有本地钱包存在
  const hasWallets = wallets.length > 0;
  const isRegistering = !hasWallets;

  // 如果已经解锁，直接调用成功回调
  useEffect(() => {
    if (isUnlocked && currentWallet) {
      onSuccess();
    }
  }, [isUnlocked, currentWallet, onSuccess]);

  // 重置错误信息
  useEffect(() => {
    setError('');
  }, [password, confirmPassword, walletName]);

  // 处理登录
  const handleLogin = async () => {
    if (!password.trim()) {
      setError(t('wallet.password_required'));
      return;
    }

    if (wallets.length === 0) {
      setError(t('wallet.no_local_wallet_found'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 尝试解锁第一个钱包（通常是主钱包）
      const firstWallet = wallets[0];
      await unlockWallet(firstWallet.id, password);
      handleSuccess(t('wallet.wallet_unlock_success'));
      onSuccess();
    } catch (err: unknown) {
      console.error('Login failed:', err);
      const message = err instanceof Error ? err.message : null;
      setError(message || t('wallet.password_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    if (!password.trim()) {
      setError(t('wallet.password_required'));
      return;
    }

    if (password.length < 6) {
      setError(t('wallet.password_min_length'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('wallet.password_mismatch'));
      return;
    }

    if (!walletName.trim()) {
      setError(t('wallet.wallet_name_required'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createWallet(password, walletName.trim());
      handleSuccess(t('wallet.wallet_create_success'));
      onSuccess();
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      const message = err instanceof Error ? err.message : null;
      setError(message || t('wallet.create_wallet_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">
            {isRegistering ? t('wallet.create_local_wallet') : t('wallet.login_local_wallet')}
          </CardTitle>
          <CardDescription>
            {isRegistering 
              ? t('wallet.create_wallet_desc') 
              : t('wallet.login_wallet_desc')
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 注册时显示钱包名称输入 */}
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="wallet-name">{t('wallet.wallet_name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wallet-name"
                    type="text"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder={t('wallet.wallet_name_placeholder')}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* 密码输入 */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {isRegistering ? t('wallet.set_password') : t('wallet.wallet_password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegistering ? t('wallet.password_placeholder') : t('wallet.enter_password_placeholder')}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 注册时显示确认密码 */}
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('wallet.confirm_password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('wallet.confirm_password_placeholder')}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isRegistering ? t('wallet.creating') : t('wallet.logging_in')}
                  </div>
                ) : (
                  isRegistering ? t('wallet.create_wallet') : t('wallet.login')
                )}
              </Button>
            </div>
          </form>

          {/* 提示信息 */}
          {isRegistering && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{t('wallet.security_tip')}</strong>
                {t('wallet.security_message')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
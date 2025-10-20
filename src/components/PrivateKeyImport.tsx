"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Key, Shield, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import { validatePrivateKey, validatePassword } from '../utils/crypto';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface PrivateKeyImportProps {
  onImportSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function PrivateKeyImport({ 
  onImportSuccess, 
  onCancel, 
  className = '' 
}: PrivateKeyImportProps) {
  const { importWallet, createWallet } = useLocalWallet();
  const { handleError, handleSuccess } = useErrorHandler();
  
  const [mode, setMode] = useState<'import' | 'create'>('import');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletName, setWalletName] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 验证状态
  const [privateKeyValid, setPrivateKeyValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [passwordMessage, setPasswordMessage] = useState('');

  // 验证私钥
  const handlePrivateKeyChange = (value: string) => {
    setPrivateKey(value);
    if (value.trim()) {
      const isValid = validatePrivateKey(value.trim());
      setPrivateKeyValid(isValid);
    } else {
      setPrivateKeyValid(null);
    }
  };

  // 验证密码
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const validation = validatePassword(value);
      setPasswordValid(validation.isValid);
      setPasswordMessage(validation.message);
    } else {
      setPasswordValid(null);
      setPasswordMessage('');
    }
  };

  // 处理导入
  const handleImport = async () => {
    if (mode === 'import') {
      if (!privateKey.trim()) {
        handleError(new Error('请输入私钥'), '请输入私钥');
        return;
      }
      
      if (!privateKeyValid) {
        handleError(new Error('私钥格式无效'), '私钥格式无效');
        return;
      }
    }

    if (!password) {
      handleError(new Error('请输入密码'), '请输入密码');
      return;
    }

    if (!passwordValid) {
      handleError(new Error(passwordMessage), passwordMessage);
      return;
    }

    if (password !== confirmPassword) {
      handleError(new Error('密码确认不匹配'), '密码确认不匹配');
      return;
    }

    try {
      setIsLoading(true);
      
      if (mode === 'import') {
        await importWallet(privateKey.trim(), password, walletName || undefined);
        handleSuccess('私钥导入成功！');
      } else {
        await createWallet(password, walletName || undefined);
        handleSuccess('新钱包创建成功！');
      }
      
      onImportSuccess?.();
      
    } catch (error) {
      console.error('Import/Create failed:', error);
      handleError(error, mode === 'import' ? '导入失败' : '创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setPrivateKey('');
    setPassword('');
    setConfirmPassword('');
    setWalletName('');
    setPrivateKeyValid(null);
    setPasswordValid(null);
    setPasswordMessage('');
  };

  // 切换模式
  const handleModeChange = (newMode: 'import' | 'create') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className={`bg-card rounded-lg border shadow-sm p-4 sm:p-6 max-w-lg mx-auto ${className}`}>
      {/* 标题和模式切换 */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Key className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">钱包管理</h3>
        </div>
        
        {/* 模式切换按钮 */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => handleModeChange('import')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors min-h-[48px] ${
              mode === 'import'
                ? 'bg-background text-blue-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground active:bg-muted/80'
            }`}
          >
            导入私钥
          </button>
          <button
            onClick={() => handleModeChange('create')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors min-h-[48px] ${
              mode === 'create'
                ? 'bg-background text-blue-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground active:bg-muted/80'
            }`}
          >
            创建新钱包
          </button>
        </div>
      </div>

      {/* 私钥输入（仅导入模式） */}
      {mode === 'import' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            私钥 *
          </label>
          <div className="relative">
            <textarea
              value={privateKey}
              onChange={(e) => handlePrivateKeyChange(e.target.value)}
              placeholder="请输入私钥（支持 Base58、十六进制或数组格式）"
              className={`w-full px-4 py-3 border rounded-lg resize-none h-32 text-sm font-mono leading-relaxed bg-background text-foreground ${
                privateKeyValid === false
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : privateKeyValid === true
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : 'border-border focus:border-blue-500 focus:ring-blue-500'
              } ${showPrivateKey ? '' : 'text-security-disc'}`}
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground active:text-foreground p-2"
            >
              {showPrivateKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            {/* 验证状态指示器 */}
            {privateKeyValid !== null && (
              <div className="absolute right-12 top-3">
                {privateKeyValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {privateKeyValid === false && (
            <p className="mt-2 text-sm text-red-600">
              私钥格式无效，请检查格式是否正确
            </p>
          )}
          
          {privateKeyValid === true && (
            <p className="mt-2 text-sm text-green-600">
              私钥格式有效
            </p>
          )}
        </div>
      )}

      {/* 钱包名称 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          钱包名称（可选）
        </label>
        <input
          type="text"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          placeholder="为您的钱包起个名字"
          className="w-full px-4 py-3 border border-border rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm min-h-[48px] bg-background text-foreground"
        />
      </div>

      {/* 密码输入 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          加密密码 *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="请输入强密码来加密您的私钥"
            className={`w-full px-4 py-3 border rounded-lg pr-12 text-sm min-h-[48px] bg-background text-foreground ${
              passwordValid === false
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : passwordValid === true
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-border focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground active:text-foreground p-2"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {passwordMessage && (
          <p className={`mt-2 text-sm ${passwordValid ? 'text-green-600' : 'text-red-600'}`}>
            {passwordMessage}
          </p>
        )}
      </div>

      {/* 确认密码 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          确认密码 *
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="请再次输入密码"
          className={`w-full px-4 py-3 border rounded-lg text-sm min-h-[48px] bg-background text-foreground ${
            confirmPassword && password !== confirmPassword
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-border focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-2 text-sm text-red-600">
            密码确认不匹配
          </p>
        )}
      </div>

      {/* 安全提示 */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-2">安全提示</h4>
            <ul className="text-sm text-amber-700 space-y-1 leading-relaxed">
              <li>• 私钥将使用 AES 加密算法在本地安全存储</li>
              <li>• 请务必记住您的加密密码，忘记密码将无法恢复钱包</li>
              <li>• 建议使用包含大小写字母、数字和特殊字符的强密码</li>
              <li>• 私钥和密码不会上传到任何服务器</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-3 text-base font-medium text-foreground bg-muted hover:bg-muted/80 active:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[50px]"
        >
          取消
        </button>
        
        <button
          onClick={handleImport}
          disabled={
            isLoading ||
            (mode === 'import' && (!privateKey.trim() || !privateKeyValid)) ||
            !password ||
            !passwordValid ||
            password !== confirmPassword
          }
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[50px]"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {mode === 'import' ? '导入中...' : '创建中...'}
            </>
          ) : (
            <>
              {mode === 'import' ? <Upload className="w-5 h-5" /> : <Key className="w-5 h-5" />}
              {mode === 'import' ? '导入钱包' : '创建钱包'}
            </>
          )}
        </button>
      </div>

      {/* 支持的私钥格式说明 */}
      {mode === 'import' && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">支持的私钥格式：</h4>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <div className="break-all">• <strong>Base58:</strong> 5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYXYB9KF</div>
            <div className="break-all">• <strong>十六进制:</strong> 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</div>
            <div className="break-all">• <strong>数组格式:</strong> [159, 134, 208, 129, 136, 76, 125, ...]</div>
          </div>
        </div>
      )}
    </div>
  );
}
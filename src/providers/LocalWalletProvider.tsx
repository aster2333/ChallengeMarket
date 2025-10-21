"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Keypair, Connection, Transaction } from '@solana/web3.js';
import { 
  validatePrivateKey, 
  createKeypairFromPrivateKey, 
  encryptPrivateKey, 
  decryptPrivateKey, 
  generateNewWallet,
  validatePassword,
  secureClear
} from '../utils/crypto';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useStore } from '../store/useStore';

// 本地存储键名
const STORAGE_KEYS = {
  ENCRYPTED_WALLETS: 'challenge_market_encrypted_wallets',
  CURRENT_WALLET: 'challenge_market_current_wallet',
  WALLET_SETTINGS: 'challenge_market_wallet_settings',
  SESSION_DATA: 'challenge_market_session_data'
};

// 钱包信息接口
export interface LocalWallet {
  id: string;
  name: string;
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: number;
  lastUsed: number;
}

// 会话信息接口
interface SessionData {
  walletId: string;
  unlockedAt: number;
  expiresAt: number;
}

// 钱包设置接口
interface WalletSettings {
  sessionTimeout: number; // 会话超时时间（分钟）
  autoLock: boolean;
  requirePasswordForTransactions: boolean;
}

// 上下文状态接口
interface LocalWalletContextState {
  // 钱包状态
  wallets: LocalWallet[];
  currentWallet: LocalWallet | null;
  isUnlocked: boolean;
  isLoading: boolean;
  
  // 会话管理
  sessionExpiresAt: number | null;
  settings: WalletSettings;
  
  // 钱包操作
  importWallet: (privateKey: string, password: string, name?: string) => Promise<LocalWallet>;
  createWallet: (password: string, name?: string) => Promise<LocalWallet>;
  removeWallet: (walletId: string, password: string) => Promise<void>;
  
  // 会话管理
  unlockWallet: (walletId: string, password: string) => Promise<void>;
  lockWallet: () => void;
  lock: () => void; // 添加 lock 方法别名
  switchWallet: (walletId: string) => void;
  
  // 地址属性
  address?: string; // 添加 address 属性
  
  // 交易操作
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
  
  // 设置管理
  updateSettings: (newSettings: Partial<WalletSettings>) => void;
  
  // 实用方法
  getKeypair: () => Keypair | null;
  exportPrivateKey: (password: string) => Promise<string>;
}

const LocalWalletContext = createContext<LocalWalletContextState | undefined>(undefined);

export function useLocalWallet() {
  const context = useContext(LocalWalletContext);
  if (!context) {
    throw new Error('useLocalWallet must be used within a LocalWalletProvider');
  }
  return context;
}

export function LocalWalletProvider({ children }: { children: React.ReactNode }) {
  const { handleError, handleSuccess } = useErrorHandler();
  const { setUser } = useStore();
  
  // 状态管理
  const [wallets, setWallets] = useState<LocalWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<LocalWallet | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [currentKeypair, setCurrentKeypair] = useState<Keypair | null>(null);
  
  // 默认设置
  const [settings, setSettings] = useState<WalletSettings>({
    sessionTimeout: 30, // 30分钟
    autoLock: true,
    requirePasswordForTransactions: true
  });

  // 从本地存储加载数据
  const loadFromStorage = useCallback(() => {
    try {
      // 加载钱包列表
      const walletsData = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLETS);
      if (walletsData) {
        setWallets(JSON.parse(walletsData));
      }

      // 加载当前钱包
      const currentWalletId = localStorage.getItem(STORAGE_KEYS.CURRENT_WALLET);
      if (currentWalletId && walletsData) {
        const walletsList = JSON.parse(walletsData);
        const wallet = walletsList.find((w: LocalWallet) => w.id === currentWalletId);
        if (wallet) {
          setCurrentWallet(wallet);
        }
      }

      // 加载设置
      const settingsData = localStorage.getItem(STORAGE_KEYS.WALLET_SETTINGS);
      if (settingsData) {
        setSettings({ ...settings, ...JSON.parse(settingsData) });
      }

      // 检查会话状态
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        const now = Date.now();
        
        if (session.expiresAt > now && session.walletId === currentWalletId) {
          setSessionExpiresAt(session.expiresAt);
          // 注意：这里不设置 isUnlocked，因为我们没有解密的私钥
        } else {
          // 清除过期会话
          localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
        }
      }
      
    } catch (error) {
      console.error('Failed to load wallet data from storage:', error);
      handleError(error, '加载钱包数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [handleError, settings]);

  // 保存钱包到本地存储
  const saveWalletsToStorage = useCallback((walletsList: LocalWallet[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_WALLETS, JSON.stringify(walletsList));
    } catch (error) {
      console.error('Failed to save wallets to storage:', error);
      handleError(error, '保存钱包数据失败');
    }
  }, [handleError]);

  // 保存会话数据
  const saveSessionData = useCallback((walletId: string, expiresAt: number) => {
    try {
      const sessionData: SessionData = {
        walletId,
        unlockedAt: Date.now(),
        expiresAt
      };
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(sessionData));
      setSessionExpiresAt(expiresAt);
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }, []);

  // 导入钱包
  const importWallet = useCallback(async (
    privateKey: string, 
    password: string, 
    name?: string
  ): Promise<LocalWallet> => {
    try {
      // 验证私钥
      if (!validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // 验证密码强度
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      // 创建 Keypair 验证私钥有效性
      const keypair = createKeypairFromPrivateKey(privateKey);
      const publicKey = keypair.publicKey.toString();

      // 检查是否已存在相同的钱包
      const existingWallet = wallets.find(w => w.publicKey === publicKey);
      if (existingWallet) {
        throw new Error('Wallet already exists');
      }

      // 加密私钥
      const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

      // 创建钱包对象
      const wallet: LocalWallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || `Wallet ${wallets.length + 1}`,
        publicKey,
        encryptedPrivateKey,
        createdAt: Date.now(),
        lastUsed: Date.now()
      };

      // 更新钱包列表
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);

      // 自动解锁新导入的钱包
      const keypairForUnlock = createKeypairFromPrivateKey(privateKey);
      setCurrentWallet(wallet);
      setCurrentKeypair(keypairForUnlock);
      setIsUnlocked(true);

      // 保存当前钱包
      localStorage.setItem(STORAGE_KEYS.CURRENT_WALLET, wallet.id);

      // 设置会话过期时间
      const expiresAt = Date.now() + (settings.sessionTimeout * 60 * 1000);
      saveSessionData(wallet.id, expiresAt);

      // 安全清除明文私钥
      secureClear(privateKey);

      // 更新全局用户状态
      const userData = {
        address: wallet.publicKey,
        publicKey: wallet.publicKey,
        totalEarnings: 0,
        totalBets: 0,
        challengesCreated: 0,
        challengesAccepted: 0,
        winRate: 0,
        balance: 0,
        nfts: []
      };
      setUser(userData);

      handleSuccess('钱包导入成功并已自动连接');
      return wallet;

    } catch (error) {
      console.error('Failed to import wallet:', error);
      handleError(error, '钱包导入失败');
      throw error;
    }
  }, [wallets, saveWalletsToStorage, handleError, handleSuccess]);

  // 创建新钱包
  const createWallet = useCallback(async (
    password: string, 
    name?: string
  ): Promise<LocalWallet> => {
    try {
      // 验证密码强度
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      // 生成新钱包
      const { privateKey, publicKey } = generateNewWallet();

      // 加密私钥
      const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

      // 创建钱包对象
      const wallet: LocalWallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || `Wallet ${wallets.length + 1}`,
        publicKey,
        encryptedPrivateKey,
        createdAt: Date.now(),
        lastUsed: Date.now()
      };

      // 更新钱包列表
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);

      // 自动解锁新创建的钱包
      const keypairForUnlock = createKeypairFromPrivateKey(privateKey);
      setCurrentWallet(wallet);
      setCurrentKeypair(keypairForUnlock);
      setIsUnlocked(true);

      // 保存当前钱包
      localStorage.setItem(STORAGE_KEYS.CURRENT_WALLET, wallet.id);

      // 设置会话过期时间
      const expiresAt = Date.now() + (settings.sessionTimeout * 60 * 1000);
      saveSessionData(wallet.id, expiresAt);

      // 安全清除明文私钥
      secureClear(privateKey);

      // 更新全局用户状态
      const userData = {
        address: wallet.publicKey,
        publicKey: wallet.publicKey,
        totalEarnings: 0,
        totalBets: 0,
        challengesCreated: 0,
        challengesAccepted: 0,
        winRate: 0,
        balance: 0,
        nfts: []
      };
      setUser(userData);

      handleSuccess('新钱包创建成功并已自动连接');
      return wallet;

    } catch (error) {
      console.error('Failed to create wallet:', error);
      handleError(error, '创建钱包失败');
      throw error;
    }
  }, [wallets, saveWalletsToStorage, handleError, handleSuccess]);

  // 删除钱包
  const removeWallet = useCallback(async (walletId: string, password: string): Promise<void> => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // 验证密码
      try {
        decryptPrivateKey(wallet.encryptedPrivateKey, password);
      } catch {
        throw new Error('Invalid password');
      }

      // 如果是当前钱包，先锁定并清除用户状态
      if (currentWallet?.id === walletId) {
        setIsUnlocked(false);
        setCurrentKeypair(null);
        setSessionExpiresAt(null);
        localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
        setUser(null);
      }

      // 从列表中移除
      const updatedWallets = wallets.filter(w => w.id !== walletId);
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);

      handleSuccess('钱包删除成功');

    } catch (error) {
      console.error('Failed to remove wallet:', error);
      handleError(error, '删除钱包失败');
      throw error;
    }
  }, [wallets, currentWallet, saveWalletsToStorage, handleError, handleSuccess, setUser]);

  // 解锁钱包
  const unlockWallet = useCallback(async (walletId: string, password: string): Promise<void> => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // 解密私钥
      const privateKey = decryptPrivateKey(wallet.encryptedPrivateKey, password);
      
      // 创建 Keypair
      const keypair = createKeypairFromPrivateKey(privateKey);

      // 更新状态
      setCurrentWallet(wallet);
      setCurrentKeypair(keypair);
      setIsUnlocked(true);

      // 保存当前钱包
      localStorage.setItem(STORAGE_KEYS.CURRENT_WALLET, walletId);

      // 设置会话过期时间
      const expiresAt = Date.now() + (settings.sessionTimeout * 60 * 1000);
      saveSessionData(walletId, expiresAt);

      // 更新最后使用时间
      const updatedWallet = { ...wallet, lastUsed: Date.now() };
      const updatedWallets = wallets.map(w => w.id === walletId ? updatedWallet : w);
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);

      // 安全清除明文私钥
      secureClear(privateKey);

      // 更新全局用户状态
      const userData = {
        address: wallet.publicKey,
        publicKey: wallet.publicKey,
        totalEarnings: 0,
        totalBets: 0,
        challengesCreated: 0,
        challengesAccepted: 0,
        winRate: 0,
        balance: 0,
        nfts: []
      };
      setUser(userData);

      handleSuccess('钱包解锁成功');

    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      handleError(error, '钱包解锁失败');
      throw error;
    }
  }, [wallets, settings.sessionTimeout, saveSessionData, saveWalletsToStorage, handleError, handleSuccess]);

  // 锁定钱包
  const lockWallet = useCallback(() => {
    setIsUnlocked(false);
    setCurrentKeypair(null);
    setSessionExpiresAt(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
    
    // 清除全局用户状态
    setUser(null);
    
    handleSuccess('钱包已锁定');
  }, [handleSuccess, setUser]);

  // 切换钱包
  const switchWallet = useCallback((walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      // 锁定当前钱包
      lockWallet();
      
      // 设置新的当前钱包（但保持锁定状态）
      setCurrentWallet(wallet);
      localStorage.setItem(STORAGE_KEYS.CURRENT_WALLET, walletId);
    }
  }, [wallets, lockWallet]);

  // 签名交易
  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!isUnlocked || !currentKeypair) {
      throw new Error('Wallet is locked');
    }

    try {
      transaction.sign(currentKeypair);
      return transaction;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      handleError(error, '交易签名失败');
      throw error;
    }
  }, [isUnlocked, currentKeypair, handleError]);

  // 签名并发送交易
  const signAndSendTransaction = useCallback(async (
    transaction: Transaction, 
    connection: Connection
  ): Promise<string> => {
    if (!isUnlocked || !currentKeypair) {
      throw new Error('Wallet is locked');
    }

    try {
      // 签名交易
      transaction.sign(currentKeypair);
      
      // 发送交易
      const signature = await connection.sendRawTransaction(transaction.serialize());
      
      // 确认交易
      await connection.confirmTransaction(signature);
      
      return signature;
    } catch (error) {
      console.error('Failed to sign and send transaction:', error);
      handleError(error, '交易发送失败');
      throw error;
    }
  }, [isUnlocked, currentKeypair, handleError]);

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<WalletSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_KEYS.WALLET_SETTINGS, JSON.stringify(updatedSettings));
  }, [settings]);

  // 获取当前 Keypair
  const getKeypair = useCallback((): Keypair | null => {
    return isUnlocked ? currentKeypair : null;
  }, [isUnlocked, currentKeypair]);

  // 导出私钥
  const exportPrivateKey = useCallback(async (password: string): Promise<string> => {
    if (!currentWallet) {
      throw new Error('No wallet selected');
    }

    try {
      const privateKey = decryptPrivateKey(currentWallet.encryptedPrivateKey, password);
      return privateKey;
    } catch (error) {
      console.error('Failed to export private key:', error);
      handleError(error, '导出私钥失败');
      throw error;
    }
  }, [currentWallet, handleError]);

  // 自动锁定检查
  useEffect(() => {
    if (!isUnlocked || !sessionExpiresAt) return;

    const checkExpiration = () => {
      if (Date.now() >= sessionExpiresAt) {
        lockWallet();
      }
    };

    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked, sessionExpiresAt, lockWallet]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 创建上下文值
  const contextValue: LocalWalletContextState = {
    wallets,
    currentWallet,
    isUnlocked,
    isLoading,
    sessionExpiresAt,
    settings,
    importWallet,
    createWallet,
    removeWallet,
    unlockWallet,
    lockWallet,
    lock: lockWallet, // 添加 lock 方法别名
    switchWallet,
    address: currentWallet?.publicKey, // 添加 address 属性
    signTransaction,
    signAndSendTransaction,
    updateSettings,
    getKeypair,
    exportPrivateKey,
  };

  return (
    <LocalWalletContext.Provider value={contextValue}>
      {children}
    </LocalWalletContext.Provider>
  );
}
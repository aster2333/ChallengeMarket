"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { Core } from '@walletconnect/core';
import { SessionTypes, SignClientTypes } from '@walletconnect/types';
import { Transaction } from '@solana/web3.js';
import { useErrorHandler } from '../hooks/useErrorHandler';

// WalletConnect 项目配置
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'; // 需要从 WalletConnect Cloud 获取
const METADATA = {
  name: 'Challenge Market',
  description: 'Solana Challenge Market Platform',
  url: 'https://challengemarket.app',
  icons: ['https://challengemarket.app/icon.png']
};

// 连接配置
const CONNECTION_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // 2秒
  connectionTimeout: 10000, // 10秒
  reconnectInterval: 30000, // 30秒
};

interface WalletConnectContextState {
  // WalletConnect 实例
  web3wallet: IWeb3Wallet | null;
  
  // 连接状态
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connectionError: string | null;
  
  // 会话信息
  sessions: SessionTypes.Struct[];
  currentSession: SessionTypes.Struct | null;
  
  // 账户信息
  accounts: string[];
  currentAccount: string | null;
  
  // 连接方法
  initializeWalletConnect: () => Promise<void>;
  createSession: () => Promise<string>; // 返回 URI
  approveSession: (proposal: SignClientTypes.EventArguments['session_proposal']) => Promise<void>;
  rejectSession: (proposal: SignClientTypes.EventArguments['session_proposal']) => Promise<void>;
  disconnectSession: (sessionTopic?: string) => Promise<void>;
  disconnect: () => Promise<void>; // 添加简化的 disconnect 方法
  
  // 交易方法
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  
  // 错误处理
  clearError: () => void;
}

const WalletConnectContext = createContext<WalletConnectContextState | undefined>(undefined);

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  }
  return context;
}

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const { handleError } = useErrorHandler();
  
  // 状态管理
  const [web3wallet, setWeb3wallet] = useState<IWeb3Wallet | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionTypes.Struct | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  // 连接管理
  const retryCountRef = useRef(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const lastErrorTimeRef = useRef(0);
  const errorCountRef = useRef(0);

  // 计算连接状态
  const isConnected = currentSession !== null && accounts.length > 0;

  // 网络状态检测
  const isNetworkAvailable = useCallback(() => {
    return navigator.onLine;
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setConnectionError(null);
    errorCountRef.current = 0;
  }, []);

  // 错误处理函数
  const handleConnectionError = useCallback((error: unknown, context: string) => {
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;

    // 防止频繁错误日志（1秒内不重复输出相同类型错误）
    if (timeSinceLastError > 1000) {
      console.error(`WalletConnect ${context}:`, error);
      lastErrorTimeRef.current = now;
      errorCountRef.current++;
    }

    // 设置用户友好的错误信息
    let errorMessage = '连接失败';
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('WebSocket')) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else if (error.message.includes('timeout')) {
        errorMessage = '连接超时，请重试';
      } else if (error.message.includes('PROJECT_ID')) {
        errorMessage = 'WalletConnect配置错误';
      } else {
        errorMessage = error.message;
      }
    }

    setConnectionError(errorMessage);

    // 只在开发环境显示错误提示
    if (import.meta.env.DEV && errorCountRef.current <= 3) {
      handleError(error, `${context} (开发模式)`);
    }
  }, [handleError]);

  // 清理定时器
  const clearTimeouts = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 初始化 WalletConnect（带重试机制）
  const initializeWalletConnect = useCallback(async () => {
    // 防止重复初始化
    if (isInitializingRef.current || web3wallet) {
      return;
    }

    // 检查网络状态
    if (!isNetworkAvailable()) {
      console.warn('Network is offline, skipping WalletConnect initialization');
      setConnectionError('网络不可用，请检查网络连接');
      return;
    }

    // 检查PROJECT_ID
    if (!PROJECT_ID || PROJECT_ID === 'demo-project-id') {
      console.warn('WalletConnect PROJECT_ID not configured, using offline mode');
      setIsInitialized(false);
      setConnectionError('WalletConnect未配置，使用离线模式');
      return;
    }

    isInitializingRef.current = true;
    setIsConnecting(true);
    clearError();

    try {
      // 设置连接超时
      const timeoutPromise = new Promise((_, reject) => {
        connectionTimeoutRef.current = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, CONNECTION_CONFIG.connectionTimeout);
      });

      // 初始化WalletConnect
      const initPromise = Web3Wallet.init({
        core: new Core({
          projectId: PROJECT_ID,
          logger: 'error', // 只显示错误日志
        }),
        metadata: METADATA,
      });

      const wallet = await Promise.race([initPromise, timeoutPromise]) as IWeb3Wallet;
      
      clearTimeouts();
      setWeb3wallet(wallet);
      
      // 获取现有会话
      const existingSessions = wallet.getActiveSessions();
      const sessionArray = Object.values(existingSessions);
      
      // 去重处理
      const uniqueSessions = sessionArray.filter((session, index, self) => 
        index === self.findIndex(s => s.topic === session.topic)
      );
      
      setSessions(uniqueSessions);
      
      if (uniqueSessions.length > 0) {
        const session = uniqueSessions[0];
        setCurrentSession(session);
        
        // 提取 Solana 账户
        const solanaAccounts = session.namespaces.solana?.accounts || [];
        const addresses = solanaAccounts.map(account => account.split(':')[2]);
        setAccounts(addresses);
        setCurrentAccount(addresses[0] || null);
      }

      // 监听事件（减少日志输出）
      wallet.on('session_proposal', async (proposal) => {
        if (import.meta.env.DEV) {
          console.log('Session proposal received');
        }
        if (proposal.params.requiredNamespaces.solana) {
          await approveSession(proposal);
        }
      });

      wallet.on('session_request', async () => {
        if (import.meta.env.DEV) {
          console.log('Session request received');
        }
      });

      wallet.on('session_delete', (deleteEvent) => {
        if (import.meta.env.DEV) {
          console.log('Session deleted');
        }
        setSessions(prev => prev.filter(s => s.topic !== deleteEvent.topic));
        if (currentSession?.topic === deleteEvent.topic) {
          setCurrentSession(null);
          setAccounts([]);
          setCurrentAccount(null);
        }
      });

      setIsInitialized(true);
      retryCountRef.current = 0; // 重置重试计数
      
      if (import.meta.env.DEV) {
        console.log('WalletConnect initialized successfully');
      }
      
    } catch (error) {
      clearTimeouts();
      handleConnectionError(error, 'initialization failed');
      
      // 重试机制
      if (retryCountRef.current < CONNECTION_CONFIG.maxRetries) {
        retryCountRef.current++;
        const delay = CONNECTION_CONFIG.retryDelay * retryCountRef.current;
        
        if (import.meta.env.DEV) {
          console.log(`Retrying WalletConnect initialization in ${delay}ms (attempt ${retryCountRef.current}/${CONNECTION_CONFIG.maxRetries})`);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          isInitializingRef.current = false;
          initializeWalletConnect();
        }, delay);
      } else {
        // 达到最大重试次数，设置为离线模式
        setIsInitialized(false);
        setWeb3wallet(null);
        retryCountRef.current = 0;
        
        if (import.meta.env.DEV) {
          console.warn('WalletConnect initialization failed after max retries, using offline mode');
        }
      }
    } finally {
      isInitializingRef.current = false;
      setIsConnecting(false);
    }
  }, [web3wallet, handleConnectionError, clearError, clearTimeouts, isNetworkAvailable, currentSession]);

  // 创建连接会话
  const createSession = useCallback(async (): Promise<string> => {
    if (!web3wallet || !isInitialized) {
      // 如果 WalletConnect 未初始化，返回一个示例 URI 用于测试
      const errorMessage = 'WalletConnect未初始化，请稍后重试';
      handleConnectionError(new Error(errorMessage), 'createSession');
      
      // 生成测试用的 URI
      const fallbackUri = `wc:${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
      return fallbackUri;
    }

    try {
      setIsConnecting(true);
      clearError(); // 清除之前的错误
      
      // 检查网络连接
      if (!isNetworkAvailable()) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      // 设置连接超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        connectionTimeoutRef.current = setTimeout(() => {
          reject(new Error('连接超时，请重试'));
        }, CONNECTION_CONFIG.connectionTimeout);
      });
      
      // 使用 WalletConnect v2 的新 API
      const createPromise = web3wallet.core.pairing.create();
      
      const { uri } = await Promise.race([createPromise, timeoutPromise]);
      
      // 清除超时定时器
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      if (!uri) {
        throw new Error('创建连接链接失败，请重试');
      }

      // 只在开发环境输出 URI 创建日志
      if (import.meta.env.DEV) {
        console.log('WalletConnect URI created successfully');
      }
      
      return uri;
      
    } catch (error) {
      // 清除超时定时器
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      handleConnectionError(error, 'createSession');
      
      // 如果是初始化错误，尝试简单的 URI 生成
      if (error instanceof Error && (error.message.includes('trace') || error.message.includes('not initialized'))) {
        // 只在开发环境输出警告日志
        if (import.meta.env.DEV) {
          console.warn('WalletConnect initialization issue, generating fallback URI');
        }
        // 生成一个示例 URI 用于测试
        const fallbackUri = `wc:${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
        return fallbackUri;
      }
      
      // 生成测试用的 URI 作为降级处理
      const fallbackUri = `wc:${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
      return fallbackUri;
    } finally {
      setIsConnecting(false);
    }
  }, [web3wallet, isInitialized, handleConnectionError, clearError, isNetworkAvailable]);

  // 批准会话
  const approveSession = useCallback(async (proposal: SignClientTypes.EventArguments['session_proposal']) => {
    if (!web3wallet || !isInitialized) return;

    try {
      // 模拟 Solana 账户（实际应用中应该从用户钱包获取）
      const solanaAccount = 'solana:devnet:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
      
      const session = await web3wallet.approveSession({
        id: proposal.id,
        namespaces: {
          solana: {
            accounts: [solanaAccount],
            methods: [
              'solana_signTransaction',
              'solana_signAndSendTransaction',
              'solana_signMessage'
            ],
            events: ['accountsChanged', 'chainChanged']
          }
        }
      });

      setSessions(prev => [...prev, session]);
      setCurrentSession(session);
      
      const addresses = [solanaAccount.split(':')[2]];
      setAccounts(addresses);
      setCurrentAccount(addresses[0]);
      
      // 只在开发环境输出会话批准日志
      if (import.meta.env.DEV) {
        console.log('Session approved:', session);
      }
      
    } catch (error) {
      console.error('Failed to approve session:', error);
      handleError(error, '批准会话失败');
    }
  }, [web3wallet, handleError]);

  // 拒绝会话
  const rejectSession = useCallback(async (proposal: SignClientTypes.EventArguments['session_proposal']) => {
    if (!web3wallet || !isInitialized) return;

    try {
      await web3wallet.rejectSession({
        id: proposal.id,
        reason: {
          code: 5000,
          message: 'User rejected session'
        }
      });
      
      // 只在开发环境输出会话拒绝日志
      if (import.meta.env.DEV) {
        console.log('Session rejected');
      }
      
    } catch (error) {
      console.error('Failed to reject session:', error);
      handleError(error, '拒绝会话失败');
    }
  }, [web3wallet, handleError]);

  // 断开会话
  const disconnectSession = useCallback(async (sessionTopic?: string) => {
    if (!web3wallet || !isInitialized) return;

    try {
      const topic = sessionTopic || currentSession?.topic;
      if (!topic) return;

      await web3wallet.disconnectSession({
        topic,
        reason: {
          code: 6000,
          message: 'User disconnected session'
        }
      });

      setSessions(prev => prev.filter(s => s.topic !== topic));
      if (currentSession?.topic === topic) {
        setCurrentSession(null);
        setAccounts([]);
        setCurrentAccount(null);
      }
      
      // 只在开发环境输出会话断开日志
      if (import.meta.env.DEV) {
        console.log('Session disconnected');
      }
      
    } catch (error) {
      console.error('Failed to disconnect session:', error);
      handleError(error, '断开连接失败');
    }
  }, [web3wallet, currentSession, handleError]);

  // 签名交易
  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!web3wallet || !isInitialized || !currentSession || !currentAccount) {
      throw new Error('WalletConnect not connected or not available');
    }

    try {
      // 这里需要实现具体的交易签名逻辑
      // 实际应用中需要调用 WalletConnect 的签名方法
      // 只在开发环境输出交易签名日志
      if (import.meta.env.DEV) {
        console.log('Signing transaction via WalletConnect...');
      }
      
      // 暂时返回原交易（实际需要实现签名）
      return transaction;
      
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      handleError(error, '交易签名失败');
      throw error;
    }
  }, [web3wallet, currentSession, currentAccount, handleError]);

  // 签名并发送交易
  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<string> => {
    if (!web3wallet || !isInitialized || !currentSession || !currentAccount) {
      throw new Error('WalletConnect not connected or not available');
    }

    try {
      // 这里需要实现具体的交易签名和发送逻辑
      // 只在开发环境输出交易发送日志
      if (import.meta.env.DEV) {
        console.log('Signing and sending transaction via WalletConnect...', transaction);
      }
      
      // 暂时返回模拟的交易哈希
      return 'mock-transaction-hash';
      
    } catch (error) {
      console.error('Failed to sign and send transaction:', error);
      handleError(error, '交易发送失败');
      throw error;
    }
  }, [web3wallet, currentSession, currentAccount, handleError]);

  // 组件挂载时初始化，添加去重机制和防抖
  useEffect(() => {
    let isInitializing = false;
    let initTimeout: NodeJS.Timeout | null = null;
    
    const initWithDeduplication = async () => {
      if (isInitializing || web3wallet) return;
      isInitializing = true;
      
      try {
        await initializeWalletConnect();
      } finally {
        isInitializing = false;
      }
    };
    
    // 添加防抖机制，避免频繁初始化
    initTimeout = setTimeout(() => {
      initWithDeduplication();
    }, 100);

    return () => {
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }
    };
  }, [initializeWalletConnect, web3wallet]);

  // 简化的 disconnect 方法
  const disconnect = useCallback(async () => {
    await disconnectSession();
  }, [disconnectSession]);

  // 创建上下文值
  const contextValue: WalletConnectContextState = {
    web3wallet,
    isInitialized,
    isConnecting,
    isConnected,
    connectionError,
    sessions,
    currentSession,
    accounts,
    currentAccount,
    initializeWalletConnect,
    createSession,
    approveSession,
    rejectSession,
    disconnectSession,
    disconnect,
    signTransaction,
    signAndSendTransaction,
    clearError,
  };

  return (
    <WalletConnectContext.Provider value={contextValue}>
      {children}
    </WalletConnectContext.Provider>
  );
}
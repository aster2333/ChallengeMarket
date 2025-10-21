import React, { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork, WalletReadyState, type Adapter } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust'
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow'
import { ExodusWalletAdapter } from '@solana/wallet-adapter-exodus'
import { OKXWalletAdapter } from './OKXWalletAdapter'
import { clusterApiUrl } from '@solana/web3.js'

// 导入默认样式
import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  console.log('WalletContextProvider is initializing')
  
  // 网络可以设置为 'devnet', 'testnet', 或 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet
  
  // 你也可以提供一个自定义的RPC端点
  const endpoint = useMemo(() => {
    const url = clusterApiUrl(network)
    console.log('Solana endpoint:', url)
    return url
  }, [network])
  
  const wallets = useMemo(
    () => {
      console.log('Initializing wallets')
      
      // 安全地初始化钱包适配器的辅助函数
      const safeInitializeWallet = (walletFactory: () => Adapter, name: string) => {
        try {
          const wallet = walletFactory();
          
          // 检查钱包的 readyState
          if (wallet.readyState === WalletReadyState.NotDetected) {
            console.warn(`${name} wallet not detected, but adding to list for potential installation`);
          } else if (wallet.readyState === WalletReadyState.Unsupported) {
            console.warn(`${name} wallet is unsupported in this environment`);
            return null;
          } else if (wallet.readyState === WalletReadyState.Loadable || wallet.readyState === WalletReadyState.Installed) {
            console.log(`${name} wallet is ready (${wallet.readyState})`);
          }
          
          return wallet;
        } catch (error) {
          console.warn(`${name} Wallet adapter failed to initialize:`, error);
          return null;
        }
      };

      try {
        const walletList: Adapter[] = [];

        // 基础钱包适配器（通常更稳定）
        const basicWallets = [
          () => new PhantomWalletAdapter(),
          () => new SolflareWalletAdapter({ network }),
          () => new TorusWalletAdapter(),
          () => new LedgerWalletAdapter(),
        ];

        const basicWalletNames = ['Phantom', 'Solflare', 'Torus', 'Ledger'];

        basicWallets.forEach((walletFactory, index) => {
          const wallet = safeInitializeWallet(walletFactory, basicWalletNames[index]);
          if (wallet) {
            walletList.push(wallet);
          }
        });

        // 扩展钱包适配器
        const extendedWallets = [
          { factory: () => new OKXWalletAdapter(), name: 'OKX' },
          { factory: () => new CoinbaseWalletAdapter(), name: 'Coinbase' },
          { factory: () => new BackpackWalletAdapter(), name: 'Backpack' },
          { factory: () => new TrustWalletAdapter(), name: 'Trust' },
          { factory: () => new GlowWalletAdapter(), name: 'Glow' },
          { factory: () => new ExodusWalletAdapter(), name: 'Exodus' },
        ];

        extendedWallets.forEach(({ factory, name }) => {
          const wallet = safeInitializeWallet(factory, name);
          if (wallet) {
            walletList.push(wallet);
          }
        });

        console.log(`Successfully initialized ${walletList.length} wallet adapters`);
        
        // 过滤掉无效的钱包
        const validWallets = walletList.filter(wallet => wallet && typeof wallet.connect === 'function');
        
        if (validWallets.length === 0) {
          console.warn('No valid wallet adapters found, using fallback');
          return [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
          ];
        }
        
        return validWallets;
      } catch (error) {
        console.error('Error initializing wallets:', error)
        // 返回基本的钱包适配器作为后备
        return [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter({ network }),
          new TorusWalletAdapter(),
          new LedgerWalletAdapter(),
        ]
      }
    },
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
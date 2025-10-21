import type { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

interface InjectedSolanaProvider {
  isConnected: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<{ signature: string }>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

// Type declarations for traditional Solana wallets
declare global {
  interface Window {
    phantom?: {
      solana?: InjectedSolanaProvider & { isPhantom: boolean };
    };
    solflare?: InjectedSolanaProvider & { isSolflare: boolean };
    backpack?: InjectedSolanaProvider & { isSolana: boolean };
    coinbaseSolana?: InjectedSolanaProvider;
  }
}

export {};
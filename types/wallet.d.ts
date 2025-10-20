// Type declarations for traditional Solana wallets
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: () => Promise<{ publicKey: any }>;
        disconnect: () => Promise<void>;
        signTransaction: (transaction: any) => Promise<any>;
        signAndSendTransaction: (transaction: any) => Promise<any>;
        signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        publicKey?: any;
        isConnected: boolean;
      };
    };
    solflare?: {
      isSolflare: boolean;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: any) => Promise<any>;
      signAndSendTransaction: (transaction: any) => Promise<any>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      publicKey?: any;
      isConnected: boolean;
    };
    backpack?: {
      isSolana: boolean;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: any) => Promise<any>;
      signAndSendTransaction: (transaction: any) => Promise<any>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      publicKey?: any;
      isConnected: boolean;
    };
  }
}

export {};
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  useWallets,
  type UiWallet,
  type UiWalletAccount
} from "@wallet-standard/react";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { StandardConnect } from "@wallet-standard/core";

// Traditional wallet detection for fallback
const detectTraditionalWallets = () => {
  const traditionalWallets = [];
  
  // Check for Phantom
  if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
    console.log("🔍 Phantom wallet detected via window.phantom");
    traditionalWallets.push({
      name: "Phantom",
      icon: "https://phantom.app/img/phantom-logo.svg",
      chains: ["solana:mainnet", "solana:devnet", "solana:testnet"],
      features: [StandardConnect, "solana:signAndSendTransaction"],
      accounts: [],
      isTraditional: true,
      adapter: (window as any).phantom.solana
    });
  }
  
  // Check for Solflare
  if (typeof window !== 'undefined' && (window as any).solflare?.isSolflare) {
    console.log("🔍 Solflare wallet detected via window.solflare");
    traditionalWallets.push({
      name: "Solflare",
      icon: "https://solflare.com/favicon.ico",
      chains: ["solana:mainnet", "solana:devnet", "solana:testnet"],
      features: [StandardConnect, "solana:signAndSendTransaction"],
      accounts: [],
      isTraditional: true,
      adapter: (window as any).solflare
    });
  }
  
  // Check for Backpack
  if (typeof window !== 'undefined' && (window as any).backpack?.isSolana) {
    console.log("🔍 Backpack wallet detected via window.backpack");
    traditionalWallets.push({
      name: "Backpack",
      icon: "https://backpack.app/favicon.ico",
      chains: ["solana:mainnet", "solana:devnet", "solana:testnet"],
      features: [StandardConnect, "solana:signAndSendTransaction"],
      accounts: [],
      isTraditional: true,
      adapter: (window as any).backpack
    });
  }
  
  console.log("🔍 Traditional wallets detected:", traditionalWallets.length);
  return traditionalWallets;
};

// Create RPC connection
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const WS_ENDPOINT = "wss://api.devnet.solana.com";
const chain = "solana:devnet";
const rpc = createSolanaRpc(RPC_ENDPOINT);
const ws = createSolanaRpcSubscriptions(WS_ENDPOINT);

interface SolanaContextState {
  // RPC
  rpc: ReturnType<typeof createSolanaRpc>;
  ws: ReturnType<typeof createSolanaRpcSubscriptions>;
  chain: typeof chain;

  // Wallet State
  wallets: UiWallet[];
  selectedWallet: UiWallet | null;
  selectedAccount: UiWalletAccount | null;
  isConnected: boolean;
  publicKey?: string;

  // Wallet Actions
  setWalletAndAccount: (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => void;
  disconnect: () => void;
}

const SolanaContext = createContext<SolanaContextState | undefined>(undefined);

export function useSolana() {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error("useSolana must be used within a SolanaProvider");
  }
  return context;
}

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const allWallets = useWallets();
  const [traditionalWallets, setTraditionalWallets] = useState<any[]>([]);

  // Detect traditional wallets on mount and when window loads
  useEffect(() => {
    const detectWallets = () => {
      const detected = detectTraditionalWallets();
      setTraditionalWallets(detected);
    };

    // Initial detection
    detectWallets();

    // Re-detect after a short delay to catch wallets that load later
    const timer = setTimeout(detectWallets, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Debug: Log all detected wallets
  console.log("🔍 All detected wallets:", allWallets);
  console.log("🔍 Number of wallets detected:", allWallets.length);
  console.log("🔍 Traditional wallets:", traditionalWallets);
  
  // Log details of each wallet
  allWallets.forEach((wallet, index) => {
    console.log(`🔍 Wallet ${index + 1}:`, {
      name: wallet.name,
      chains: wallet.chains,
      features: wallet.features,
      accounts: wallet.accounts?.length || 0
    });
  });

  // Combine standard and traditional wallets
  const wallets = useMemo(() => {
    // First try strict filtering on standard wallets
    const strictFiltered = allWallets.filter(
      (wallet) =>
        wallet.chains?.some((c) => c.startsWith("solana:")) &&
        wallet.features.includes(StandardConnect) &&
        wallet.features.includes("solana:signAndSendTransaction")
    );
    
    // If no wallets found with strict filtering, try relaxed filtering
    const relaxedFiltered = allWallets.filter(
      (wallet) =>
        // Check if wallet supports Solana or has no chain restriction
        (wallet.chains?.some((c) => c.startsWith("solana:")) || !wallet.chains?.length) &&
        wallet.features.includes(StandardConnect)
    );
    
    // Use strict filtering if available, otherwise use relaxed
    const standardWallets = strictFiltered.length > 0 ? strictFiltered : relaxedFiltered;
    
    // Combine with traditional wallets
    const combinedWallets = [...standardWallets, ...traditionalWallets];
    
    console.log("✅ Strict filtered wallets:", strictFiltered.length);
    console.log("✅ Relaxed filtered wallets:", relaxedFiltered.length);
    console.log("✅ Traditional wallets:", traditionalWallets.length);
    console.log("✅ Final combined wallets:", combinedWallets);
    console.log("✅ Total compatible wallets:", combinedWallets.length);
    
    return combinedWallets;
  }, [allWallets, traditionalWallets]);

  // State management
  const [selectedWallet, setSelectedWallet] = useState<UiWallet | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<UiWalletAccount | null>(null);

  // Check if connected (account must exist in the wallet's accounts)
  const isConnected = useMemo(() => {
    if (!selectedAccount || !selectedWallet) return false;

    // Find the wallet and check if it still has this account
    const currentWallet = wallets.find((w) => w.name === selectedWallet.name);
    return !!(
      currentWallet &&
      currentWallet.accounts.some(
        (acc) => acc.address === selectedAccount.address
      )
    );
  }, [selectedAccount, selectedWallet, wallets]);

  const setWalletAndAccount = (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => {
    setSelectedWallet(wallet);
    setSelectedAccount(account);
  };

  const disconnect = () => {
    setSelectedWallet(null);
    setSelectedAccount(null);
  };

  // Get public key from selected account
  const publicKey = selectedAccount?.address;

  // Create context value
  const contextValue = useMemo<SolanaContextState>(
    () => ({
      // Static RPC values
      rpc,
      ws,
      chain,

      // Dynamic wallet values
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      publicKey,
      setWalletAndAccount,
      disconnect
    }),
    [wallets, selectedWallet, selectedAccount, isConnected, publicKey]
  );

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}
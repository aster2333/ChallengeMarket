"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback
} from "react";
import {
  useWallets,
  type UiWallet,
  type UiWalletAccount
} from "@wallet-standard/react";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { StandardConnect } from "@wallet-standard/core";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { useStore } from "../src/store/useStore";
import type { User } from "../src/store/useStore";

type LegacySignAndSendInput =
  | Transaction
  | Uint8Array
  | { transaction: Transaction | Uint8Array; chain?: string };

type LegacySignAndSendResult = { signature: string } | string;

type LegacySolanaAdapter = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isSolana?: boolean;
  connect?: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  publicKey?: { toString(): string };
  signAndSendTransaction?: (
    input: LegacySignAndSendInput
  ) => Promise<LegacySignAndSendResult>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  sendTransaction?: (
    transaction: Transaction
  ) => Promise<LegacySignAndSendResult>;
};

type LegacyWalletWindow = Window & {
  phantom?: { solana?: LegacySolanaAdapter };
  solflare?: (LegacySolanaAdapter & { isSolflare?: boolean }) | undefined;
  backpack?: (LegacySolanaAdapter & { isBackpack?: boolean }) | undefined;
};

type TraditionalWallet = {
  name: string;
  icon: string;
  chains: string[];
  features: (string | typeof StandardConnect)[];
  accounts: UiWalletAccount[];
  isTraditional: boolean;
  adapter: LegacySolanaAdapter;
};

const isLegacyAdapter = (value: unknown): value is LegacySolanaAdapter =>
  typeof value === "object" && value !== null;

const isTraditionalWallet = (
  wallet: UiWallet | TraditionalWallet
): wallet is TraditionalWallet =>
  Boolean(wallet && typeof wallet === "object" && "isTraditional" in wallet);

const extractLegacySignature = (result: unknown) => {
  if (!result) {
    return null;
  }

  if (typeof result === "string") {
    return result;
  }

  if (typeof result === "object" && "signature" in result) {
    const signature = (result as { signature?: unknown }).signature;
    return typeof signature === "string" ? signature : null;
  }

  return null;
};

type SignAndSendFeature = {
  name: string;
  signAndSendTransaction: (input: {
    transaction: Uint8Array;
    chain?: string;
  }) => Promise<{ signature: string }>;
};

const isSignAndSendFeature = (feature: unknown): feature is SignAndSendFeature =>
  typeof feature === "object" &&
  feature !== null &&
  (feature as { name?: unknown }).name === "solana:signAndSendTransaction" &&
  typeof (feature as { signAndSendTransaction?: unknown }).signAndSendTransaction ===
    "function";

// Traditional wallet detection for fallback
const detectTraditionalWallets = () => {
  const traditionalWallets: TraditionalWallet[] = [];
  
  // Check for Phantom
  if (typeof window !== "undefined") {
    const legacyWindow = window as LegacyWalletWindow;

    const phantomAdapter = legacyWindow.phantom?.solana;

    if (phantomAdapter) {
      console.log("🔍 Phantom wallet detected via window.phantom");
      traditionalWallets.push({
        name: "Phantom",
        icon: "https://phantom.app/img/phantom-logo.svg",
        chains: ["solana:mainnet", "solana:devnet", "solana:testnet"],
        features: [StandardConnect, "solana:signAndSendTransaction"],
        accounts: [],
        isTraditional: true,
        adapter: phantomAdapter as LegacySolanaAdapter
      });
    }

    // Check for Solflare
    const solflareAdapter = legacyWindow?.solflare;

    if (solflareAdapter?.isSolflare) {
      console.log("🔍 Solflare wallet detected via window.solflare");
      traditionalWallets.push({
        name: "Solflare",
        icon: "https://solflare.com/favicon.ico",
        chains: ["solana:mainnet", "solana:devnet", "solana:testnet"],
        features: [StandardConnect, "solana:signAndSendTransaction"],
        accounts: [],
        isTraditional: true,
        adapter: solflareAdapter as LegacySolanaAdapter
      });
    }

    // Check for Backpack
    const backpackAdapter = legacyWindow?.backpack;

    if (backpackAdapter?.isSolana) {
      console.log("🔍 Backpack wallet detected via window.backpack");
      traditionalWallets.push({
        name: "Backpack",
        icon: "https://backpack.app/favicon.ico",
        chains: ["solana:mainnet", "solana:devnet", "solana:testnet"],
        features: [StandardConnect, "solana:signAndSendTransaction"],
        accounts: [],
        isTraditional: true,
        adapter: backpackAdapter as LegacySolanaAdapter
      });
    }

    console.log("🔍 Traditional wallets detected:", traditionalWallets.length);
    return traditionalWallets;
  }

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
  connection: Connection;

  // Wallet State
  wallets: UiWallet[];
  selectedWallet: UiWallet | null;
  selectedAccount: UiWalletAccount | null;
  isConnected: boolean;
  publicKey?: string;
  balance: number | null;

  // Wallet Actions
  setWalletAndAccount: (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<number | null>;
  requestAirdrop: (amount: number) => Promise<string>;
  sendSol: (destination: string, amount: number) => Promise<string>;
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
  const [traditionalWallets, setTraditionalWallets] =
    useState<TraditionalWallet[]>([]);
  const connection = useMemo(
    () => new Connection(RPC_ENDPOINT, { commitment: "confirmed" }),
    []
  );

  const setUser = useStore((state) => state.setUser);
  const setIsWalletConnected = useStore(
    (state) => state.setIsWalletConnected
  );

  const applyUserState = useCallback(
    (account: UiWalletAccount | null, nextBalance?: number | null) => {
      if (account) {
        const current = useStore.getState().user;
        const balanceValue =
          typeof nextBalance === "number"
            ? nextBalance
            : typeof current?.balance === "number"
            ? current.balance
            : 0;

        const updatedUser: User = {
          address: account.address,
          publicKey: account.address,
          totalEarnings: current?.totalEarnings ?? 0,
          totalBets: current?.totalBets ?? 0,
          challengesCreated: current?.challengesCreated ?? 0,
          challengesAccepted: current?.challengesAccepted ?? 0,
          winRate: current?.winRate ?? 0,
          balance: balanceValue,
          nfts: current?.nfts ?? []
        };

        setUser(updatedUser);
        setIsWalletConnected(true);
      } else {
        setIsWalletConnected(false);
        setUser(null);
      }
    },
    [setIsWalletConnected, setUser]
  );

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
    const strictFiltered = allWallets.filter((wallet) => {
      const supportsSolana = wallet.chains?.some((c) =>
        c.startsWith("solana:")
      );

      const supportsConnect = wallet.features.includes(StandardConnect);
      const supportsSignAndSend = wallet.features.some(
        (feature) =>
          feature === "solana:signAndSendTransaction" ||
          isSignAndSendFeature(feature)
      );

      return supportsSolana && supportsConnect && supportsSignAndSend;
    });

    // If no wallets found with strict filtering, try relaxed filtering
    const relaxedFiltered = allWallets.filter(
      (wallet) =>
        // Check if wallet supports Solana or has no chain restriction
        (wallet.chains?.some((c) => c.startsWith("solana:")) || !wallet.chains?.length) &&
        wallet.features.includes(StandardConnect)
    );

    // Use strict filtering if available, otherwise use relaxed
    const standardWallets = strictFiltered.length > 0 ? strictFiltered : relaxedFiltered;

    const walletMap = new Map<string, UiWallet>();

    standardWallets.forEach((wallet) => {
      walletMap.set(wallet.name, wallet);
    });

    traditionalWallets.forEach((wallet) => {
      if (!walletMap.has(wallet.name)) {
        walletMap.set(wallet.name, wallet as unknown as UiWallet);
      }
    });

    const combinedWallets = Array.from(walletMap.values());

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
  const [balance, setBalance] = useState<number | null>(null);

  // Check if connected (account must exist in the wallet's accounts)
  const isConnected = useMemo(
    () => Boolean(selectedWallet && selectedAccount),
    [selectedAccount, selectedWallet]
  );

  const setWalletAndAccount = useCallback(
    (wallet: UiWallet | null, account: UiWalletAccount | null) => {
      setSelectedWallet(wallet);
      setSelectedAccount(account);

      if (wallet && account) {
        setBalance(null);
        applyUserState(account, null);
      } else {
        setBalance(null);
        applyUserState(null);
      }
    },
    [applyUserState]
  );

  const disconnect = useCallback(() => {
    setSelectedWallet(null);
    setSelectedAccount(null);
    setBalance(null);
    applyUserState(null);
  }, [applyUserState]);

  // Get public key from selected account
  const publicKey = selectedAccount?.address;

  const refreshBalance = useCallback(async () => {
    if (!selectedAccount) {
      setBalance(null);
      return null;
    }

    try {
      const lamports = await connection.getBalance(
        new PublicKey(selectedAccount.address)
      );
      const nextBalance = lamports / LAMPORTS_PER_SOL;
      setBalance(nextBalance);
      applyUserState(selectedAccount, nextBalance);
      return nextBalance;
    } catch (error) {
      console.error("Failed to refresh balance", error);
      throw error;
    }
  }, [applyUserState, connection, selectedAccount]);

  useEffect(() => {
    if (isConnected) {
      refreshBalance().catch((error) =>
        console.error("Initial balance fetch failed", error)
      );

      const interval = setInterval(() => {
        refreshBalance().catch((error) =>
          console.error("Periodic balance refresh failed", error)
        );
      }, 30000);

      return () => clearInterval(interval);
    }

    setBalance(null);
  }, [isConnected, refreshBalance]);

  const requestAirdrop = useCallback(
    async (amount: number) => {
      if (!selectedAccount) {
        throw new Error("Wallet not connected");
      }

      const target = new PublicKey(selectedAccount.address);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      if (lamports <= 0) {
        throw new Error("Invalid amount");
      }

      const latestBlockhash = await connection.getLatestBlockhash();
      const signature = await connection.requestAirdrop(target, lamports);

      await connection.confirmTransaction(
        {
          signature,
          ...latestBlockhash
        },
        "confirmed"
      );

      await refreshBalance();

      return signature;
    },
    [connection, refreshBalance, selectedAccount]
  );

  const findLegacyAdapter = useCallback(
    (wallet: UiWallet | null) => {
      if (!wallet) {
        return null;
      }

      const maybeTraditional = wallet as UiWallet | TraditionalWallet;

      if (
        isTraditionalWallet(maybeTraditional) &&
        isLegacyAdapter(maybeTraditional.adapter)
      ) {
        return maybeTraditional.adapter;
      }

      const fallback = traditionalWallets.find(
        (candidate) => candidate.name === wallet.name
      );

      if (fallback && isLegacyAdapter(fallback.adapter)) {
        return fallback.adapter;
      }

      return null;
    },
    [traditionalWallets]
  );

  const ensureLegacyConnection = useCallback(async (adapter: LegacySolanaAdapter) => {
    if (!adapter.publicKey) {
      await adapter.connect?.();
    }
  }, []);

  const sendSol = useCallback(
    async (destination: string, amount: number) => {
      if (!selectedAccount || !selectedWallet) {
        throw new Error("Wallet not connected");
      }

      const features = selectedWallet.features as unknown[];
      const signAndSendFeature = features.find(isSignAndSendFeature);
      const legacyAdapter = findLegacyAdapter(selectedWallet);

      const fromPubkey = new PublicKey(selectedAccount.address);
      const toPubkey = new PublicKey(destination);

      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      if (lamports <= 0) {
        throw new Error("Invalid amount");
      }

      const latestBlockhash = await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: fromPubkey,
        recentBlockhash: latestBlockhash.blockhash
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports
        })
      );

      let signature: string | null = null;

      if (signAndSendFeature) {
        const serialized = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false
        });

        const response = await signAndSendFeature.signAndSendTransaction({
          transaction: new Uint8Array(serialized),
          chain
        });

        signature = response.signature;
      } else if (legacyAdapter) {
        await ensureLegacyConnection(legacyAdapter);

        if (legacyAdapter.signAndSendTransaction) {
          const serialized = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
          });

          const legacyInputs: LegacySignAndSendInput[] = [
            { transaction },
            transaction,
            new Uint8Array(serialized)
          ];

          let lastError: unknown;

          for (const input of legacyInputs) {
            try {
              const result = await legacyAdapter.signAndSendTransaction(input);
              signature = extractLegacySignature(result);

              if (signature) {
                break;
              }
            } catch (error) {
              lastError = error;
            }
          }

          if (!signature && lastError) {
            console.error(
              "Legacy wallet signAndSendTransaction failed",
              lastError
            );
          }
        }

        if (!signature && legacyAdapter.signTransaction) {
          const signedTransaction = await legacyAdapter.signTransaction(
            transaction
          );
          const rawTransaction =
            signedTransaction && typeof signedTransaction.serialize === "function"
              ? signedTransaction.serialize()
              : transaction.serialize();
          signature = await connection.sendRawTransaction(rawTransaction);
        }

        if (
          !signature &&
          legacyAdapter.sendTransaction &&
          typeof legacyAdapter.sendTransaction === "function"
        ) {
          const result = await legacyAdapter.sendTransaction(transaction);
          signature = extractLegacySignature(result);
        }

        if (!signature) {
          throw new Error("Wallet does not support sending transactions");
        }
      } else {
        throw new Error("Wallet does not support sending transactions");
      }

      if (!signature) {
        throw new Error("Failed to obtain transaction signature");
      }

      await connection.confirmTransaction(
        {
          signature,
          ...latestBlockhash
        },
        "confirmed"
      );

      await refreshBalance();

      return signature;
    },
    [
      connection,
      ensureLegacyConnection,
      findLegacyAdapter,
      refreshBalance,
      selectedAccount,
      selectedWallet
    ]
  );

  // Create context value
  const contextValue = useMemo<SolanaContextState>(
    () => ({
      // Static RPC values
      rpc,
      ws,
      chain,
      connection,

      // Dynamic wallet values
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      publicKey,
      balance,
      setWalletAndAccount,
      disconnect,
      refreshBalance,
      requestAirdrop,
      sendSol
    }),
    [
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      publicKey,
      balance,
      connection,
      refreshBalance,
      requestAirdrop,
      sendSol,
      setWalletAndAccount,
      disconnect
    ]
  );

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}
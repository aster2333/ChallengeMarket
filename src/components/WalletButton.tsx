import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, LogOut } from 'lucide-react';

export const WalletButton: React.FC = () => {
  const { connected, disconnect, publicKey } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg">
          <Wallet size={16} />
          <span className="text-sm font-medium">
            {formatAddress(publicKey.toString())}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          title="断开钱包"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-blue-500 !text-white !rounded-lg !px-6 !py-2 !text-sm !font-medium hover:!from-purple-600 hover:!to-blue-600 transition-all duration-200" />
  );
};
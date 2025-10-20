import {
  BaseMessageSignerWalletAdapter,
  WalletAdapterNetwork,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSignMessageError,
  WalletSignTransactionError,
} from '@solana/wallet-adapter-base'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'

interface OKXWallet {
  isOKXWallet?: boolean
  solana?: {
    isConnected: boolean
    publicKey: PublicKey
    connect(): Promise<{ publicKey: PublicKey }>
    disconnect(): Promise<void>
    signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction>
    signAllTransactions(transactions: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]>
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>
  }
}

interface OKXWindow extends Window {
  okxwallet?: OKXWallet
}

declare const window: OKXWindow

export interface OKXWalletAdapterConfig {}

export const OKXWalletName = 'OKX Wallet' as const

export class OKXWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = OKXWalletName as any
  url = 'https://www.okx.com/web3'
  icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiMwMDAwMDAiLz4KPHBhdGggZD0iTTEwIDEwSDIyVjIySDE0VjE0SDEwVjEwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'
  readonly supportedTransactionVersions = new Set<'legacy' | 0>(['legacy', 0])

  private _connecting: boolean
  private _wallet: OKXWallet['solana'] | null
  private _publicKey: PublicKey | null
  private _readyState: WalletReadyState =
    typeof window === 'undefined' || typeof window.okxwallet === 'undefined'
      ? WalletReadyState.Unsupported
      : WalletReadyState.Installed

  constructor(config: OKXWalletAdapterConfig = {}) {
    super()
    this._connecting = false
    this._wallet = null
    this._publicKey = null

    if (this._readyState !== WalletReadyState.Unsupported) {
      this._wallet = window.okxwallet?.solana || null
    }
  }

  get publicKey() {
    return this._publicKey
  }

  get connecting() {
    return this._connecting
  }

  get connected() {
    return !!this._wallet?.isConnected
  }

  get readyState() {
    return this._readyState
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return
      if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError()

      this._connecting = true

      const wallet = window.okxwallet?.solana
      if (!wallet) throw new WalletNotReadyError('OKX Wallet not found')

      try {
        const response = await wallet.connect()
        this._wallet = wallet
        this._publicKey = response.publicKey
      } catch (error: any) {
        throw new WalletConnectionError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet
    if (wallet) {
      this._wallet = null
      this._publicKey = null

      try {
        await wallet.disconnect()
      } catch (error: any) {
        this.emit('error', new WalletDisconnectionError(error?.message, error))
      }
    }

    this.emit('disconnect')
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const wallet = this._wallet
      if (!wallet) throw new WalletNotConnectedError()

      try {
        return (await wallet.signTransaction(transaction)) as T
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    try {
      const wallet = this._wallet
      if (!wallet) throw new WalletNotConnectedError()

      try {
        return (await wallet.signAllTransactions(transactions)) as T[]
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet
      if (!wallet) throw new WalletNotConnectedError()

      try {
        const { signature } = await wallet.signMessage(message)
        return signature
      } catch (error: any) {
        throw new WalletSignMessageError(error?.message, error)
      }
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }
}
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useErrorHandler } from './useErrorHandler'

export const useWallet = () => {
  const { 
    wallet, 
    publicKey, 
    connected, 
    connecting, 
    disconnect,
    sendTransaction 
  } = useSolanaWallet()
  
  const { connection } = useConnection()
  const { user, setUser, setIsWalletConnected } = useStore()
  const { handleError, handleSuccess } = useErrorHandler()
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // 获取钱包余额
  const getBalance = async () => {
    if (!publicKey || !connection) return 0
    
    try {
      const balance = await connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      handleError(error, '获取余额失败')
      return 0
    }
  }

  // 更新余额
  const updateBalance = async () => {
    if (!publicKey) return
    
    setLoading(true)
    try {
      const newBalance = await getBalance()
      setBalance(newBalance)
    } catch (error) {
      handleError(error, '更新余额失败')
    } finally {
      setLoading(false)
    }
  }

  // 监听钱包连接状态变化
  useEffect(() => {
    setIsWalletConnected(connected)
    
    if (connected && publicKey) {
      // 创建或更新用户信息
      const userData = {
        address: publicKey.toString(),
        publicKey: publicKey.toString(),
        totalEarnings: user?.totalEarnings || 0,
        totalBets: user?.totalBets || 0,
        challengesCreated: user?.challengesCreated || 0,
        challengesAccepted: user?.challengesAccepted || 0,
        winRate: user?.winRate || 0,
        balance: balance,
        nfts: user?.nfts || []
      }
      
      setUser(userData)
      updateBalance()
    } else {
      setUser(null)
      setBalance(0)
    }
  }, [connected, publicKey, setUser, setIsWalletConnected])

  // 监听余额变化
  useEffect(() => {
    if (connected && publicKey) {
      updateBalance()
      
      // 设置定期更新余额
      const interval = setInterval(updateBalance, 30000) // 每30秒更新一次
      return () => clearInterval(interval)
    }
  }, [connected, publicKey])

  // 发送SOL
  const sendSOL = async (to: string, amount: number) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('钱包未连接')
    }

    try {
      const { Transaction, SystemProgram } = await import('@solana/web3.js')
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      )

      const signature = await sendTransaction(transaction, connection)
      
      // 等待交易确认
      await connection.confirmTransaction(signature, 'confirmed')
      
      // 更新余额
      await updateBalance()
      
      return signature
    } catch (error) {
      handleError(error, '发送SOL失败')
      throw error
    }
  }

  // 断开钱包连接
  const disconnectWallet = async () => {
    try {
      await disconnect()
      setUser(null)
      setBalance(0)
      setIsWalletConnected(false)
      handleSuccess('钱包已断开连接')
    } catch (error) {
      handleError(error, '断开钱包连接失败')
    }
  }

  return {
    // 钱包状态
    wallet,
    publicKey,
    connected,
    connecting,
    balance,
    loading,
    
    // 钱包操作
    disconnect: disconnectWallet,
    sendSOL,
    updateBalance,
    getBalance,
    
    // 用户信息
    user,
  }
}
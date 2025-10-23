import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSolana } from '../../components/solana-provider'
import { useStore } from '../store/useStore'
import { useErrorHandler } from './useErrorHandler'

export const useWallet = () => {
  const {
    balance: solanaBalance,
    refreshBalance,
    sendSol,
    disconnect: disconnectSolana,
    connection,
    isConnected,
    publicKey: solanaPublicKey,
  } = useSolana()
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const setIsWalletConnected = useStore(
    (state) => state.setIsWalletConnected
  )
  const { handleError, handleSuccess } = useErrorHandler()
  const [balance, setBalance] = useState<number>(() =>
    typeof solanaBalance === 'number' ? solanaBalance : 0
  )
  const [loading, setLoading] = useState(false)

  const publicKey = useMemo(() => {
    if (!solanaPublicKey) return null

    try {
      return new PublicKey(solanaPublicKey)
    } catch (error) {
      console.error('Failed to parse public key', error)
      return null
    }
  }, [solanaPublicKey])

  const getBalance = useCallback(async () => {
    if (!publicKey || !connection) return 0

    try {
      const lamports = await connection.getBalance(publicKey)
      return lamports / LAMPORTS_PER_SOL
    } catch (error) {
      handleError(error, '获取余额失败')
      return 0
    }
  }, [connection, handleError, publicKey])

  const updateBalance = useCallback(async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      if (refreshBalance) {
        const refreshed = await refreshBalance()
        if (typeof refreshed === 'number') {
          setBalance(refreshed)
          return
        }
      }

      const newBalance = await getBalance()
      setBalance(newBalance)
    } catch (error) {
      handleError(error, '更新余额失败')
    } finally {
      setLoading(false)
    }
  }, [getBalance, handleError, publicKey, refreshBalance])

  useEffect(() => {
    if (typeof solanaBalance === 'number') {
      setBalance(solanaBalance)
    }
  }, [solanaBalance])

  useEffect(() => {
    const { isWalletConnected } = useStore.getState()
    if (isWalletConnected !== isConnected) {
      setIsWalletConnected(isConnected)
    }
  }, [isConnected, setIsWalletConnected])

  useEffect(() => {
    const currentUser = useStore.getState().user

    if (!isConnected || !publicKey) {
      if (currentUser !== null) {
        setUser(null)
      }
      setBalance(0)
      return
    }

    const address = publicKey.toString()
    const nextBalance = balance

    if (
      !currentUser ||
      currentUser.publicKey !== address ||
      currentUser.balance !== nextBalance
    ) {
      setUser({
        address,
        publicKey: address,
        totalEarnings: currentUser?.totalEarnings ?? 0,
        totalBets: currentUser?.totalBets ?? 0,
        challengesCreated: currentUser?.challengesCreated ?? 0,
        challengesAccepted: currentUser?.challengesAccepted ?? 0,
        winRate: currentUser?.winRate ?? 0,
        balance: nextBalance,
        nfts: currentUser?.nfts ?? [],
      })
    }
  }, [balance, isConnected, publicKey, setUser])

  useEffect(() => {
    if (isConnected && publicKey) {
      updateBalance()

      const interval = setInterval(updateBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, publicKey, updateBalance])

  const sendSOL = useCallback(async (to: string, amount: number) => {
    if (!publicKey) {
      throw new Error('钱包未连接')
    }

    try {
      const signature = await sendSol(to, amount)

      await updateBalance()

      return signature
    } catch (error) {
      handleError(error, '发送SOL失败')
      throw error
    }
  }, [handleError, publicKey, sendSol, updateBalance])

  const disconnectWallet = useCallback(async () => {
    try {
      await Promise.resolve(disconnectSolana())
      setUser(null)
      setBalance(0)
      setIsWalletConnected(false)
      handleSuccess('钱包已断开连接')
    } catch (error) {
      handleError(error, '断开钱包连接失败')
    }
  }, [disconnectSolana, handleError, handleSuccess, setIsWalletConnected, setUser])

  return {
    publicKey,
    connected: isConnected,
    connecting: false,
    balance,
    loading,
    disconnect: disconnectWallet,
    sendSOL,
    updateBalance,
    getBalance,
    user,
  }
}

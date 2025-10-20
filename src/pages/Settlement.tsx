import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ShareIcon, 
  TrophyIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useStore } from '../store/useStore'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useTranslation } from 'react-i18next'

interface VoteOption {
  id: string
  label: string
  description: string
  votes: number
  percentage: number
}

interface Reward {
  address: string
  amount: number
  type: 'winner' | 'voter' | 'creator'
}

const Settlement: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useStore()
  const { handleError, handleSuccess, handlePromise } = useErrorHandler()
  const { t } = useTranslation('settlement')
  
  const [selectedVote, setSelectedVote] = useState<string>('')
  const [hasVoted, setHasVoted] = useState(false)
  const [votingEnded, setVotingEnded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(21600) // 6小时 = 21600秒
  
  // 模拟挑战数据
  const challenge = {
    id: id || '1',
    title: '30天内完成马拉松训练计划',
    description: '每天跑步5公里，坚持30天不间断',
    creator: '0x1234...5678',
    prizePool: 5.2,
    participants: 12,
    totalBets: 8.7,
    status: 'voting' as 'active' | 'voting' | 'settled',
    endTime: new Date(Date.now() + 21600000), // 6小时后
    evidence: [
      { type: 'image', url: '/api/placeholder/300/200', description: '第30天完成证明' },
      { type: 'video', url: '#', description: '训练过程视频' }
    ]
  }
  
  const voteOptions: VoteOption[] = [
    {
      id: 'success',
      label: t('voting.success'),
      description: t('voting.success_desc'),
      votes: 15,
      percentage: 75
    },
    {
      id: 'failed',
      label: t('voting.failed'),
      description: t('voting.failed_desc'),
      votes: 5,
      percentage: 25
    }
  ]
  
  const rewards: Reward[] = [
    { address: '0x1234...5678', amount: 3.5, type: 'winner' },
    { address: '0x2345...6789', amount: 1.2, type: 'voter' },
    { address: '0x3456...7890', amount: 0.8, type: 'voter' },
    { address: '0x4567...8901', amount: 0.5, type: 'creator' }
  ]
  
  // 检查用户是否有投票权限
  const canVote = user?.address && (
    challenge.creator === user.address || 
    // 这里应该检查用户是否下注了
    true
  )
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setVotingEnded(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleVote = async () => {
    if (!selectedVote || hasVoted) return
    
    try {
      await handlePromise(
        new Promise(async (resolve) => {
          // TODO: 集成Solana智能合约投票功能
          console.log('投票:', selectedVote)
          await new Promise(r => setTimeout(r, 1000))
          setHasVoted(true)
          resolve('success')
        }),
        {
          loading: t('voting.submitting'),
          success: t('voting.vote_success'),
          error: t('voting.vote_error')
        }
      )
    } catch (error) {
      handleError(error, t('voting.vote_error'))
    }
  }
  
  const handleShare = async () => {
    const shareText = t('share.text', { title: challenge.title })
    const shareUrl = window.location.href
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('share.title'),
          text: shareText,
          url: shareUrl
        })
        handleSuccess(t('share.success'))
      } else {
        // 复制到剪贴板
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        handleSuccess(t('share.copy_success'))
      }
    } catch (error) {
      handleError(error, t('share.error'))
    }
  }
  
  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'winner': return t('rewards.challenge_reward')
      case 'voter': return t('rewards.voting_reward')
      case 'creator': return t('rewards.creator_reward')
      default: return t('rewards.other_reward')
    }
  }
  
  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'winner': return 'text-yellow-600 dark:text-yellow-400'
      case 'voter': return 'text-green-600 dark:text-green-400'
      case 'creator': return 'text-blue-600 dark:text-blue-400'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        {/* 挑战信息卡片 */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">{challenge.title}</h2>
              <p className="text-muted-foreground mb-4">{challenge.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{t('challenge_info.prize_pool')}: {challenge.prizePool} SOL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">{t('challenge_info.participants')}: {challenge.participants}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">{t('challenge_info.total_bets')}: {challenge.totalBets} SOL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-muted-foreground">{t('challenge_info.time_remaining')}: {formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 证据展示 */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-foreground mb-3">{t('evidence.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenge.evidence.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.description}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center mb-2">
                      <span className="text-muted-foreground">{t('evidence.video_evidence')}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 投票区域 */}
        {!votingEnded && canVote && (
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4">{t('voting.title')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('voting.subtitle')}
            </p>
            
            <div className="space-y-4 mb-6">
              {voteOptions.map((option) => (
                <label
                  key={option.id}
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedVote === option.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="vote"
                    value={option.id}
                    checked={selectedVote === option.id}
                    onChange={(e) => setSelectedVote(e.target.value)}
                    className="sr-only"
                    disabled={hasVoted}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {option.id === 'success' ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{option.votes} {t('results.votes')}</div>
                      <div className="text-xs text-muted-foreground">{option.percentage}{t('results.percentage')}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            <button
              onClick={handleVote}
              disabled={!selectedVote || hasVoted}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {hasVoted ? t('voting.already_voted') : t('voting.confirm_vote')}
            </button>
          </div>
        )}
        
        {/* 投票结果 */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">{t('results.title')}</h3>
            {votingEnded && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                投票已结束
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {voteOptions.map((option) => (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {option.id === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium text-foreground">{option.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{option.votes} {t('results.votes')} ({option.percentage}{t('results.percentage')})</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      option.id === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 奖励分配 */}
        {votingEnded && (
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4">{t('rewards.title')}</h3>
            <p className="text-muted-foreground mb-6">
              根据投票结果，奖励已自动分配给相关参与者
            </p>
            
            <div className="space-y-3">
              {rewards.map((reward, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {reward.address.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{reward.address}</div>
                      <div className={`text-sm ${getRewardTypeColor(reward.type)}`}>
                        {getRewardTypeLabel(reward.type)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-yellow-600">+{reward.amount} SOL</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <TrophyIcon className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {t('rewards.total_distribution')}: {rewards.reduce((sum, r) => sum + r.amount, 0)} SOL
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* 分享按钮 */}
        <div className="text-center">
          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <ShareIcon className="h-5 w-5" />
            <span>{t('share.button')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settlement
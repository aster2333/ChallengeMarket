import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  Cog6ToothIcon as SettingsIcon,
  ClipboardIcon,
  CreditCardIcon,
  HeartIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { useSolana } from '../../components/solana-provider';
import { useWalletConnect } from '../providers/WalletConnectProvider';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

interface UserChallenge {
  id: string;
  title: string;
  type: 'created' | 'participated';
  status: 'active' | 'voting' | 'completed';
  prizePool: number;
  endTime: Date;
  result?: 'success' | 'failed';
  earnings?: number;
}

interface UserBet {
  id: string;
  challengeTitle: string;
  amount: number;
  side: 'support' | 'against';
  timestamp: Date;
  status: 'pending' | 'won' | 'lost';
  earnings?: number;
}

interface UserNFT {
  id: string;
  name: string;
  image: string;
  challengeTitle: string;
  mintDate: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserStats {
  totalChallengesCreated: number;
  totalChallengesParticipated: number;
  successRate: number;
  totalEarnings: number;
  totalBets: number;
  winRate: number;
  nftCount: number;
  rank: number;
}

const Profile: React.FC = () => {
  const { t } = useTranslation('profile');
  const { user } = useStore();
  const { isConnected, publicKey, disconnect } = useSolana();
  const { isConnected: wcConnected, disconnect: wcDisconnect } = useWalletConnect();
  const { isUnlocked, address: localAddress, lock } = useLocalWallet();
  const [activeTab, setActiveTab] = useState<'challenges' | 'bets' | 'nfts' | 'stats'>('challenges');
  const [loading, setLoading] = useState(true);
  
  // 固定的SOL余额状态，避免跳动
  const [balance, setBalance] = useState(12.50);
  
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // 翻译挑战名称的函数
  const translateChallengeTitle = (title: string) => {
    const translationKey = `challenges.challenge_titles.${title}`;
    const translated = t(translationKey);
    // 如果翻译不存在，返回原标题
    return translated === translationKey ? title : translated;
  };

  // 获取当前连接的钱包地址
  const getCurrentAddress = () => {
    if (isConnected && publicKey) {
      return publicKey.toString();
    }
    if (wcConnected) {
      // WalletConnect 地址需要从相应的 provider 获取
      return 'WalletConnect Address'; // 这里需要根据实际的 WalletConnect 实现来获取地址
    }
    if (isUnlocked && localAddress) {
      return localAddress;
    }
    return '';
  };

  // 生成用户默认昵称
  const getUserNickname = () => {
    const address = getCurrentAddress();
    if (address) {
      return `Deg${address.slice(0, 6)}`;
    }
    return 'Deg';
  };

  // 复制地址到剪贴板
  const copyAddress = async () => {
    const address = getCurrentAddress();
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        console.log('地址已复制到剪贴板');
        // TODO: 显示成功提示
      } catch (err) {
        console.error('复制失败:', err);
        // TODO: 显示错误提示
      }
    }
  };

  // 断开钱包连接
  const handleDisconnect = async () => {
    try {
      if (isConnected) {
        await disconnect();
      }
      if (wcConnected) {
        await wcDisconnect();
      }
      if (isUnlocked) {
        lock();
      }
      console.log('钱包已断开连接');
      // TODO: 显示断开连接成功提示
    } catch (err) {
      console.error('断开连接失败:', err);
      // TODO: 显示错误提示
    }
  };

  // 模拟数据加载
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟用户挑战数据
      const mockChallenges: UserChallenge[] = [
        {
          id: '1',
          title: '30天每日跑步5公里挑战',
          type: 'created',
          status: 'active',
          prizePool: 2.5,
          endTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          title: '7天早起挑战',
          type: 'participated',
          status: 'completed',
          prizePool: 1.2,
          endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          result: 'success',
          earnings: 0.8
        },
        {
          id: '3',
          title: '读书打卡21天',
          type: 'participated',
          status: 'completed',
          prizePool: 0.8,
          endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          result: 'failed'
        }
      ];

      // 模拟用户下注数据
      const mockBets: UserBet[] = [
        {
          id: '1',
          challengeTitle: '健身达人30天挑战',
          amount: 0.5,
          side: 'support',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'won',
          earnings: 0.8
        },
        {
          id: '2',
          challengeTitle: '编程马拉松48小时',
          amount: 0.3,
          side: 'against',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'lost'
        },
        {
          id: '3',
          challengeTitle: '素食主义者7天挑战',
          amount: 0.2,
          side: 'support',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'pending'
        }
      ];

      // 模拟用户NFT数据
      const mockNFTs: UserNFT[] = [
        {
          id: '1',
          name: '跑步冠军',
          image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=running%20champion%20trophy%20nft%20digital%20art%20purple%20blue%20gradient&image_size=square',
          challengeTitle: '30天跑步挑战',
          mintDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          rarity: 'rare'
        },
        {
          id: '2',
          name: '早起达人',
          image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=early%20bird%20sunrise%20achievement%20nft%20golden%20badge&image_size=square',
          challengeTitle: '7天早起挑战',
          mintDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          rarity: 'epic'
        }
      ];

      // 模拟用户统计数据
      const mockStats: UserStats = {
        totalChallengesCreated: 3,
        totalChallengesParticipated: 8,
        successRate: 75,
        totalEarnings: 3.2,
        totalBets: 12,
        winRate: 66.7,
        nftCount: 5,
        rank: 156
      };

      setUserChallenges(mockChallenges);
      setUserBets(mockBets);
      setUserNFTs(mockNFTs);
      setUserStats(mockStats);
      setLoading(false);
    };

    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return '已结束';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}天${hours}小时`;
    return `${hours}小时`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground bg-muted';
      case 'rare': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'epic': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传说';
      default: return '普通';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-2 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-heading text-foreground mb-2">{t('overview.connect_wallet')}</h2>
            <p className="text-muted-foreground font-body">{t('overview.connect_wallet_desc')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-2 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 用户信息头部 */}
        <div className="bg-card rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {getCurrentAddress().slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-heading text-foreground">{getUserNickname()}</h1>
                <p className="text-muted-foreground font-body">
                  {getCurrentAddress().slice(0, 8)}...{getCurrentAddress().slice(-6)}
                </p>
                {/* 总余额显示 */}
                <div className="flex items-center space-x-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-mono-bold text-foreground">
                      {balance.toFixed(2)} SOL
                    </span>
                    <span className="text-sm text-muted-foreground font-body">{t('overview.total_balance')}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-button"
                  >
                    {t('overview.recharge')}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 用户设置下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                className="p-3 hover:bg-muted rounded-full min-h-[44px] min-w-[44px]"
              >
                <SettingsIcon className="w-6 h-6 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-heading">{t('overview.user_settings')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('修改昵称被点击');
                  // TODO: 实现修改昵称功能
                }}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                {t('overview.edit_nickname')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('设置头像被点击');
                  // TODO: 实现设置头像功能
                }}
              >
                <PhotoIcon className="mr-2 h-4 w-4" />
                {t('overview.set_avatar')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={copyAddress}
              >
                <ClipboardIcon className="mr-2 h-4 w-4" />
                {t('overview.copy_address')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('充值被点击');
                  // TODO: 实现充值功能
                }}
              >
                <CreditCardIcon className="mr-2 h-4 w-4" />
                {t('overview.recharge')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('提现被点击');
                  // TODO: 实现提现功能
                }}
              >
                <ArrowUpIcon className="mr-2 h-4 w-4" />
                {t('overview.withdraw')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('消息设置被点击');
                  // TODO: 实现消息设置功能
                }}
              >
                <BellIcon className="mr-2 h-4 w-4" />
                {t('overview.message_settings')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('安全设置被点击');
                  // TODO: 实现安全设置功能
                }}
              >
                <ShieldCheckIcon className="mr-2 h-4 w-4" />
                {t('overview.security_settings')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('关注列表被点击');
                  // TODO: 实现关注列表功能
                }}
              >
                <HeartIcon className="mr-2 h-4 w-4" />
                {t('overview.follow_list')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  console.log('钱包管理被点击');
                  // TODO: 实现钱包管理功能
                }}
              >
                <WalletIcon className="mr-2 h-4 w-4" />
                {t('overview.wallet_management')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleDisconnect}
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                {t('overview.disconnect')}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 统计卡片 */}
        {userStats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-mono-bold text-foreground">{userStats.totalChallengesCreated}</div>
              <div className="text-sm text-muted-foreground font-body">{t('overview.created_challenges')}</div>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-mono-bold text-foreground">{userStats.totalChallengesParticipated}</div>
              <div className="text-sm text-muted-foreground font-body">{t('overview.participated_challenges')}</div>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-mono-bold text-foreground">{userStats.totalEarnings.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground font-body">{t('overview.total_earnings_sol')}</div>
            </div>
          </div>
        )}

        {/* 标签页导航 */}
        <div className="bg-card rounded-xl shadow-sm mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
              {[
                { key: 'challenges', label: t('tabs.my_challenges') },
                { key: 'bets', label: t('tabs.bet_records') },
                { key: 'nfts', label: t('tabs.nft_collection') },
                { key: 'stats', label: t('tabs.detailed_stats') }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-2 border-b-2 font-button text-sm transition-colors flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {/* 我的挑战 */}
            {activeTab === 'challenges' && (
              <div className="space-y-4">
                {userChallenges.length === 0 ? (
                  <div className="text-center py-8">
                    <TrophyIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('challenges.no_challenges')}</p>
                  </div>
                ) : (
                  userChallenges.map(challenge => (
                    <div key={challenge.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-foreground">{translateChallengeTitle(challenge.title)}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              challenge.type === 'created' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {challenge.type === 'created' ? t('challenges.created') : t('challenges.participated')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                              <span className="font-mono">{challenge.prizePool} SOL</span>
                            </span>
                            <span className="flex items-center font-body">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {challenge.status === 'active' ? formatTimeRemaining(challenge.endTime) : t('challenges.ended')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {challenge.result && (
                            <div className="flex items-center space-x-1 mb-2">
                              {challenge.result === 'success' ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircleIcon className="w-5 h-5 text-red-500" />
                              )}
                              <span className={`text-sm font-button ${
                                challenge.result === 'success' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {challenge.result === 'success' ? t('challenges.success') : t('challenges.failed')}
                              </span>
                            </div>
                          )}
                          {challenge.earnings && (
                            <div className="text-sm font-mono text-green-600">
                              +{challenge.earnings} SOL
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 下注记录 */}
            {activeTab === 'bets' && (
              <div className="space-y-4">
                {userBets.length === 0 ? (
                  <div className="text-center py-8">
                    <CurrencyDollarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('challenges.no_bets')}</p>
                  </div>
                ) : (
                  userBets.map(bet => (
                    <div key={bet.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground">{translateChallengeTitle(bet.challengeTitle)}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bet.side === 'support' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {bet.side === 'support' ? 'YES' : 'NO'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              bet.status === 'won' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bet.status === 'pending' ? t('challenges.pending') :
                               bet.status === 'won' ? t('challenges.won') : t('challenges.failed')}
                            </span>
                            <span className="text-muted-foreground">{bet.amount} SOL</span>
                            <span className="text-muted-foreground">{bet.timestamp.toLocaleDateString()}</span>
                          </div>
                          {bet.earnings && (
                            <div className="text-sm font-mono text-green-600 font-semibold">
                              +{bet.earnings} SOL
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* NFT收藏 */}
            {activeTab === 'nfts' && (
              <div>
                {userNFTs.length === 0 ? (
                  <div className="text-center py-8">
                    <PhotoIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('challenges.no_nfts')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userNFTs.map(nft => (
                      <div key={nft.id} className="bg-muted rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-background rounded-lg mb-4 overflow-hidden">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{nft.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)}`}>
                              {getRarityName(nft.rarity)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{translateChallengeTitle(nft.challengeTitle)}</p>
                          <p className="text-xs text-muted-foreground">
                            {nft.mintDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 详细统计 */}
            {activeTab === 'stats' && userStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{t('challenges.challenge_stats')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.challenges_created_count')}</span>
                      <span className="font-mono text-foreground">{userStats.totalChallengesCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.challenges_participated_count')}</span>
                      <span className="font-mono text-foreground">{userStats.totalChallengesParticipated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.success_rate')}</span>
                      <span className="font-mono text-green-600">{userStats.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.nft_collection_count')}</span>
                      <span className="font-mono text-foreground">{userStats.nftCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{t('challenges.bet_stats')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.total_bets_count')}</span>
                      <span className="font-mono text-foreground">{userStats.totalBets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.win_rate')}</span>
                      <span className="font-mono text-green-600">{userStats.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.total_earnings')}</span>
                      <span className="font-mono text-purple-600">{userStats.totalEarnings.toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-body">{t('challenges.global_rank')}</span>
                      <span className="font-mono text-foreground">#{userStats.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
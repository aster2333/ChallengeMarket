import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Clock, Trophy, Search, Filter, ChevronDown } from 'lucide-react';
import { ChallengeCard } from '../components/ChallengeCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useStore, Challenge } from '../store/useStore';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation('home');
  const { challenges, setChallenges, isLoading, setIsLoading } = useStore();
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'ending'>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'volume' | 'latest' | 'intense'>('volume');
  const [duration, setDuration] = useState<'hour' | 'day' | 'week' | 'month' | 'all'>('all');
  const [status, setStatus] = useState<'active' | 'ended' | 'all'>('all');
  // 模拟数据 - 增加更多挑战事件
  const mockChallenges = useMemo<Challenge[]>(
    () => [
    {
      id: '1',
      title: '俯卧撑挑战',
      description: '24小时内完成100个俯卧撑，需要提供视频证明',
      content: '24小时内完成100个俯卧撑挑战',
      creator: 'FitnessKing',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12小时后
      status: 'active',
      poolAmount: 5.2,
      participantCount: 23,
      acceptorCount: 8,
      betCount: 15,
      maxParticipants: 50,
      category: 'fitness',
      yesVotes: 120,
      delayVotes: 80,
    },
    {
      id: '2',
      title: '烹饪挑战',
      description: '一天内学会制作一道新菜并拍摄完整的制作过程',
      content: '一天内学会制作一道新菜并拍摄视频',
      creator: 'ChefMaster',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6小时后
      status: 'active',
      poolAmount: 8.7,
      participantCount: 45,
      acceptorCount: 12,
      betCount: 33,
      maxParticipants: 30,
      category: 'creative',
      yesVotes: 85,
      delayVotes: 115,
    },
    {
      id: '3',
      title: '编程挑战',
      description: '48小时内完成一个功能完整的小程序开发',
      content: '48小时内完成一个小程序开发',
      creator: 'CodeNinja',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
      status: 'active',
      poolAmount: 15.3,
      participantCount: 67,
      acceptorCount: 5,
      betCount: 62,
      maxParticipants: 20,
      category: 'business',
      yesVotes: 150,
      delayVotes: 50,
    },
    {
      id: '4',
      title: '阅读挑战',
      description: '7天内读完一本300页的书并写出详细的读后感',
      content: '7天内读完一本300页的书并写读后感',
      creator: 'BookLover',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
      status: 'active',
      poolAmount: 3.8,
      participantCount: 34,
      acceptorCount: 15,
      betCount: 19,
      maxParticipants: 100,
      category: 'learning',
      yesVotes: 95,
      delayVotes: 65,
    },
    {
      id: '5',
      title: '冥想挑战',
      description: '30天内每天坚持冥想15分钟，需要记录冥想日志',
      content: '30天内每天坚持冥想15分钟',
      creator: 'ZenMaster',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25天后
      status: 'active',
      poolAmount: 12.5,
      participantCount: 89,
      acceptorCount: 3,
      betCount: 86,
      maxParticipants: 200,
      category: 'fitness',
      yesVotes: 180,
      delayVotes: 120,
    },
    {
      id: '6',
      title: '音乐挑战',
      description: '一周内学会弹奏一首完整的吉他曲并录制演奏视频',
      content: '一周内学会弹奏一首完整的吉他曲',
      creator: 'MusicFan',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4天后
      status: 'active',
      poolAmount: 7.2,
      participantCount: 28,
      acceptorCount: 9,
      betCount: 19,
      maxParticipants: 40,
      category: 'creative',
      yesVotes: 70,
      delayVotes: 90,
    },
    {
      id: '7',
      title: '数字艺术挑战',
      description: '24小时内创作并发布一幅原创数字艺术作品',
      content: '24小时内创作并发布一幅数字艺术作品',
      creator: 'DigitalArtist',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18小时后
      status: 'active',
      poolAmount: 6.9,
      participantCount: 41,
      acceptorCount: 7,
      betCount: 34,
      maxParticipants: 25,
      category: 'creative',
      yesVotes: 110,
      delayVotes: 40,
    },
    {
      id: '8',
      title: '英语学习挑战',
      description: '3天内掌握10个新的英语单词并用它们造句',
      content: '3天内掌握10个新的英语单词并造句',
      creator: 'EnglishPro',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
      status: 'active',
      poolAmount: 4.1,
      participantCount: 52,
      acceptorCount: 18,
      betCount: 34,
      maxParticipants: 80,
      category: 'learning',
      yesVotes: 60,
      delayVotes: 100,
    },
    {
      id: '9',
      title: '跑步挑战',
      description: '一周内完成5公里跑步，每天不少于1公里',
      content: '一周内完成5公里跑步，每天不少于1公里',
      creator: 'RunnerLife',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6天后
      status: 'active',
      poolAmount: 9.3,
      participantCount: 76,
      acceptorCount: 11,
      betCount: 65,
      maxParticipants: 150,
      category: 'fitness',
      yesVotes: 200,
      delayVotes: 75,
    },
    {
      id: '10',
      title: '短视频挑战',
      description: '48小时内制作一个创意短视频并获得100个点赞',
      content: '48小时内制作一个创意短视频并获得100个点赞',
      creator: 'VideoCreator',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36小时后
      status: 'active',
      poolAmount: 11.8,
      participantCount: 63,
      acceptorCount: 6,
      betCount: 57,
      maxParticipants: 35,
      category: 'creative',
      yesVotes: 130,
      delayVotes: 170,
    },
    {
      id: '11',
      title: '咖啡拉花挑战',
      description: '一天内学会制作3种不同的咖啡拉花图案',
      content: '一天内学会制作3种不同的咖啡拉花',
      creator: 'CoffeeMaster',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20小时后
      status: 'active',
      poolAmount: 5.7,
      participantCount: 39,
      acceptorCount: 13,
      betCount: 26,
      maxParticipants: 30,
      category: 'creative',
      yesVotes: 80,
      delayVotes: 45,
    },
    {
      id: '12',
      title: '网站设计挑战',
      description: '72小时内完成一个完整的响应式网站设计稿',
      content: '72小时内完成一个完整的网站设计稿',
      creator: 'UIDesigner',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
      status: 'active',
      poolAmount: 18.2,
      participantCount: 45,
      acceptorCount: 4,
      betCount: 41,
      maxParticipants: 15,
      category: 'business',
      yesVotes: 90,
      delayVotes: 110,
    },
    {
      id: '13',
      title: '写作挑战',
      description: '一周内每天写500字日记，记录生活感悟和思考',
      content: '一周内每天写500字日记，记录生活感悟',
      creator: 'WriterSoul',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
      status: 'active',
      poolAmount: 6.4,
      participantCount: 58,
      acceptorCount: 16,
      betCount: 42,
      maxParticipants: 100,
      category: 'creative',
      yesVotes: 140,
      delayVotes: 60,
    },
    {
      id: '14',
      title: '寿司制作挑战',
      description: '24小时内学会制作寿司并邀请朋友品尝评价',
      content: '24小时内学会制作寿司并邀请朋友品尝',
      creator: 'SushiChef',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 15 * 60 * 60 * 1000), // 15小时后
      status: 'active',
      poolAmount: 8.9,
      participantCount: 32,
      acceptorCount: 10,
      betCount: 22,
      maxParticipants: 25,
      category: 'creative',
      yesVotes: 55,
      delayVotes: 85,
    },
    {
      id: '15',
      title: '技术学习挑战',
      description: '一个月内每周至少阅读2篇技术文章并做详细笔记',
      content: '一个月内每周至少阅读2篇技术文章并做笔记',
      creator: 'TechGeek',
      createdAt: new Date(),
      endTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28天后
      status: 'active',
      poolAmount: 14.6,
      participantCount: 71,
      acceptorCount: 8,
      betCount: 63,
      maxParticipants: 120,
      category: 'learning',
      yesVotes: 160,
      delayVotes: 90,
    },
  ],
    []
  );

  useEffect(() => {
    // 模拟加载数据
    setIsLoading(true);
    setTimeout(() => {
      setChallenges(mockChallenges);
      setIsLoading(false);
    }, 1000);
  }, [mockChallenges, setChallenges, setIsLoading]);

  const filteredChallenges = challenges.filter(challenge => {
    // 首先根据搜索查询过滤
    const matchesSearch = searchQuery === '' || 
      challenge.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 根据状态下拉框过滤
    if (status !== 'all' && challenge.status !== status) {
      return false;
    }

    // 根据时长过滤
    const now = new Date().getTime();
    const challengeEndTime = challenge.endTime.getTime();
    const timeDiff = challengeEndTime - now;
    
    switch (duration) {
      case 'hour':
        if (timeDiff > 24 * 60 * 60 * 1000) return false;
        break;
      case 'day':
        if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
        break;
      case 'week':
        if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false;
        break;
      case 'month':
        if (timeDiff > 365 * 24 * 60 * 60 * 1000) return false;
        break;
      case 'all':
      default:
        break;
    }

    // 然后根据标签页过滤
    switch (activeTab) {
      case 'hot':
        return challenge.status === 'active';
      case 'new':
        return challenge.status === 'active';
      case 'ending':
        return challenge.status === 'active';
      default:
        return true;
    }
  }).sort((a, b) => {
    // 根据排序方式排序
    switch (sortBy) {
      case 'volume':
        return b.poolAmount - a.poolAmount;
      case 'latest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'intense':
        return b.betCount - a.betCount;
      default:
        // 如果没有选择排序方式，则根据标签页排序
        switch (activeTab) {
          case 'hot':
            return b.poolAmount - a.poolAmount;
          case 'new':
            return b.createdAt.getTime() - a.createdAt.getTime();
          case 'ending':
            return a.endTime.getTime() - b.endTime.getTime();
          default:
            return 0;
        }
    }
  });

  // 调试信息：显示当前筛选条件
  console.log('筛选条件:', { sortBy, duration, status, searchQuery, activeTab });
  console.log('原始挑战数:', challenges.length);
  console.log('筛选后挑战数:', filteredChallenges.length);

  // 点击外部关闭筛选面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 更精确的外部点击检测，确保不会误关闭筛选栏
      if (showFilters && !target.closest('.filter-container') && !target.closest('.filter-button')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6">
        <div className="relative z-40 filter-container">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-card rounded-xl shadow-sm focus:border-primary focus:ring-primary transition-all duration-200"
              />
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(!showFilters);
              }}
              variant={showFilters ? "default" : "outline"}
              className={`filter-button px-4 py-4 rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg' 
                  : 'border-2 border-border hover:border-primary hover:text-primary text-foreground'
              }`}
            >
              <Filter className="w-5 h-5 text-current" />
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 text-current ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {/* Active Filters Indicator */}
          {(sortBy !== 'volume' || duration !== 'all' || status !== 'all') && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sortBy !== 'volume' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {sortBy === 'latest' && t('filters.active_filters.latest')}
                  {sortBy === 'intense' && t('filters.active_filters.intense')}
                  <button
                    onClick={() => setSortBy('volume')}
                    className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                  >
                    ×
                  </button>
                </span>
              )}
              {duration !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {duration === 'hour' && t('filters.active_filters.hour')}
                  {duration === 'day' && t('filters.active_filters.day')}
                  {duration === 'week' && t('filters.active_filters.week')}
    
                  <button
                    onClick={() => setDuration('all')}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              )}
              {status !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {status === 'active' && t('filters.active_filters.active')}
                  {status === 'ended' && t('filters.active_filters.ended')}
                  <button
                    onClick={() => setStatus('all')}
                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Filter Options */}
          <div className={`mt-3 transition-all duration-300 ease-in-out overflow-hidden ${
            showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-6 bg-card rounded-xl shadow-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 排序方式 */}
                <div className="space-y-2">
                  <label className="block text-sm font-heading font-semibold text-foreground mb-3">{t('filters.sort_by')}</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'volume' | 'latest' | 'intense')}
                      className="w-full px-4 py-3 bg-muted border-2 border-border rounded-lg focus:border-primary focus:ring-primary focus:bg-background transition-all duration-200 appearance-none cursor-pointer hover:border-muted-foreground font-body text-foreground"
                    >
                      <option value="volume">{t('filters.sort_options.volume')}</option>
                      <option value="latest">{t('filters.sort_options.latest')}</option>
                      <option value="intense">{t('filters.sort_options.intense')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                
                {/* 时长 */}
                <div className="space-y-2">
                  <label className="block text-sm font-heading font-semibold text-foreground mb-3">{t('filters.time_range')}</label>
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value as 'hour' | 'day' | 'week' | 'month' | 'all')}
                      className="w-full px-4 py-3 bg-muted border-2 border-border rounded-lg focus:border-primary focus:ring-primary focus:bg-background transition-all duration-200 appearance-none cursor-pointer hover:border-muted-foreground font-body text-foreground"
                    >
                      <option value="hour">{t('filters.time_options.hour')}</option>
                      <option value="day">{t('filters.time_options.day')}</option>
                      <option value="week">{t('filters.time_options.week')}</option>
        
                      <option value="all">{t('filters.time_options.all')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                
                {/* 状态 */}
                <div className="space-y-2">
                  <label className="block text-sm font-heading font-semibold text-foreground mb-3">{t('filters.status')}</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'ended' | 'all')}
                      className="w-full px-4 py-3 bg-muted border-2 border-border rounded-lg focus:border-primary focus:ring-primary focus:bg-background transition-all duration-200 appearance-none cursor-pointer hover:border-muted-foreground font-body text-foreground"
                    >
                      <option value="all">{t('filters.status_options.all')}</option>
                      <option value="active">{t('filters.status_options.active')}</option>
                      <option value="ended">{t('filters.status_options.ended')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>
              

            </div>
          </div>
        </div>
      </div>

      {/* Challenge Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-20 md:mb-0">
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {[
                { key: 'new', label: t('tabs.custom'), icon: Plus },
                { key: 'hot', label: t('tabs.hot'), icon: TrendingUp },
                { key: 'ending', label: t('tabs.ending'), icon: Clock }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'hot' | 'new' | 'ending')}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-button whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Challenge List */}
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredChallenges.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-heading text-foreground mb-2">{t('empty_state.title')}</h3>
                <p className="text-muted-foreground font-body">
                  {searchQuery ? t('search.no_results') : t('search.no_challenges')}
                </p>
                <Link to="/create">
                  <Button className="mt-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 font-button">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('search.create_challenge')}
                  </Button>
                </Link>
              </div>
            ) : (
              filteredChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
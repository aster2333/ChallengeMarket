import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, DollarSign, TrendingUp, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Challenge } from '../store/useStore';
import { Button } from './ui/button';
import image1 from '../assets/1.jpg';
import image2 from '../assets/2.jpg';
import image3 from '../assets/3.jpg';

interface ChallengeCardProps {
  challenge: Challenge;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  
  // 基于挑战ID选择固定的封面图片
  const images = [image1, image2, image3];
  const imageIndex = challenge.id ? parseInt(challenge.id) % images.length : 0;
  const selectedImage = images[imageIndex];

  // 使用挑战数据中的投票数据，如果没有则使用默认值
  const yesVotes = challenge.yesVotes || Math.floor(Math.random() * 100) + 50;
  const delayVotes = challenge.delayVotes || Math.floor(Math.random() * 80) + 30;
  const totalVotes = yesVotes + delayVotes;
  
  // 计算百分比
  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50;
  const delayPercentage = totalVotes > 0 ? (delayVotes / totalVotes) * 100 : 50;

  // 真实的挑战标题示例
  const challengeTitles = [
    t('challenge_card.titles.develop_dapp'),
    t('challenge_card.titles.heartbeat_challenge'),
    t('challenge_card.titles.no_sleep_challenge'),
    t('challenge_card.titles.running_challenge'),
    t('challenge_card.titles.coding_marathon'),
    t('challenge_card.titles.fitness_challenge'),
    t('challenge_card.titles.learn_skill'),
    t('challenge_card.titles.creative_design'),
    t('challenge_card.titles.music_creation'),
    t('challenge_card.titles.cooking_challenge')
  ];

  // 真实的挑战描述示例
  const challengeDescriptions = [
    t('challenge_card.descriptions.develop_dapp'),
    t('challenge_card.descriptions.heartbeat_challenge'),
    t('challenge_card.descriptions.no_sleep_challenge'),
    t('challenge_card.descriptions.running_challenge'),
    t('challenge_card.descriptions.coding_marathon')
  ];

  // 获取挑战标题和描述
  const getRandomTitle = () => {
    const index = challenge.id ? parseInt(challenge.id) % challengeTitles.length : 0;
    return challengeTitles[index];
  };

  const getRandomDescription = () => {
    const index = challenge.id ? parseInt(challenge.id) % challengeDescriptions.length : 0;
    return challengeDescriptions[index];
  };

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return t('challenge_card.status.ended');
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'voting':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t('challenge_card.status.active');
      case 'voting':
        return t('challenge_card.status.voting');
      case 'completed':
        return t('challenge_card.status.completed');
      case 'expired':
        return t('challenge_card.status.expired');
      default:
        return t('challenge_card.status.unknown');
    }
  };

  // 按钮点击事件处理函数
  const handleBuyYes = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
    console.log('BUY YES clicked for challenge:', challenge.id);
  };

  const handleBuyDelay = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
    console.log('BUY DELAY clicked for challenge:', challenge.id);
  };

  const handleChallengeReward = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
    navigate(`/challenge/${challenge.id}`);
  };

  // 卡片点击事件处理函数
  const handleCardClick = () => {
    navigate(`/challenge/${challenge.id}`);
  };

  // 金额格式化函数
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else if (amount >= 1000) {
      const thousands = amount / 1000;
      return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
    } else {
      return amount % 1 === 0 ? `${amount}` : `${amount.toFixed(1)}`;
    }
  };

  return (
    <div 
      className="bg-card border-b border-border hover:bg-accent transition-colors p-4 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* 主要内容区域 */}
      <div className="flex items-center gap-4 mb-3">
        {/* 左侧图片 */}
        <img 
          src={selectedImage} 
          alt="Challenge cover" 
          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
        />

        {/* 中间内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-card-foreground font-heading font-semibold text-base line-clamp-1 mb-1">
            {getRandomTitle()}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 font-body">
            {getRandomDescription()}
          </p>
        </div>

        {/* 右侧价格和时间 */}
        <div className="text-right flex-shrink-0">
          <div className="text-card-foreground font-mono-bold text-xl">
            ${formatAmount(challenge.poolAmount * 100)}
          </div>
          <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-body">
            <span className="mr-1">↗</span>
            {formatTimeRemaining(challenge.endTime)}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
            style={{ width: `${yesPercentage}%` }}
          ></div>
          <div 
            className="bg-gradient-to-l from-red-400 to-red-500 transition-all duration-300"
            style={{ width: `${delayPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 font-body">
        <div className="flex items-center gap-4">
          <span className="font-mono-bold">ATH ${formatAmount(challenge.poolAmount * 100 * 1.5)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span className="font-mono">{challenge.participantCount}</span>
        </div>
      </div>

      {/* 三个按钮 */}
      <div className="flex gap-2 w-full">
        <Button 
          onClick={handleBuyYes}
          className="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-button font-medium rounded-lg h-10 text-sm"
        >
          {t('challenge_card.buttons.buy_yes')}
        </Button>
        <Button 
          onClick={handleBuyDelay}
          className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-button font-medium rounded-lg h-10 text-sm"
        >
          {t('challenge_card.buttons.buy_delay')}
        </Button>
        <Button 
          onClick={handleChallengeReward}
          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 dark:from-purple-600 dark:to-blue-600 dark:hover:from-purple-700 dark:hover:to-blue-700 text-white font-button font-medium rounded-lg h-10 text-sm"
        >
          {t('challenge_card.buttons.challenge_reward')}
        </Button>
      </div>
    </div>
  );
};
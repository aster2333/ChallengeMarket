import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChallengeCard } from '../components/ChallengeCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useStore, type Challenge, type ChallengeCategory, type ChallengeStatus } from '../store/useStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { fetchChallenges } from '../lib/api';
import type { ChallengeDto } from '../../types/api';

const mapStatus = (status: string): ChallengeStatus => {
  switch (status) {
    case 'active':
    case 'completed':
    case 'expired':
    case 'voting':
    case 'settled':
      return status;
    default:
      return 'active';
  }
};

const mapCategory = (category: string): ChallengeCategory => {
  const categories: ChallengeCategory[] = ['fitness', 'learning', 'creative', 'social', 'business', 'other'];
  return categories.includes(category as ChallengeCategory) ? (category as ChallengeCategory) : 'other';
};

const mapChallengeDto = (dto: ChallengeDto): Challenge => ({
  id: dto.id,
  title: dto.title,
  description: dto.description,
  creator: dto.creator_public_key,
  createdAt: new Date(dto.created_at),
  endTime: new Date(dto.deadline),
  status: mapStatus(dto.status),
  poolAmount: dto.prize_pool,
  participantCount: dto.bet_count,
  acceptorCount: 0,
  betCount: dto.bet_count,
  maxParticipants: 0,
  category: mapCategory(dto.category),
  durationHours: dto.duration_hours,
  yesVotes: Math.round(dto.yes_amount * 100),
  delayVotes: Math.round(dto.no_amount * 100),
  treasuryAddress: dto.treasury_address,
  totalBetAmount: dto.total_bet_amount,
  yesAmount: dto.yes_amount,
  noAmount: dto.no_amount,
  image: dto.image ?? null,
});

const sortChallenges = (challenges: Challenge[], sortBy: string): Challenge[] => {
  switch (sortBy) {
    case 'latest':
      return [...challenges].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case 'intense':
      return [...challenges].sort((a, b) => {
        const diffA = Math.abs((a.yesAmount ?? 0) - (a.noAmount ?? 0));
        const diffB = Math.abs((b.yesAmount ?? 0) - (b.noAmount ?? 0));
        return diffB - diffA;
      });
    case 'volume':
    default:
      return [...challenges].sort((a, b) => (b.totalBetAmount ?? 0) - (a.totalBetAmount ?? 0));
  }
};

export default function Home() {
  const { t } = useTranslation('home');
  const { challenges, setChallenges, isLoading, setIsLoading } = useStore();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'latest' | 'intense'>('volume');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchChallenges();
      const mapped = data.map(mapChallengeDto);
      setChallenges(mapped);
    } catch (error) {
      handleError(error, t('errors.load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [handleError, setChallenges, setIsLoading, t]);

  useEffect(() => {
    if (!challenges.length) {
      void loadChallenges();
    }
  }, [challenges.length, loadChallenges]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadChallenges();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredChallenges = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const filtered = normalized
      ? challenges.filter((challenge) =>
          `${challenge.title} ${challenge.description}`.toLowerCase().includes(normalized),
        )
      : challenges;

    return sortChallenges(filtered, sortBy);
  }, [challenges, searchQuery, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground font-body">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="font-button">
            {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {t('actions.refresh')}
          </Button>
          <Button asChild className="font-button">
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              {t('actions.create')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('search.placeholder')}
          className="font-body"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={sortBy === 'volume' ? 'default' : 'outline'}
            onClick={() => setSortBy('volume')}
            className="font-button"
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('filters.volume')}
          </Button>
          <Button
            type="button"
            variant={sortBy === 'latest' ? 'default' : 'outline'}
            onClick={() => setSortBy('latest')}
            className="font-button"
          >
            {t('filters.latest')}
          </Button>
          <Button
            type="button"
            variant={sortBy === 'intense' ? 'default' : 'outline'}
            onClick={() => setSortBy('intense')}
            className="font-button"
          >
            {t('filters.intense')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center mt-16">
          <LoadingSpinner />
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground font-body">
          {t('empty_state')}
        </div>
      ) : (
        <div className="mt-10 grid gap-4">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
}

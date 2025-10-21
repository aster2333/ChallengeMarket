import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Coins, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useStore, type Challenge } from '../store/useStore';
import { Button } from './ui/button';

interface ChallengeCardProps {
  challenge: Challenge;
}

const defaultImages = [
  'https://images.solanarpc.io/challenges/running.jpg',
  'https://images.solanarpc.io/challenges/fitness.jpg',
  'https://images.solanarpc.io/challenges/learning.jpg',
];

const formatAmount = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(2);
};

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isWalletConnected } = useStore();

  const coverImage = useMemo(() => {
    if (challenge.image) {
      return challenge.image;
    }
    const index = Math.abs(challenge.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % defaultImages.length;
    return defaultImages[index];
  }, [challenge.id, challenge.image]);

  const timeRemaining = useMemo(() => {
    const diff = challenge.endTime.getTime() - Date.now();
    if (diff <= 0) {
      return 'Ended';
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }, [challenge.endTime]);

  return (
    <article className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => navigate(`/challenge/${challenge.id}`)}
        className="w-full text-left"
      >
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img src={coverImage} alt={challenge.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="uppercase text-xs tracking-wide text-muted-foreground font-mono">
              {challenge.category}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{timeRemaining}</span>
          </div>
          <h3 className="text-lg font-heading text-foreground line-clamp-2">{challenge.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3 font-body">{challenge.description}</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1 text-foreground font-mono">
              <Coins className="w-4 h-4 text-amber-500" />
              {formatAmount(challenge.poolAmount)} SOL
            </div>
            <div className="flex items-center gap-1 text-muted-foreground font-mono">
              <Users className="w-4 h-4" />
              {challenge.participantCount}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground font-mono">
              <Clock className="w-4 h-4" />
              {challenge.durationHours ?? Math.max(1, Math.round((challenge.endTime.getTime() - challenge.createdAt.getTime()) / (1000 * 60 * 60)))}h
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 font-button" onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigate(`/challenge/${challenge.id}?action=buy&side=yes`);
            }}>
              {t('actions.bet_yes')}
            </Button>
            <Button
              className="flex-1 font-button"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                navigate(`/challenge/${challenge.id}?action=buy&side=no`);
              }}
            >
              {t('actions.bet_no')}
            </Button>
          </div>
          {!isWalletConnected && (
            <p className="text-xs text-muted-foreground font-body">
              {t('messages.connect_to_bet')}
            </p>
          )}
        </div>
      </button>
    </article>
  );
};

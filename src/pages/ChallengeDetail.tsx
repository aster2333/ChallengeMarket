import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Coins, Loader2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useStore, type Challenge, type ChallengeCategory, type ChallengeStatus } from '../store/useStore';
import { useSolana } from '../../components/solana-provider';
import { createBet, fetchChallenge } from '../lib/api';
import type { BetDto, ChallengeDetailDto } from '../../types/api';

const mapStatus = (status: string): ChallengeStatus => {
  const allowed: ChallengeStatus[] = ['active', 'completed', 'expired', 'voting', 'settled'];
  return allowed.includes(status as ChallengeStatus) ? (status as ChallengeStatus) : 'active';
};

const mapCategory = (category: string): ChallengeCategory => {
  const categories: ChallengeCategory[] = ['fitness', 'learning', 'creative', 'social', 'business', 'other'];
  return categories.includes(category as ChallengeCategory) ? (category as ChallengeCategory) : 'other';
};

const mapChallenge = (dto: ChallengeDetailDto): Challenge => ({
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
  treasuryAddress: dto.treasury_address,
  totalBetAmount: dto.total_bet_amount,
  yesAmount: dto.yes_amount,
  noAmount: dto.no_amount,
  image: dto.image ?? null,
});

interface BetRecord {
  id: string;
  bettor: string;
  amount: number;
  side: 'yes' | 'no';
  signature: string;
  recordedAt: Date;
}

const mapBet = (dto: BetDto): BetRecord => ({
  id: dto.id,
  bettor: dto.bettor_public_key,
  amount: dto.amount,
  side: dto.side,
  signature: dto.signature,
  recordedAt: new Date(dto.recorded_at),
});

const formatSol = (value: number) => `${value.toFixed(2)} SOL`;

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('challenge');
  const { handleError, handlePromise } = useErrorHandler();
  const { challenges, addChallenge, updateChallenge, getChallenge } = useStore();
  const { publicKey, isConnected, sendSol } = useSolana();

  const [detail, setDetail] = useState<ChallengeDetailDto | null>(null);
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState('0.1');
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [isBetting, setIsBetting] = useState(false);

  const challengeFromStore = useMemo(() => (id ? getChallenge(id) : undefined), [getChallenge, id, challenges]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      setLoading(true);
      try {
        const dto = await fetchChallenge(id);
        setDetail(dto);
        setBets(dto.bets.map(mapBet));
        const mapped = mapChallenge(dto);
        if (challengeFromStore) {
          updateChallenge(mapped.id, mapped);
        } else {
          addChallenge(mapped);
        }
      } catch (error) {
        handleError(error, t('detail.challenge_not_exist'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [addChallenge, challengeFromStore, handleError, id, t, updateChallenge]);

  const challenge = useMemo<Challenge | null>(() => {
    if (detail) {
      return mapChallenge(detail);
    }
    return challengeFromStore ?? null;
  }, [challengeFromStore, detail]);

  const handleSubmitBet = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!id || !challenge) {
      return;
    }

    if (!isConnected || !publicKey) {
      handleError(new Error('wallet not connected'), t('detail.connect_wallet_first'));
      return;
    }

    const amountNumber = Number.parseFloat(betAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      handleError(new Error('invalid amount'), t('detail.enter_bet_amount'));
      return;
    }

    setIsBetting(true);
    try {
      const signature = await handlePromise(
        sendSol(challenge.treasuryAddress ?? challenge.creator, amountNumber),
        {
          loading: t('detail.betting'),
          success: undefined,
          error: t('detail.bet_failed'),
        },
      );

      await handlePromise(
        createBet(id, {
          bettor_public_key: publicKey,
          amount: amountNumber,
          side: betSide,
          signature,
          destination: challenge.treasuryAddress ?? challenge.creator,
        }),
        {
          loading: undefined,
          success: t('detail.bet_success'),
          error: t('detail.bet_failed'),
        },
      );

      setBetAmount('0.1');

      const dto = await fetchChallenge(id);
      setDetail(dto);
      setBets(dto.bets.map(mapBet));
      updateChallenge(dto.id, mapChallenge(dto));
    } catch (error) {
      handleError(error, t('detail.bet_failed'));
    } finally {
      setIsBetting(false);
    }
  };

  if (!challenge) {
    if (loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground font-body mb-4">{t('detail.challenge_not_exist')}</p>
        <Button onClick={() => navigate('/')}>{t('detail.return_home')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="font-button">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('detail.back')}
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="uppercase tracking-wide font-mono">
              {challenge.category}
            </Badge>
            <CardTitle className="text-2xl font-heading text-foreground">{challenge.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground font-body leading-relaxed">{challenge.description}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-sm text-muted-foreground">{t('detail.prize_pool')}</div>
              <div className="text-xl font-heading flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                {formatSol(challenge.poolAmount)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-sm text-muted-foreground">{t('detail.total_bets')}</div>
              <div className="text-xl font-heading">{formatSol(challenge.totalBetAmount ?? 0)}</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-sm text-muted-foreground">{t('detail.participants')}</div>
              <div className="text-xl font-heading flex items-center gap-2">
                <Users className="w-5 h-5" />
                {challenge.participantCount}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground font-mono">
            <span>{t('detail.creator')}: {challenge.creator}</span>
            <span>{t('detail.deadline')}: {challenge.endTime.toLocaleString()}</span>
            <span>
              {t('detail.status')}: {t(`status.${challenge.status}`, { defaultValue: challenge.status })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t('detail.bet_records')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmitBet} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            <Input
              value={betAmount}
              onChange={(event) => setBetAmount(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.10"
              className="font-mono"
            />
            <select
              value={betSide}
              onChange={(event) => setBetSide(event.target.value as 'yes' | 'no')}
              className="border border-border rounded-md px-3 py-2 font-body bg-background"
            >
              <option value="yes">{t('detail.yes')}</option>
              <option value="no">{t('detail.no')}</option>
            </select>
            <Button type="submit" disabled={isBetting} className="font-button">
              {isBetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('detail.confirm_purchase')}
            </Button>
          </form>

          {bets.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">{t('detail.bet_records')} (0)</p>
          ) : (
            <div className="space-y-3">
              {bets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                  <div>
                    <div className="font-mono text-sm">{bet.bettor}</div>
                    <div className="text-xs text-muted-foreground">{bet.recordedAt.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={bet.side === 'yes' ? 'default' : 'outline'}>{bet.side.toUpperCase()}</Badge>
                    <span className="font-heading">{formatSol(bet.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

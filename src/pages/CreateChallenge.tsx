import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useStore, type Challenge, type ChallengeCategory, type ChallengeStatus } from '../store/useStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useSolana } from '../../components/solana-provider';
import { createChallenge } from '../lib/api';
import type { ChallengeDto } from '../../types/api';

const mapStatus = (status: string): ChallengeStatus => {
  const allowed: ChallengeStatus[] = ['active', 'completed', 'expired', 'voting', 'settled'];
  return allowed.includes(status as ChallengeStatus) ? (status as ChallengeStatus) : 'active';
};

const mapCategory = (category: string): ChallengeCategory => {
  const categories: ChallengeCategory[] = ['fitness', 'learning', 'creative', 'social', 'business', 'other'];
  return categories.includes(category as ChallengeCategory) ? (category as ChallengeCategory) : 'other';
};

const mapChallenge = (dto: ChallengeDto): Challenge => ({
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

interface FormState {
  title: string;
  description: string;
  category: string;
  prizePool: string;
  durationHours: string;
  treasuryAddress: string;
  allowRandomStop: boolean;
  imageFile: File | null;
}

const TREASURY_FALLBACK = import.meta.env.VITE_TREASURY_ADDRESS ?? '';

const convertFileToBase64 = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('challenge');
  const { addChallenge } = useStore();
  const { handleError, handlePromise, handleSuccess } = useErrorHandler();
  const { publicKey, isConnected } = useSolana();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: 'creative',
    prizePool: '1',
    durationHours: '24',
    treasuryAddress: TREASURY_FALLBACK,
    allowRandomStop: false,
    imageFile: null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isConnected || !publicKey) {
      handleError(new Error('wallet not connected'), t('create.connect_wallet'));
      return;
    }

    if (!form.treasuryAddress) {
      handleError(new Error('treasury address required'), t('create.errors.treasury_required'));
      return;
    }

    const prizePoolNumber = Number.parseFloat(form.prizePool);
    const durationNumber = Number.parseInt(form.durationHours, 10);

    if (!Number.isFinite(prizePoolNumber) || prizePoolNumber <= 0) {
      handleError(new Error('invalid prize pool'), t('create.errors.invalid_prize_pool'));
      return;
    }

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      handleError(new Error('invalid duration'), t('create.errors.invalid_duration'));
      return;
    }

    setIsSubmitting(true);

    try {
      const imageData = form.imageFile ? await convertFileToBase64(form.imageFile) : preview;
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        prize_pool: prizePoolNumber,
        duration_hours: durationNumber,
        allow_random_stop: form.allowRandomStop,
        image: imageData,
        treasury_address: form.treasuryAddress,
        creator_public_key: publicKey,
      } satisfies Parameters<typeof createChallenge>[0];

      const dto = await handlePromise(
        createChallenge(payload),
        {
          loading: t('create.form.creating'),
          success: t('create.success'),
          error: t('create.error'),
        },
      );

      const challenge = mapChallenge(dto);
      addChallenge(challenge);
      handleSuccess(t('create.success'));
      navigate(`/challenge/${challenge.id}`);
    } catch (error) {
      handleError(error, t('create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="font-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('create.back')}
        </Button>
        <h1 className="text-3xl font-heading text-foreground">{t('create.title')}</h1>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="title">{t('create.form.challenge_title')}</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="font-body"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('create.form.description')}</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={6}
            required
            className="font-body"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">{t('create.form.category')}</Label>
            <select
              id="category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="border border-border rounded-md px-3 py-2 bg-background font-body"
            >
              <option value="fitness">{t('create.categories.fitness')}</option>
              <option value="learning">{t('create.categories.learning')}</option>
              <option value="creative">{t('create.categories.creative')}</option>
              <option value="social">{t('create.categories.social')}</option>
              <option value="business">{t('create.categories.business')}</option>
              <option value="other">{t('create.categories.other')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prizePool">{t('create.form.prize_pool')}</Label>
            <Input
              id="prizePool"
              type="number"
              min="0"
              step="0.01"
              value={form.prizePool}
              onChange={(event) => setForm((prev) => ({ ...prev, prizePool: event.target.value }))}
              className="font-body"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duration">{t('create.form.duration_hours')}</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              step="1"
              value={form.durationHours}
              onChange={(event) => setForm((prev) => ({ ...prev, durationHours: event.target.value }))}
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treasury">{t('create.form.treasury_address')}</Label>
            <Input
              id="treasury"
              value={form.treasuryAddress}
              onChange={(event) => setForm((prev) => ({ ...prev, treasuryAddress: event.target.value }))}
              className="font-mono"
              placeholder="Treasury public key"
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="allowRandomStop"
            type="checkbox"
            checked={form.allowRandomStop}
            onChange={(event) => setForm((prev) => ({ ...prev, allowRandomStop: event.target.checked }))}
          />
          <Label htmlFor="allowRandomStop" className="text-sm text-muted-foreground">
            {t('create.form.allow_random_stop')}
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">{t('create.form.cover')}</Label>
          <div className="border border-dashed border-border rounded-xl p-6 text-center">
            {preview ? (
              <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-lg object-cover" />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2 font-body">
                <ImagePlus className="w-8 h-8" />
                <span>{t('create.form.cover_hint')}</span>
              </div>
            )}
            <Input id="image" type="file" accept="image/*" className="mt-4" onChange={handleFileChange} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/')}> 
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="font-button">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {t('create.form.launch_challenge')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateChallenge;

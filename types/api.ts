export interface ChallengeDto {
  id: string;
  title: string;
  description: string;
  category: string;
  prize_pool: number;
  duration_hours: number;
  allow_random_stop: boolean;
  image?: string | null;
  treasury_address: string;
  creator_public_key: string;
  created_at: string;
  deadline: string;
  status: string;
  bet_count: number;
  total_bet_amount: number;
  yes_amount: number;
  no_amount: number;
}

export interface BetDto {
  id: string;
  challenge_id: string;
  bettor_public_key: string;
  amount: number;
  side: 'yes' | 'no';
  signature: string;
  destination: string;
  recorded_at: string;
  status: string;
}

export interface ChallengeDetailDto extends ChallengeDto {
  bets: BetDto[];
}

export interface CreateChallengePayload {
  title: string;
  description: string;
  category: string;
  prize_pool: number;
  duration_hours: number;
  allow_random_stop: boolean;
  image?: string | null;
  treasury_address: string;
  creator_public_key: string;
}

export interface CreateBetPayload {
  bettor_public_key: string;
  amount: number;
  side: 'yes' | 'no';
  signature: string;
  destination: string;
}

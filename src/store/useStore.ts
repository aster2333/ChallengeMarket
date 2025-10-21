import { create } from 'zustand';

// 挑战状态类型
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'voting' | 'settled';

// 下注类型
export type BetType = 'success' | 'partial' | 'failure';

// 挑战类型
export type ChallengeCategory = 'fitness' | 'learning' | 'creative' | 'social' | 'business' | 'other';

// 投票选项类型
export type VoteOption = 'success' | 'failed';

// 挑战数据结构
export interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: string;
  createdAt: Date;
  endTime: Date;
  status: ChallengeStatus;
  poolAmount: number;
  participantCount: number;
  acceptorCount: number;
  betCount: number;
  maxParticipants: number;
  category: ChallengeCategory;
  durationHours?: number;
  durationDays?: number;
  nftMint?: string;
  contractAddress?: string;
  evidence?: Evidence[];
  votes?: Vote[];
  yesVotes?: number;
  delayVotes?: number;
  treasuryAddress?: string;
  totalBetAmount?: number;
  yesAmount?: number;
  noAmount?: number;
  image?: string | null;
}

// 下注数据结构
export interface Bet {
  id: string;
  challengeId: string;
  bettor: string;
  betType: BetType;
  amount: number;
  potentialReturn: number;
  currentOdds: number;
  createdAt: Date;
  status: 'active' | 'won' | 'lost' | 'pending';
}

// 证据数据结构
export interface Evidence {
  id: string;
  challengeId: string;
  uploader: string;
  type: 'image' | 'video' | 'document' | 'link';
  url: string;
  description: string;
  uploadedAt: Date;
}

// 投票数据结构
export interface Vote {
  id: string;
  challengeId: string;
  voter: string;
  option: VoteOption;
  createdAt: Date;
}

// NFT数据结构
export interface NFT {
  id: string;
  mint: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  owner: string;
  challengeId?: string;
}

// 用户数据结构
export interface User {
  address: string;
  publicKey: string;
  totalEarnings: number;
  totalBets: number;
  challengesCreated: number;
  challengesAccepted: number;
  winRate: number;
  balance: number;
  nfts: NFT[];
}

// 全局状态接口
interface AppState {
  // 用户状态
  user: User | null;
  setUser: (user: User | null) => void;
  
  // 挑战状态
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: string, updates: Partial<Challenge>) => void;
  getChallenge: (id: string) => Challenge | undefined;
  
  // 下注状态
  bets: Bet[];
  setBets: (bets: Bet[]) => void;
  addBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  getUserBets: (userAddress: string) => Bet[];
  
  // 证据状态
  evidence: Evidence[];
  setEvidence: (evidence: Evidence[]) => void;
  addEvidence: (evidence: Evidence) => void;
  getChallengeEvidence: (challengeId: string) => Evidence[];
  
  // 投票状态
  votes: Vote[];
  setVotes: (votes: Vote[]) => void;
  addVote: (vote: Vote) => void;
  getChallengeVotes: (challengeId: string) => Vote[];
  
  // NFT状态
  nfts: NFT[];
  setNfts: (nfts: NFT[]) => void;
  addNft: (nft: NFT) => void;
  getUserNfts: (userAddress: string) => NFT[];
  
  // UI状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 错误状态
  error: string | null;
  setError: (error: string | null) => void;
  
  // 模态框状态
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  
  // 钱包连接状态
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
  
  // 统计数据
  getStatistics: () => {
    totalChallenges: number;
    activeChallenges: number;
    totalPrizePool: number;
    totalParticipants: number;
  };
}

export const useStore = create<AppState>((set, get) => ({
  // 用户状态
  user: null,
  setUser: (user) => set({ user }),
  
  // 挑战状态
  challenges: [],
  setChallenges: (challenges) => set({ challenges }),
  addChallenge: (challenge) => set((state) => ({ 
    challenges: [challenge, ...state.challenges] 
  })),
  updateChallenge: (id, updates) => set((state) => ({
    challenges: state.challenges.map(challenge => 
      challenge.id === id ? { ...challenge, ...updates } : challenge
    )
  })),
  getChallenge: (id) => {
    const state = get();
    return state.challenges.find(challenge => challenge.id === id);
  },
  
  // 下注状态
  bets: [],
  setBets: (bets) => set({ bets }),
  addBet: (bet) => set((state) => ({ 
    bets: [bet, ...state.bets] 
  })),
  updateBet: (id, updates) => set((state) => ({
    bets: state.bets.map(bet => 
      bet.id === id ? { ...bet, ...updates } : bet
    )
  })),
  getUserBets: (userAddress) => {
    const state = get();
    return state.bets.filter(bet => bet.bettor === userAddress);
  },
  
  // 证据状态
  evidence: [],
  setEvidence: (evidence) => set({ evidence }),
  addEvidence: (evidence) => set((state) => ({ 
    evidence: [evidence, ...state.evidence] 
  })),
  getChallengeEvidence: (challengeId) => {
    const state = get();
    return state.evidence.filter(evidence => evidence.challengeId === challengeId);
  },
  
  // 投票状态
  votes: [],
  setVotes: (votes) => set({ votes }),
  addVote: (vote) => set((state) => ({ 
    votes: [vote, ...state.votes] 
  })),
  getChallengeVotes: (challengeId) => {
    const state = get();
    return state.votes.filter(vote => vote.challengeId === challengeId);
  },
  
  // NFT状态
  nfts: [],
  setNfts: (nfts) => set({ nfts }),
  addNft: (nft) => set((state) => ({ 
    nfts: [nft, ...state.nfts] 
  })),
  getUserNfts: (userAddress) => {
    const state = get();
    return state.nfts.filter(nft => nft.owner === userAddress);
  },
  
  // UI状态
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // 错误状态
  error: null,
  setError: (error) => set({ error }),
  
  // 模态框状态
  isWalletModalOpen: false,
  setIsWalletModalOpen: (isWalletModalOpen) => set({ isWalletModalOpen }),
  
  // 钱包连接状态
  isWalletConnected: false,
  setIsWalletConnected: (isWalletConnected) => set({ isWalletConnected }),
  
  // 统计数据
  getStatistics: () => {
    const state = get();
    const activeChallenges = state.challenges.filter(c => c.status === 'active');
    const totalPrizePool = state.challenges.reduce((sum, c) => sum + c.poolAmount, 0);
    const totalParticipants = state.challenges.reduce((sum, c) => sum + c.participantCount, 0);
    
    return {
      totalChallenges: state.challenges.length,
      activeChallenges: activeChallenges.length,
      totalPrizePool,
      totalParticipants
    };
  },
}));
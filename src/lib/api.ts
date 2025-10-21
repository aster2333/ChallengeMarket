import type {
  BetDto,
  ChallengeDetailDto,
  ChallengeDto,
  CreateBetPayload,
  CreateChallengePayload,
} from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API_PREFIX = '/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (data && typeof data.detail === 'string') {
        message = data.detail;
      }
    } catch (error) {
      console.error('Failed to parse API error response', error);
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const fetchChallenges = async (): Promise<ChallengeDto[]> => {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/challenges`);
  return handleResponse<ChallengeDto[]>(response);
};

export const fetchChallenge = async (id: string): Promise<ChallengeDetailDto> => {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/challenges/${id}`);
  return handleResponse<ChallengeDetailDto>(response);
};

export const createChallenge = async (payload: CreateChallengePayload): Promise<ChallengeDto> => {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/challenges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ChallengeDto>(response);
};

export const createBet = async (challengeId: string, payload: CreateBetPayload): Promise<BetDto> => {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/challenges/${challengeId}/bets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<BetDto>(response);
};

export const fetchBets = async (challengeId: string): Promise<BetDto[]> => {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/challenges/${challengeId}/bets`);
  return handleResponse<BetDto[]>(response);
};

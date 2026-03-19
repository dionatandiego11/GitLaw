import type {
  BootstrapPayload,
  CitizenshipIssueInput,
  ConnectSessionResponse,
  CreateForkInput,
  CreateProposalInput,
  ForkExperiment,
  ProposalCommentInput,
  ProposalView,
  ProposalVoteInput,
  WalletChallengeInput,
  WalletChallengeResponse,
  WalletVerifyInput,
} from '@/shared/domain';

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

function buildUrl(path: string) {
  return `${API_BASE}${path}`;
}

function buildHeaders(initHeaders?: HeadersInit, sessionToken?: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    ...(initHeaders ?? {}),
  };
}

async function request<T>(path: string, init?: RequestInit, sessionToken?: string | null): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: buildHeaders(init?.headers, sessionToken),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const error = new Error(payload?.error ?? 'Nao foi possivel completar a operacao.') as Error & {
      statusCode?: number;
    };
    error.statusCode = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getBootstrap(address?: string | null, sessionToken?: string | null) {
    const params = address ? `?address=${encodeURIComponent(address)}` : '';
    return request<BootstrapPayload>(`/api/bootstrap${params}`, undefined, sessionToken);
  },

  connectDemoSession() {
    return request<ConnectSessionResponse>('/api/session/connect', {
      method: 'POST',
      body: JSON.stringify({ demo: true }),
    });
  },

  requestWalletChallenge(input: WalletChallengeInput) {
    return request<WalletChallengeResponse>('/api/session/challenge', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifyWalletSession(input: WalletVerifyInput) {
    return request<ConnectSessionResponse>('/api/session/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  issueCitizenship(input: CitizenshipIssueInput, sessionToken: string) {
    return request<{ citizenAddress: string }>('/api/citizenship/issue', {
      method: 'POST',
      body: JSON.stringify(input),
    }, sessionToken);
  },

  createProposal(input: CreateProposalInput, sessionToken: string) {
    return request<{ proposal: ProposalView }>('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(input),
    }, sessionToken);
  },

  voteProposal(id: string, input: ProposalVoteInput, sessionToken: string) {
    return request<{ proposal: ProposalView }>(`/api/proposals/${id}/votes`, {
      method: 'POST',
      body: JSON.stringify(input),
    }, sessionToken);
  },

  addComment(id: string, input: ProposalCommentInput, sessionToken: string) {
    return request<{ proposal: ProposalView }>(`/api/proposals/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }, sessionToken);
  },

  markAllActivitiesRead(address: string, sessionToken: string) {
    return request<{ ok: true }>('/api/activities/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }, sessionToken);
  },

  createFork(input: CreateForkInput, sessionToken: string) {
    return request<{ fork: ForkExperiment }>('/api/forks', {
      method: 'POST',
      body: JSON.stringify(input),
    }, sessionToken);
  },
};

import type {
  BootstrapPayload,
  CitizenshipIssueInput,
  ConnectSessionInput,
  ConnectSessionResponse,
  CreateForkInput,
  CreateProposalInput,
  ForkExperiment,
  ProposalCommentInput,
  ProposalView,
  ProposalVoteInput,
} from '@/shared/domain';

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

function buildUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? 'Nao foi possivel completar a operacao.');
  }

  return response.json() as Promise<T>;
}

export const api = {
  getBootstrap(address?: string | null) {
    const params = address ? `?address=${encodeURIComponent(address)}` : '';
    return request<BootstrapPayload>(`/api/bootstrap${params}`);
  },

  connectSession(input: ConnectSessionInput) {
    return request<ConnectSessionResponse>('/api/session/connect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  issueCitizenship(input: CitizenshipIssueInput) {
    return request<{ citizenAddress: string }>('/api/citizenship/issue', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  createProposal(input: CreateProposalInput) {
    return request<{ proposal: ProposalView }>('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  voteProposal(id: string, input: ProposalVoteInput) {
    return request<{ proposal: ProposalView }>(`/api/proposals/${id}/votes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  addComment(id: string, input: ProposalCommentInput) {
    return request<{ proposal: ProposalView }>(`/api/proposals/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  markAllActivitiesRead(address: string) {
    return request<{ ok: true }>('/api/activities/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },

  createFork(input: CreateForkInput) {
    return request<{ fork: ForkExperiment }>('/api/forks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

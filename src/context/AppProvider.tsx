import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import type {
  BootstrapPayload,
  CitizenshipIssueInput,
  ConnectSessionResponse,
  CreateForkInput,
  CreateProposalInput,
  ForkExperiment,
  Law,
  Neighborhood,
  ProfileData,
  ProposalView,
  VoteChoice,
} from '@/shared/domain';

const SESSION_STORAGE_KEY = 'gitlaw.session.address';

interface AppContextValue {
  data: BootstrapPayload | null;
  currentAddress: string | null;
  currentCitizen: BootstrapPayload['session']['citizen'];
  currentRequest: BootstrapPayload['session']['pendingRequest'];
  profile: ProfileData | null;
  laws: Law[];
  proposals: ProposalView[];
  neighborhoods: Neighborhood[];
  forks: ForkExperiment[];
  activities: BootstrapPayload['activities'];
  commits: BootstrapPayload['commits'];
  feed: BootstrapPayload['feed'] | null;
  isLoading: boolean;
  actionError: string | null;
  connectWallet: () => Promise<ConnectSessionResponse>;
  connectDemoWallet: () => Promise<ConnectSessionResponse>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  issueCitizenship: (input: Omit<CitizenshipIssueInput, 'address'>) => Promise<void>;
  createProposal: (input: Omit<CreateProposalInput, 'authorAddress'>) => Promise<ProposalView>;
  voteProposal: (id: string, choice: VoteChoice) => Promise<ProposalView>;
  addComment: (id: string, body: string) => Promise<ProposalView>;
  markAllActivitiesRead: () => Promise<void>;
  createFork: (input: Omit<CreateForkInput, 'authorAddress' | 'bairroId'>) => Promise<ForkExperiment>;
}

const AppContext = createContext<AppContextValue | null>(null);

function getStoredAddress() {
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

function setStoredAddress(address: string | null) {
  if (!address) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, address);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const hydrate = async (address?: string | null) => {
    setIsLoading(true);
    setActionError(null);

    try {
      const payload = await api.getBootstrap(address ?? getStoredAddress());
      startTransition(() => {
        setData(payload);
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao carregar o sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void hydrate(getStoredAddress());
  }, []);

  const refresh = async () => {
    await hydrate(data?.session.address ?? getStoredAddress());
  };

  const connectWithSession = async (address?: string | null, demo = false) => {
    setActionError(null);
    const session = await api.connectSession({ address, demo });
    setStoredAddress(session.address);
    await hydrate(session.address);
    return session;
  };

  const connectWallet = async () => {
    if (window.ethereum?.request) {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const address = Array.isArray(accounts) ? accounts[0] : null;
      if (!address) {
        throw new Error('Nenhuma carteira foi autorizada.');
      }

      return connectWithSession(address);
    }

    return connectWithSession(null, true);
  };

  const connectDemoWallet = async () => connectWithSession(null, true);

  const disconnect = async () => {
    setStoredAddress(null);
    await hydrate(null);
  };

  const issueCitizenship = async (input: Omit<CitizenshipIssueInput, 'address'>) => {
    const address = data?.session.address;
    if (!address) {
      throw new Error('Conecte uma carteira antes de solicitar cidadania.');
    }

    setActionError(null);
    await api.issueCitizenship({ address, ...input });
    await hydrate(address);
  };

  const createProposal = async (input: Omit<CreateProposalInput, 'authorAddress'>) => {
    const address = data?.session.address;
    if (!address) {
      throw new Error('Conecte uma carteira antes de publicar uma proposta.');
    }

    setActionError(null);
    const response = await api.createProposal({ authorAddress: address, ...input });
    await hydrate(address);
    return response.proposal;
  };

  const voteProposal = async (id: string, choice: VoteChoice) => {
    const address = data?.session.address;
    if (!address) {
      throw new Error('Conecte uma carteira antes de votar.');
    }

    setActionError(null);
    const response = await api.voteProposal(id, { address, choice });
    await hydrate(address);
    return response.proposal;
  };

  const addComment = async (id: string, body: string) => {
    const address = data?.session.address;
    if (!address) {
      throw new Error('Conecte uma carteira antes de comentar.');
    }

    setActionError(null);
    const response = await api.addComment(id, { authorAddress: address, body });
    await hydrate(address);
    return response.proposal;
  };

  const markAllActivitiesRead = async () => {
    const address = data?.session.address;
    if (!address) {
      return;
    }

    setActionError(null);
    await api.markAllActivitiesRead(address);
    await hydrate(address);
  };

  const createFork = async (input: Omit<CreateForkInput, 'authorAddress' | 'bairroId'>) => {
    const address = data?.session.address;
    const citizen = data?.session.citizen;
    if (!address || !citizen) {
      throw new Error('A emissao da cidadania e obrigatoria para criar uma variacao local.');
    }

    setActionError(null);
    const response = await api.createFork({
      authorAddress: address,
      bairroId: citizen.bairroId,
      ...input,
    });
    await hydrate(address);
    return response.fork;
  };

  const value: AppContextValue = {
    data,
    currentAddress: data?.session.address ?? null,
    currentCitizen: data?.session.citizen ?? null,
    currentRequest: data?.session.pendingRequest ?? null,
    profile: data?.profile ?? null,
    laws: data?.laws ?? [],
    proposals: data?.proposals ?? [],
    neighborhoods: data?.neighborhoods ?? [],
    forks: data?.forks ?? [],
    activities: data?.activities ?? [],
    commits: data?.commits ?? [],
    feed: data?.feed ?? null,
    isLoading,
    actionError,
    connectWallet,
    connectDemoWallet,
    disconnect,
    refresh,
    issueCitizenship,
    createProposal,
    voteProposal,
    addComment,
    markAllActivitiesRead,
    createFork,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp precisa ser usado dentro de AppProvider.');
  }

  return context;
}

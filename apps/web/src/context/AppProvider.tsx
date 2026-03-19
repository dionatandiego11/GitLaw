import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import {
  clearStoredSession,
  getStoredSessionAddress,
  getStoredSessionToken,
  setStoredSessionAddress,
  setStoredSessionToken,
} from '@/lib/session';
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
  SessionAuthMethod,
  VoteChoice,
} from '@/shared/domain';

interface AppContextValue {
  data: BootstrapPayload | null;
  currentAddress: string | null;
  currentCitizen: BootstrapPayload['session']['citizen'];
  currentRequest: BootstrapPayload['session']['pendingRequest'];
  sessionAuthenticated: boolean;
  sessionAuthMethod: SessionAuthMethod | null;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const hydrate = async (address?: string | null) => {
    const storedAddress = address ?? getStoredSessionAddress();
    const storedToken = getStoredSessionToken();

    setIsLoading(true);
    setActionError(null);

    try {
      const payload = await api.getBootstrap(storedAddress, storedToken);
      if (!payload.session.authenticated && storedToken) {
        setStoredSessionToken(null);
      }
      startTransition(() => {
        setData(payload);
      });
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;

      if (storedToken && statusCode === 401) {
        clearStoredSession();
        try {
          const fallbackPayload = await api.getBootstrap();
          startTransition(() => {
            setData(fallbackPayload);
          });
        } catch {
          startTransition(() => {
            setData(null);
          });
        }
        setActionError('Sua sessao expirou. Conecte a carteira novamente.');
        return;
      }

      setActionError(error instanceof Error ? error.message : 'Falha ao carregar o sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void hydrate(getStoredSessionAddress());
  }, []);

  const refresh = async () => {
    await hydrate(data?.session.address ?? getStoredSessionAddress());
  };

  const persistSession = async (session: ConnectSessionResponse) => {
    setStoredSessionAddress(session.address);
    setStoredSessionToken(session.sessionToken);
    await hydrate(session.address);
    return session;
  };

  const connectWallet = async () => {
    setActionError(null);

    if (!window.ethereum?.request) {
      throw new Error('MetaMask nao encontrada. Use o modo demonstracao ou instale uma carteira compativel.');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    const address = Array.isArray(accounts) ? String(accounts[0] ?? '') : '';

    if (!address) {
      throw new Error('Nenhuma carteira foi autorizada.');
    }

    const challenge = await api.requestWalletChallenge({ address });
    let signature: string;

    try {
      signature = String(
        await window.ethereum.request({
          method: 'personal_sign',
          params: [challenge.message, address],
        }),
      );
    } catch (error) {
      signature = String(
        await window.ethereum.request({
          method: 'personal_sign',
          params: [address, challenge.message],
        }),
      );
    }

    const session = await api.verifyWalletSession({ address, signature });
    return persistSession(session);
  };

  const connectDemoWallet = async () => {
    setActionError(null);
    const session = await api.connectDemoSession();
    return persistSession(session);
  };

  const disconnect = async () => {
    clearStoredSession();
    await hydrate(null);
  };

  const issueCitizenship = async (input: Omit<CitizenshipIssueInput, 'address'>) => {
    const address = data?.session.address;
    const sessionToken = getStoredSessionToken();
    if (!address || !sessionToken) {
      throw new Error('Assine sua sessao antes de solicitar cidadania.');
    }

    setActionError(null);
    await api.issueCitizenship({ address, ...input }, sessionToken);
    await hydrate(address);
  };

  const createProposal = async (input: Omit<CreateProposalInput, 'authorAddress'>) => {
    const address = data?.session.address;
    const sessionToken = getStoredSessionToken();
    if (!address || !sessionToken) {
      throw new Error('Assine sua sessao antes de publicar uma proposta.');
    }

    setActionError(null);
    const response = await api.createProposal({ authorAddress: address, ...input }, sessionToken);
    await hydrate(address);
    return response.proposal;
  };

  const voteProposal = async (id: string, choice: VoteChoice) => {
    const address = data?.session.address;
    const sessionToken = getStoredSessionToken();
    if (!address || !sessionToken) {
      throw new Error('Assine sua sessao antes de votar.');
    }

    setActionError(null);
    const response = await api.voteProposal(id, { address, choice }, sessionToken);
    await hydrate(address);
    return response.proposal;
  };

  const addComment = async (id: string, body: string) => {
    const address = data?.session.address;
    const sessionToken = getStoredSessionToken();
    if (!address || !sessionToken) {
      throw new Error('Assine sua sessao antes de comentar.');
    }

    setActionError(null);
    const response = await api.addComment(id, { authorAddress: address, body }, sessionToken);
    await hydrate(address);
    return response.proposal;
  };

  const markAllActivitiesRead = async () => {
    const address = data?.session.address;
    const sessionToken = getStoredSessionToken();
    if (!address || !sessionToken) {
      return;
    }

    setActionError(null);
    await api.markAllActivitiesRead(address, sessionToken);
    await hydrate(address);
  };

  const createFork = async (input: Omit<CreateForkInput, 'authorAddress' | 'bairroId'>) => {
    const address = data?.session.address;
    const citizen = data?.session.citizen;
    const sessionToken = getStoredSessionToken();
    if (!address || !citizen || !sessionToken) {
      throw new Error('A emissao da cidadania e obrigatoria para criar uma variacao local.');
    }

    setActionError(null);
    const response = await api.createFork({
      authorAddress: address,
      bairroId: citizen.bairroId,
      sourceProposalId: input.sourceProposalId,
    }, sessionToken);
    await hydrate(address);
    return response.fork;
  };

  const value: AppContextValue = {
    data,
    currentAddress: data?.session.address ?? null,
    currentCitizen: data?.session.citizen ?? null,
    currentRequest: data?.session.pendingRequest ?? null,
    sessionAuthenticated: data?.session.authenticated ?? false,
    sessionAuthMethod: data?.session.authMethod ?? null,
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

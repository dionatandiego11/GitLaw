import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GitBranch,
  GitFork,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Vote,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRCard } from '@/components/PRCard';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppProvider';
import { cn } from '@/lib/utils';
import type { Commit, ForkExperiment, Law, ProposalView } from '@/shared/domain';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'outline' | 'purple';
type StepStatus = 'done' | 'current' | 'upcoming';

interface HomeStep {
  key?: string | number;
  step: string;
  title: string;
  description: string;
  status: StepStatus;
  href: string;
  actionLabel?: string;
}

interface QuickAction {
  key?: string | number;
  title: string;
  value: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'purple';
}

interface HomeUpdate {
  id: string;
  title: string;
  description: string;
  href: string;
  typeLabel: string;
  typeVariant: BadgeVariant;
  date: string;
  icon: LucideIcon;
}

function pickByIds<T extends { id: string }>(items: T[], ids: string[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return ids
    .map((id) => itemMap.get(id))
    .filter((item): item is T => Boolean(item));
}

function formatRelativeDate(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: ptBR });
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4 text-sm leading-relaxed text-[var(--color-git-muted)]">
      {children}
    </div>
  );
}

function SectionHeading({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-git-text)]">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link to={actionHref} className="shrink-0 text-xs font-medium text-[var(--color-git-blue)]">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function HomeStepCard({ step, title, description, status, href, actionLabel }: HomeStep) {
  const styles = {
    done: {
      wrapper: 'border-[rgba(63,185,80,0.28)] bg-[rgba(63,185,80,0.08)]',
      bullet: 'border-[rgba(63,185,80,0.32)] bg-[rgba(63,185,80,0.16)] text-[var(--color-git-green)]',
      label: 'Concluido',
      labelClass: 'text-[var(--color-git-green)]',
    },
    current: {
      wrapper: 'border-[rgba(88,166,255,0.28)] bg-[rgba(88,166,255,0.07)]',
      bullet: 'border-[rgba(88,166,255,0.34)] bg-[rgba(88,166,255,0.16)] text-[var(--color-git-blue)]',
      label: 'Agora',
      labelClass: 'text-[var(--color-git-blue)]',
    },
    upcoming: {
      wrapper: 'border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)]',
      bullet: 'border-[var(--color-git-border2)] bg-[var(--color-git-bg3)] text-[var(--color-git-muted)]',
      label: 'Depois',
      labelClass: 'text-[var(--color-git-muted)]',
    },
  } satisfies Record<
    StepStatus,
    { wrapper: string; bullet: string; label: string; labelClass: string }
  >;

  const config = styles[status];

  return (
    <div className={cn('rounded-[24px] border p-4', config.wrapper)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold',
            config.bullet,
          )}
        >
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-git-text)]">{title}</h3>
            <span className={cn('text-[11px] font-medium', config.labelClass)}>{config.label}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{description}</p>
          {actionLabel ? (
            <Link
              to={href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-git-blue)]"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, value, description, href, actionLabel, icon: Icon, tone }: QuickAction) {
  const toneClasses = {
    blue: 'border-[rgba(88,166,255,0.24)] bg-[rgba(88,166,255,0.06)]',
    green: 'border-[rgba(63,185,80,0.24)] bg-[rgba(63,185,80,0.06)]',
    purple: 'border-[rgba(188,140,255,0.24)] bg-[rgba(188,140,255,0.06)]',
  } satisfies Record<QuickAction['tone'], string>;

  const iconClasses = {
    blue: 'border-[rgba(88,166,255,0.3)] bg-[rgba(88,166,255,0.16)] text-[var(--color-git-blue)]',
    green: 'border-[rgba(63,185,80,0.3)] bg-[rgba(63,185,80,0.16)] text-[var(--color-git-green)]',
    purple: 'border-[rgba(188,140,255,0.3)] bg-[rgba(188,140,255,0.16)] text-[var(--color-git-purple)]',
  } satisfies Record<QuickAction['tone'], string>;

  return (
    <Link
      to={href}
      className={cn(
        'block rounded-[24px] border p-4 transition-colors hover:border-[rgba(255,255,255,0.2)]',
        toneClasses[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl border', iconClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-[var(--color-git-muted)]" />
      </div>

      <div className="mt-4 text-sm font-medium text-[var(--color-git-muted)]">{title}</div>
      <div className="mt-1 text-xl font-semibold leading-tight text-[var(--color-git-text)]">{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)]">{description}</p>

      <div className="mt-4 text-xs font-medium text-[var(--color-git-blue)]">{actionLabel}</div>
    </Link>
  );
}

function RecentUpdates({ items }: { items: HomeUpdate[] }) {
  if (items.length === 0) {
    return <EmptyState>Nenhuma atualizacao recente para resumir agora.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            to={item.href}
            className="flex items-start gap-3 rounded-[22px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:border-[rgba(88,166,255,0.32)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)] text-[var(--color-git-muted)]">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={item.typeVariant}>{item.typeLabel}</Badge>
                <span className="text-[11px] text-[var(--color-git-muted)]">{formatRelativeDate(item.date)}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold leading-tight text-[var(--color-git-text)]">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function Feed() {
  const {
    actionError,
    currentAddress,
    currentCitizen,
    currentRequest,
    feed,
    forks,
    isLoading,
    laws,
    commits,
    proposals,
  } = useApp();

  const urgentProposals: ProposalView[] = pickByIds(proposals, feed?.urgentProposalIds ?? []);
  const recentProposals: ProposalView[] = pickByIds(proposals, feed?.recentProposalIds ?? []);
  const recentLaws: Law[] = pickByIds(laws, feed?.recentLawIds ?? []);
  const activeForks: ForkExperiment[] = pickByIds(forks, feed?.activeForkIds ?? []);
  const recentCommits: Commit[] = pickByIds(commits, feed?.recentCommitIds ?? []);
  const openProposalCount = proposals.filter((proposal) => proposal.status === 'aberto').length;

  const heroBadge = currentCitizen
    ? 'participacao liberada'
    : currentRequest
      ? 'validacao em andamento'
      : currentAddress
        ? 'falta um passo'
        : 'entrada simplificada';

  const heroTitle = currentCitizen
    ? `Seu painel de participacao em ${currentCitizen.bairroNome}`
    : 'Entenda o que fazer sem se perder';

  const heroDescription = currentCitizen
    ? 'Comece pelo que pede atencao agora, acompanhe as mudancas mais recentes e abra o restante so quando precisar.'
    : 'Primeiro voce entra. Depois valida sua residencia. A partir disso, consegue votar, acompanhar leis e participar do seu bairro com menos friccao.';

  const nextStep = currentCitizen
    ? {
        title: openProposalCount > 0 ? 'Voce ja pode votar nas propostas abertas' : 'Seu acesso ja esta pronto para participar',
        description:
          openProposalCount > 0
            ? 'A home agora te leva direto para as decisoes que realmente precisam do seu olhar.'
            : 'Se nao houver votacoes abertas, use o painel para acompanhar leis e o contexto do seu bairro.',
        href: openProposalCount > 0 ? '/propostas' : '/meu-bairro',
        actionLabel: openProposalCount > 0 ? 'Ver votacoes' : 'Abrir meu bairro',
      }
    : currentRequest
      ? {
          title: 'Seu pedido de cidadania ja foi enviado',
          description:
            'Enquanto a validacao nao termina, voce ainda pode acompanhar propostas e leis com um resumo mais direto.',
          href: '/perfil',
          actionLabel: 'Acompanhar pedido',
        }
      : currentAddress
        ? {
            title: 'Falta validar sua residencia',
            description: 'Esse e o passo que libera voto, comentario com peso local e criacao de propostas.',
            href: '/cidadania/solicitar',
            actionLabel: 'Validar agora',
          }
        : {
            title: 'Entre no alpha local em poucos segundos',
            description: 'Use carteira ou modo demonstracao para explorar o bairro e entender o fluxo sem ruido.',
            href: '/connect',
            actionLabel: 'Entrar',
          };

  const steps: HomeStep[] = [
    {
      step: '1',
      title: 'Entrar',
      description: currentAddress
        ? 'Sua sessao ja esta conectada e pronta para continuar.'
        : 'Conecte sua carteira ou use o modo local para entrar no piloto.',
      status: currentAddress ? 'done' : 'current',
      href: '/connect',
      actionLabel: currentAddress ? 'Gerenciar acesso' : 'Entrar agora',
    },
    {
      step: '2',
      title: 'Validar residencia',
      description: currentCitizen
        ? `Residencia validada em ${currentCitizen.bairroNome}.`
        : currentRequest
          ? 'Seu pedido foi enviado e esta aguardando validacao.'
          : 'Confirme seu bairro para liberar voto e participacao local.',
      status: currentCitizen ? 'done' : currentAddress ? 'current' : 'upcoming',
      href: currentCitizen || currentRequest ? '/perfil' : '/cidadania/solicitar',
      actionLabel: currentCitizen ? 'Ver perfil' : currentRequest ? 'Ver andamento' : 'Validar',
    },
    {
      step: '3',
      title: 'Participar',
      description: currentCitizen
        ? 'Vote, acompanhe leis e abra propostas sem precisar navegar por tudo de uma vez.'
        : 'Depois da validacao, voce pode votar, comentar e abrir propostas do seu bairro.',
      status: currentCitizen ? 'current' : 'upcoming',
      href: currentCitizen ? '/propostas' : currentAddress ? '/cidadania/solicitar' : '/connect',
      actionLabel: currentCitizen ? 'Abrir propostas' : undefined,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Propostas',
      value:
        openProposalCount > 0
          ? `${openProposalCount} aberta${openProposalCount > 1 ? 's' : ''}`
          : 'Sem fila urgente',
      description:
        openProposalCount > 0
          ? 'Veja primeiro o que esta aguardando voto ou revisao agora.'
          : 'Nao ha votacao aberta neste momento, mas o historico continua disponivel.',
      href: '/propostas',
      actionLabel: 'Abrir propostas',
      icon: Vote,
      tone: 'blue',
    },
    {
      title: 'Leis',
      value: recentLaws.length > 0 ? `${recentLaws.length} atualizada${recentLaws.length > 1 ? 's' : ''}` : 'Repositorio estavel',
      description:
        recentLaws.length > 0
          ? 'Resumo do que mudou nas leis e regras publicadas recentemente.'
          : 'Nenhuma alteracao recente apareceu na curadoria da home.',
      href: '/leis',
      actionLabel: 'Ver leis',
      icon: BookOpen,
      tone: 'green',
    },
    {
      title: currentCitizen ? 'Meu bairro' : 'Contexto local',
      value:
        activeForks.length > 0
          ? `${activeForks.length} piloto${activeForks.length > 1 ? 's' : ''}`
          : currentCitizen
            ? 'Tudo tranquilo'
            : 'Liberado apos validacao',
      description:
        currentCitizen
          ? activeForks.length > 0
            ? 'Experimentos e decisoes locais que ja estao rodando no territorio.'
            : 'Quando surgir um piloto local, ele vai aparecer resumido aqui.'
          : 'Complete os passos iniciais para receber um resumo do seu territorio.',
      href: currentCitizen ? '/meu-bairro' : currentAddress ? '/cidadania/solicitar' : '/connect',
      actionLabel: currentCitizen ? 'Abrir meu bairro' : currentAddress ? 'Liberar acesso' : 'Comecar',
      icon: MapPinned,
      tone: 'purple',
    },
  ];

  const recentUpdates: HomeUpdate[] = [
    ...recentProposals.slice(0, 2).map((proposal) => ({
      id: `proposal-${proposal.id}`,
      title: proposal.titulo,
      description: proposal.urgencia
        ? `Prioridade alta em ${proposal.bairroNome}. Fecha ${formatRelativeDate(proposal.votingEndsAt)}.`
        : `Mudanca proposta em ${proposal.leiAlvoNome}.`,
      href: `/propostas/${proposal.id}`,
      typeLabel: 'Proposta',
      typeVariant: (proposal.urgencia ? 'danger' : 'info') as BadgeVariant,
      date: proposal.criadoEm,
      icon: Vote,
    })),
    ...recentLaws.slice(0, 2).map((law) => ({
      id: `law-${law.id}`,
      title: law.titulo,
      description: law.resumo,
      href: `/leis/${law.id}`,
      typeLabel: law.isFork ? 'Lei local' : 'Lei',
      typeVariant: (law.isFork ? 'purple' : 'outline') as BadgeVariant,
      date: law.atualizadaEm,
      icon: law.isFork ? GitFork : FileText,
    })),
    ...recentCommits.slice(0, 1).map((commit) => ({
      id: `commit-${commit.id}`,
      title: commit.mensagem,
      description: commit.resumo,
      href: commit.prId ? `/propostas/${commit.prId}` : `/leis/${commit.leiId}`,
      typeLabel: 'Atualizacao',
      typeVariant: 'success' as BadgeVariant,
      date: commit.timestamp,
      icon: GitBranch,
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="p-4">
        <EmptyState>Carregando um resumo mais simples do panorama local...</EmptyState>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-4">
      <section className="overflow-hidden rounded-[32px] border border-[var(--color-git-border)] bg-[linear-gradient(180deg,rgba(88,166,255,0.12),rgba(13,17,23,0.98)_28%,rgba(13,17,23,1)_100%)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[22rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(230,237,243,0.68)]">
              Inicio
            </span>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--color-git-text)]">
              {heroTitle}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(230,237,243,0.72)]">{heroDescription}</p>
          </div>
          <Badge variant={currentCitizen ? 'success' : currentAddress ? 'warning' : 'info'}>{heroBadge}</Badge>
        </div>

        <div className="mt-5 rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(88,166,255,0.3)] bg-[rgba(88,166,255,0.14)] text-[var(--color-git-blue)]">
              {currentCitizen ? <Sparkles className="h-5 w-5" /> : currentAddress ? <ShieldCheck className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(230,237,243,0.58)]">
                Seu proximo passo
              </p>
              <h2 className="mt-1 text-lg font-semibold leading-tight text-[var(--color-git-text)]">{nextStep.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[rgba(230,237,243,0.72)]">{nextStep.description}</p>
              <Link
                to={nextStep.href}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-git-text)] px-4 py-2 text-sm font-medium text-[var(--color-git-bg)]"
              >
                {nextStep.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {currentCitizen ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[rgba(63,185,80,0.22)] bg-[rgba(63,185,80,0.08)] px-3 py-2 text-xs text-[var(--color-git-text)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-git-green)]" />
            <span>Seu voto tem peso local ativo em {currentCitizen.bairroNome}.</span>
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 rounded-2xl border border-[rgba(248,81,73,0.32)] bg-[rgba(248,81,73,0.08)] px-3 py-2 text-xs text-[var(--color-git-text)]">
            {actionError}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Como funciona"
          description="A jornada principal foi resumida em tres passos para ficar claro o que fazer primeiro."
        />
        <div className="space-y-3">
          {steps.map((step) => (
            <HomeStepCard
              key={step.step}
              step={step.step}
              title={step.title}
              description={step.description}
              status={step.status}
              href={step.href}
              actionLabel={step.actionLabel}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Atalhos rapidos"
          description="Tres portas de entrada para o que mais importa sem precisar varrer a aplicacao inteira."
        />
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              value={action.value}
              description={action.description}
              href={action.href}
              actionLabel={action.actionLabel}
              icon={action.icon}
              tone={action.tone}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="O que merece atencao agora"
          description={
            currentCitizen
              ? 'Se voce for fazer so uma coisa hoje, comece por estas propostas.'
              : 'Esses itens resumem o que esta acontecendo agora no piloto.'
          }
          actionHref="/propostas"
          actionLabel="ver todas"
        />
        {urgentProposals.length > 0 ? (
          <div className="space-y-3">
            {urgentProposals.slice(0, 2).map((proposal) => (
              <PRCard key={proposal.id} pr={proposal} />
            ))}
          </div>
        ) : recentProposals.length > 0 ? (
          <div className="space-y-3">
            {recentProposals.slice(0, 1).map((proposal) => (
              <PRCard key={proposal.id} pr={proposal} />
            ))}
          </div>
        ) : (
          <EmptyState>Nenhuma proposta recente apareceu na curadoria inicial.</EmptyState>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Mudou por aqui"
          description="Atualizacoes recentes em formato curto para voce entender o panorama sem excesso de contexto."
          actionHref="/atividade"
          actionLabel="abrir atividade"
        />
        <RecentUpdates items={recentUpdates} />
      </section>

      {!currentCitizen ? (
        <section className="rounded-[28px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)] text-[var(--color-git-muted)]">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[var(--color-git-text)]">Quer liberar o modo completo?</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">
                Entrar e validar a residencia desbloqueia voto com peso local, comentarios vinculados ao bairro e criacao de novas propostas.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={currentAddress ? '/cidadania/solicitar' : '/connect'}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(88,166,255,0.28)] bg-[rgba(88,166,255,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-git-blue)]"
                >
                  {currentAddress ? 'Validar cidadania' : 'Entrar no alpha'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/leis"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] px-4 py-2 text-sm font-medium text-[var(--color-git-text)]"
                >
                  Explorar leis primeiro
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </motion.div>
  );
}

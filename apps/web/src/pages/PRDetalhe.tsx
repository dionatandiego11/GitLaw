import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  GitFork,
  GitPullRequest,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CIStatus } from '@/components/ui/CIStatus';
import { VoteBar } from '@/components/ui/VoteBar';
import { DiffViewer } from '@/components/ui/DiffViewer';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '@/context/AppProvider';

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function PRDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proposals, forks, currentCitizen, voteProposal, addComment, createFork } = useApp();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isActivatingVariation, setIsActivatingVariation] = useState(false);
  const pr = proposals.find((proposal) => proposal.id === id);

  if (!pr) {
    return <div className="p-4 text-center text-[var(--color-git-muted)]">Proposta não encontrada.</div>;
  }

  const statusConfig = {
    'aberto': { variant: 'info' as const, label: 'Aberto' },
    'em-revisao': { variant: 'warning' as const, label: 'Em Revisão' },
    'aprovado': { variant: 'success' as const, label: 'Aprovado' },
    'rejeitado': { variant: 'danger' as const, label: 'Rejeitado' },
  };
  const resolutionText = {
    aprovado_por_quorum: 'A proposta atingiu quórum e maioria favorável, então gerou um registro legislativo.',
    quorum_insuficiente: 'O prazo encerrou antes de o quorum mínimo ser alcançado.',
    maioria_contra: 'O quorum foi atingido, mas o peso de votos contrários venceu.',
    empate: 'A votação encerrou em empate e não gerou alteração legislativa.',
    bloqueio_ci: 'A proposta ficou em revisão até o prazo final e nunca liberou a etapa de voto.',
  };

  const config = statusConfig[pr.status];
  const isVariationProposal = pr.kind === 'variacao_local';
  const newVersionHref = pr.artigoAlvoId
    ? `/propostas/nova?lawId=${pr.leiAlvoId}&articleId=${pr.artigoAlvoId}&proposalId=${pr.id}`
    : null;
  const isAuthor = Boolean(
    currentCitizen && currentCitizen.address.toLowerCase() === pr.autor.toLowerCase(),
  );
  const activatedFork = forks.find((fork) => fork.sourceProposalId === pr.id);
  const canActivateVariation = Boolean(
    currentCitizen &&
      isVariationProposal &&
      pr.status === 'aprovado' &&
      pr.impactedNeighborhoodIds.includes(currentCitizen.bairroId) &&
      !activatedFork,
  );
  const governanceSummary =
    pr.status === 'aberto'
      ? `Votação aberta até ${formatDistanceToNow(new Date(pr.votingEndsAt), { addSuffix: true, locale: ptBR })}.`
      : pr.status === 'em-revisao'
        ? 'A validação técnica bloqueou a etapa de votação até que o texto seja ajustado.'
        : isVariationProposal && pr.status === 'aprovado'
          ? activatedFork
            ? 'A autorização territorial foi aprovada e a variação local já está ativa.'
            : 'A autorização territorial foi aprovada. O bairro autorizado já pode ativar a variação local.'
          : resolutionText[pr.resolutionReason ?? 'quorum_insuficiente'];
  const timelineLabel = pr.closedAt
    ? `Encerrada ${formatDistanceToNow(new Date(pr.closedAt), { addSuffix: true, locale: ptBR })}`
    : pr.deadlineReached
      ? 'Prazo encerrado'
      : `Fecha ${formatDistanceToNow(new Date(pr.votingEndsAt), { addSuffix: true, locale: ptBR })}`;

  const handleVote = async (choice: 'favor' | 'contra' | 'abster') => {
    if (!currentCitizen) {
      navigate('/connect');
      return;
    }

    try {
      setError(null);
      await voteProposal(pr.id, choice);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível registrar o voto.');
    }
  };

  const handleComment = async () => {
    if (!currentCitizen) {
      navigate('/connect');
      return;
    }

    try {
      setError(null);
      await addComment(pr.id, comment);
      setComment('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível publicar o comentário.');
    }
  };

  const handleActivateVariation = async () => {
    if (!canActivateVariation) {
      return;
    }

    try {
      setIsActivatingVariation(true);
      setError(null);
      const fork = await createFork({ sourceProposalId: pr.id });
      navigate(`/bairros/${fork.bairroId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível ativar a variação.');
    } finally {
      setIsActivatingVariation(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-full bg-[var(--color-git-bg)] pb-28"
    >
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-git-border)] bg-[var(--color-git-bg)]/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-[var(--color-git-muted)] transition-colors hover:text-[var(--color-git-text)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--color-git-blue)]" />
            <span className="text-xs font-mono text-[var(--color-git-muted)]">{pr.id}</span>
          </div>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      <div className="space-y-6 p-4">
        <div>
          <h1 className="mb-3 text-xl font-semibold leading-tight text-[var(--color-git-text)]">{pr.titulo}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-git-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(88,166,255,0.1)] text-[10px] font-bold text-[var(--color-git-blue)]">
                {pr.autor.charAt(0)}
              </div>
              <span className="font-medium text-[var(--color-git-text)]">{pr.autor}</span>
            </div>
            <span>•</span>
            <span className="font-mono">
              {formatDistanceToNow(new Date(pr.criadoEm), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-git-text)]">Estado da Governança</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{governanceSummary}</p>
            </div>
            {pr.status === 'aprovado' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-git-green)]" />
            ) : (
              <Clock3 className="mt-0.5 h-5 w-5 text-[var(--color-git-blue)]" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Prazo</div>
              <div className="mt-1 text-sm font-medium text-[var(--color-git-text)]">{timelineLabel}</div>
            </div>
            <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Quórum</div>
              <div className="mt-1 text-sm font-medium text-[var(--color-git-text)]">
                {pr.quorumRemaining > 0 ? `${formatScore(pr.quorumRemaining)} faltando` : 'atingido'}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Seu peso</div>
              <div className="mt-1 text-sm font-medium text-[var(--color-git-text)]">
                {formatScore(pr.currentUserWeight)}x
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-git-text)]">Ações desta proposta</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">
                {isAuthor
                  ? 'Como autor, voce acompanha comentarios e pode abrir nova versao, mas nao participa da votacao desta proposta.'
                  : isVariationProposal
                  ? 'Vote na autorização territorial e, depois da aprovação, ative a variação local no bairro autorizado.'
                  : 'Vote agora, proponha uma nova versão do texto ou abra uma autorização territorial para o seu bairro.'}
              </p>
            </div>
            <Badge variant={pr.canVote ? 'success' : 'outline'}>
              {pr.canVote ? 'votação liberada' : isVariationProposal && activatedFork ? 'variação ativa' : 'ações limitadas'}
            </Badge>
          </div>

          {!pr.canVote ? (
            <div className="mt-3 rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg)] px-3 py-2 text-[11px] text-[var(--color-git-muted)]">
              {pr.canVoteReason}
            </div>
          ) : null}

          {isAuthor ? (
            <div className="mt-4 rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg)] px-3 py-3 text-sm text-[var(--color-git-muted)]">
              Seu papel aqui e acompanhar a discussao, responder comentarios e publicar uma nova versao, se necessario.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={() => void handleVote('contra')}
                disabled={!pr.canVote}
                className="rounded-xl border border-[var(--color-git-red)] bg-[var(--color-git-bg)] py-3 text-sm font-medium text-[var(--color-git-red)] transition-colors hover:bg-[var(--color-git-bg3)] disabled:opacity-50"
              >
                Reprovar
              </button>
              <button
                onClick={() => void handleVote('abster')}
                disabled={!pr.canVote}
                className="rounded-xl border border-[var(--color-git-border2)] bg-[var(--color-git-bg3)] py-3 text-sm font-medium text-[var(--color-git-text)] transition-colors hover:bg-[var(--color-git-border2)] disabled:opacity-50"
              >
                Abster-se
              </button>
              <button
                onClick={() => void handleVote('favor')}
                disabled={!pr.canVote}
                className="rounded-xl border border-[rgba(63,185,80,0.5)] bg-[var(--color-git-green)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Aprovar
              </button>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-3">
            {newVersionHref ? (
              <Link
                to={newVersionHref}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--color-git-text)] transition-colors hover:bg-[var(--color-git-bg3)]"
              >
                <GitPullRequest className="h-4 w-4" />
                Criar nova versão
              </Link>
            ) : null}

            {!isVariationProposal && currentCitizen ? (
              <Link
                to={`/leis/${pr.leiAlvoId}/fork`}
                className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(188,140,255,0.38)] bg-[rgba(188,140,255,0.08)] px-4 py-3 text-sm font-medium text-[var(--color-git-text)] transition-colors hover:bg-[rgba(188,140,255,0.14)]"
              >
                <GitFork className="h-4 w-4 text-[var(--color-git-purple)]" />
                Propor variação local
              </Link>
            ) : null}

            {isVariationProposal ? (
              <button
                onClick={() => void handleActivateVariation()}
                disabled={!canActivateVariation || isActivatingVariation}
                className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(188,140,255,0.38)] bg-[rgba(188,140,255,0.08)] px-4 py-3 text-sm font-medium text-[var(--color-git-text)] transition-colors hover:bg-[rgba(188,140,255,0.14)] disabled:opacity-50"
              >
                <GitFork className="h-4 w-4 text-[var(--color-git-purple)]" />
                {activatedFork
                  ? 'Variação já ativada'
                  : isActivatingVariation
                    ? 'Ativando variação...'
                    : 'Ativar variação local'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-[var(--color-git-muted)]">Lei Alvo</span>
            <span className="text-sm font-medium text-[var(--color-git-text)]">{pr.leiAlvoNome}</span>
          </div>
          <Link to={`/leis/${pr.leiAlvoId}`} className="text-xs font-medium text-[var(--color-git-blue)] hover:underline">
            Ver Lei
          </Link>
        </div>

        {isVariationProposal ? (
          <div>
            <h3 className="mb-3 text-sm font-mono font-medium uppercase tracking-wider text-[var(--color-git-muted)]">
              Termos da variação
            </h3>
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Nome previsto</div>
                <div className="mt-1 text-sm font-medium text-[var(--color-git-text)]">{pr.variationDraft?.nome ?? 'Variação territorial'}</div>
              </div>
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Objetivo</div>
                <div className="mt-1 text-sm leading-relaxed text-[var(--color-git-text)]">{pr.variationDraft?.objetivo ?? pr.justificativa}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Bairro autorizado</div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-git-text)]">{pr.variationDraft?.bairroNome ?? pr.bairroNome}</div>
                </div>
                <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)]/65 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-git-muted)]">Duração prevista</div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-git-text)]">{pr.variationDraft?.duracaoMeses ?? 0} meses</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="mb-3 text-sm font-mono font-medium uppercase tracking-wider text-[var(--color-git-muted)]">
                Validação técnica
              </h3>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-3">
                <div className="flex items-center justify-between border-b border-[var(--color-git-border2)] py-1 last:border-0">
                  <span className="text-xs text-[var(--color-git-text)]">Conflito com outras leis</span>
                  <CIStatus status={pr.ci.conflito} label={pr.ci.conflito ? 'Passou' : 'Falhou'} />
                </div>
                <div className="flex items-center justify-between border-b border-[var(--color-git-border2)] py-1 last:border-0">
                  <span className="text-xs text-[var(--color-git-text)]">Impacto orçamentário</span>
                  <CIStatus status={pr.ci.orcamento} label={pr.ci.orcamento ? 'Passou' : 'Falhou'} />
                </div>
                <div className="flex items-center justify-between border-b border-[var(--color-git-border2)] py-1 last:border-0">
                  <span className="text-xs text-[var(--color-git-text)]">Constitucionalidade</span>
                  <CIStatus status={pr.ci.constitucional} label={pr.ci.constitucional ? 'Passou' : 'Falhou'} />
                </div>
                <div className="flex items-center justify-between border-b border-[var(--color-git-border2)] py-1 last:border-0">
                  <span className="text-xs text-[var(--color-git-text)]">Redação técnica</span>
                  <CIStatus
                    status={pr.ci.redacao}
                    label={pr.ci.redacao === null ? 'Em análise' : pr.ci.redacao ? 'Passou' : 'Falhou'}
                  />
                </div>
              </div>

              {pr.status === 'em-revisao' ? (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-[rgba(210,153,34,0.32)] bg-[rgba(210,153,34,0.08)] p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-git-amber)]" />
                  <p className="text-sm leading-relaxed text-[var(--color-git-text)]">
                    Esta proposta foi publicada, mas a votação fica travada enquanto houver bloqueio na validação técnica.
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-mono font-medium uppercase tracking-wider text-[var(--color-git-muted)]">
                Comparação do texto
              </h3>
              <DiffViewer before={pr.oldText ?? ''} after={pr.newText ?? ''} title={pr.artigoAlvoRotulo ?? 'Texto normativo'} />
            </div>
          </>
        )}

        <div>
          <h3 className="mb-3 text-sm font-mono font-medium uppercase tracking-wider text-[var(--color-git-muted)]">
            Votação Atual
          </h3>
          <div className="rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
            <VoteBar
              favor={pr.tally.favor}
              contra={pr.tally.contra}
              abster={pr.tally.abster}
              quorum={pr.tally.quorum}
            />

            <div className="mt-4 border-t border-[var(--color-git-border2)] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-git-text)]">Situação do voto</span>
                <Badge variant={pr.canVote ? 'success' : 'outline'}>{pr.canVote ? 'votação aberta' : 'voto bloqueado'}</Badge>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--color-git-muted)]">
                {pr.canVote
                  ? 'Sua carteira pode votar agora. Favor, contra e abstenção contam para o quorum com peso territorial.'
                  : pr.canVoteReason}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-mono font-medium uppercase tracking-wider text-[var(--color-git-muted)]">
            Discussão Pública
          </h3>
          <div className="space-y-4 rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-4">
            <div className="space-y-3">
              {pr.comments.length > 0 ? pr.comments.map((item) => (
                <div key={item.id} className="border-b border-[var(--color-git-border2)] pb-3 last:border-0 last:pb-0">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-[var(--color-git-text)]">{item.authorAddress}</span>
                    <span className="text-[10px] text-[var(--color-git-muted)]">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">{item.body}</p>
                </div>
              )) : (
                <div className="text-sm text-[var(--color-git-muted)]">Ainda não há comentários nesta proposta.</div>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder="Adicione contexto técnico ou territorial a esta proposta..."
                className="w-full resize-none rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg)] px-3 py-2.5 text-sm text-[var(--color-git-text)] outline-none transition-all placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)]"
              />
              <button
                onClick={() => void handleComment()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg3)] py-2.5 text-sm text-[var(--color-git-text)] transition-colors hover:bg-[var(--color-git-border2)]"
              >
                <MessageSquare className="h-4 w-4" />
                Publicar comentário
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.08)] p-3 text-sm text-[#ff7b72]">
            {error}
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--color-git-border)] bg-[var(--color-git-bg)]/90 p-4 pb-safe backdrop-blur-md">
        <div className="mx-auto max-w-md space-y-3">
          {!pr.canVote ? (
            <div className="rounded-xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] px-3 py-2 text-[11px] text-[var(--color-git-muted)]">
              {pr.canVoteReason}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => void handleVote('contra')}
              disabled={!pr.canVote}
              className="rounded-xl border border-[var(--color-git-red)] bg-[var(--color-git-bg2)] py-3 text-sm font-medium text-[var(--color-git-red)] transition-colors hover:bg-[var(--color-git-bg3)] disabled:opacity-50"
            >
              Reprovar
            </button>
            <button
              onClick={() => void handleVote('abster')}
              disabled={!pr.canVote}
              className="rounded-xl border border-[var(--color-git-border2)] bg-[var(--color-git-bg3)] py-3 text-sm font-medium text-[var(--color-git-text)] transition-colors hover:bg-[var(--color-git-border2)] disabled:opacity-50"
            >
              Abster-se
            </button>
            <button
              onClick={() => void handleVote('favor')}
              disabled={!pr.canVote}
              className="rounded-xl border border-[rgba(63,185,80,0.5)] bg-[var(--color-git-green)] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Aprovar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

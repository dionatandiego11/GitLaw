import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, GitPullRequest, ShieldCheck, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CIStatus } from '@/components/ui/CIStatus';
import { DiffViewer } from '@/components/ui/DiffViewer';
import { useApp } from '@/context/AppProvider';

export function NovaProposta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { laws, neighborhoods, proposals, currentCitizen, createProposal } = useApp();
  const sourceProposalId = searchParams.get('proposalId');
  const sourceProposal = proposals.find((proposal) => proposal.id === sourceProposalId);
  const [step, setStep] = useState(1);
  const [isSigning, setIsSigning] = useState(false);
  const [lawId, setLawId] = useState(
    searchParams.get('lawId') ?? sourceProposal?.leiAlvoId ?? '',
  );
  const [articleId, setArticleId] = useState(
    searchParams.get('articleId') ?? sourceProposal?.artigoAlvoId ?? '',
  );
  const [issueId, setIssueId] = useState(sourceProposal?.issueId ?? '');
  const [urgency, setUrgency] = useState(sourceProposal?.urgencia ?? false);
  const [impactedNeighborhoodIds, setImpactedNeighborhoodIds] = useState<string[]>(
    sourceProposal?.impactedNeighborhoodIds ?? [],
  );
  const [newText, setNewText] = useState(sourceProposal?.newText ?? '');
  const [title, setTitle] = useState(
    sourceProposal ? `Nova versão de ${sourceProposal.id}: ${sourceProposal.titulo}` : '',
  );
  const [justification, setJustification] = useState(
    sourceProposal
      ? `Revisão da proposta ${sourceProposal.id}. ${sourceProposal.justificativa}`
      : '',
  );
  const [error, setError] = useState<string | null>(null);

  const selectableLaws =
    sourceProposal?.source === 'fork' ? laws : laws.filter((law) => !law.isFork);
  const selectedLaw = selectableLaws.find((law) => law.id === lawId) ?? selectableLaws[0];
  const selectedArticle = selectedLaw?.artigos.find((article) => article.id === articleId) ?? selectedLaw?.artigos[0];

  useEffect(() => {
    if (!lawId && selectedLaw) {
      setLawId(selectedLaw.id);
    }
  }, [lawId, selectedLaw]);

  useEffect(() => {
    if (selectedLaw && !selectedLaw.artigos.some((article) => article.id === articleId)) {
      setArticleId(selectedLaw.artigos[0]?.id ?? '');
    }
  }, [articleId, selectedLaw]);

  useEffect(() => {
    if (selectedArticle && newText.length === 0) {
      setNewText(selectedArticle.texto);
    }
  }, [newText.length, selectedArticle]);

  useEffect(() => {
    if (!sourceProposal) {
      return;
    }

    setLawId((current) => current || sourceProposal.leiAlvoId);
    setArticleId((current) => current || sourceProposal.artigoAlvoId);
    setIssueId((current) => current || sourceProposal.issueId || '');
    setUrgency((current) => current || sourceProposal.urgencia);
    setImpactedNeighborhoodIds((current) =>
      current.length > 0 ? current : sourceProposal.impactedNeighborhoodIds,
    );
    setNewText((current) => current || sourceProposal.newText);
    setTitle((current) =>
      current || `Nova versão de ${sourceProposal.id}: ${sourceProposal.titulo}`,
    );
    setJustification((current) =>
      current || `Revisão da proposta ${sourceProposal.id}. ${sourceProposal.justificativa}`,
    );
  }, [sourceProposal]);

  useEffect(() => {
    if (currentCitizen && impactedNeighborhoodIds.length === 0) {
      setImpactedNeighborhoodIds([currentCitizen.bairroId]);
    }
  }, [currentCitizen, impactedNeighborhoodIds.length]);

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSign = async () => {
    if (!selectedLaw || !selectedArticle) {
      setError('Selecione a lei e o artigo alvo antes de publicar.');
      return;
    }

    if (!title.trim() || !justification.trim() || newText.trim().length < 40) {
      setError('Preencha título, justificativa e uma proposta de texto com conteúdo suficiente.');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      const proposal = await createProposal({
        lawId: selectedLaw.id,
        articleId: selectedArticle.id,
        title,
        justification,
        newText,
        impactedNeighborhoodIds,
        issueId,
        urgency,
      });
      navigate(`/propostas/${proposal.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível publicar a proposta.');
    } finally {
      setIsSigning(false);
    }
  };

  if (!currentCitizen) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-[var(--color-git-text)]">Cidadania obrigatória para abrir proposta</h1>
          <p className="text-sm text-[var(--color-git-muted)]">Conecte uma carteira e emita seu NFT de cidadania antes de propor alterações legislativas.</p>
          <Link to="/connect" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-blue)] text-white rounded-xl text-sm font-medium">
            Conectar carteira
          </Link>
        </div>
      </div>
    );
  }

  const ciPreview = {
    conflito: !/revoga integralmente|fica sem efeito imediato|dispensa licenciamento/i.test(newText),
    constitucional: !/segregacao|censura previa|trabalho infantil/i.test(newText),
    orcamento: !/subsidi|gratuito|renuncia fiscal|isencao/i.test(newText) || /regulamento|estimativa/i.test(newText),
    redacao: newText.trim().length > 40 ? true : null,
  };
  const willOpenVoting = ciPreview.conflito && ciPreview.constitucional;

  const toggleNeighborhood = (id: string) => {
    setImpactedNeighborhoodIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen bg-[var(--color-git-bg)] pb-24"
    >
      <div className="sticky top-0 z-10 bg-[var(--color-git-bg)]/80 backdrop-blur-md border-b border-[var(--color-git-border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => step === 1 ? navigate(-1) : handleBack()} className="p-1.5 -ml-1.5 text-[var(--color-git-muted)] hover:text-[var(--color-git-text)] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate text-[var(--color-git-text)]">Nova proposta</h1>
          <div className="text-[10px] font-mono text-[var(--color-git-muted)]">Passo {step} de 3</div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {sourceProposal ? (
          <div className="rounded-2xl border border-[rgba(88,166,255,0.24)] bg-[rgba(88,166,255,0.08)] p-4 text-sm text-[var(--color-git-text)]">
            <p className="font-medium">Nova versão em andamento</p>
            <p className="mt-1 text-[var(--color-git-muted)]">
              Você está criando uma nova versão da proposta <span className="font-mono text-[var(--color-git-text)]">{sourceProposal.id}</span>.
            </p>
          </div>
        ) : null}

        {/* Progress Bar */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[var(--color-git-border2)] -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-git-blue)] -z-10 transition-all duration-500" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                step >= i 
                  ? 'bg-[var(--color-git-blue)] border-[var(--color-git-blue)] text-white' 
                  : 'bg-[var(--color-git-bg2)] border-[var(--color-git-border2)] text-[var(--color-git-muted)]'
              }`}
            >
              {step > i ? <CheckCircle2 className="w-3 h-3" /> : i}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Selecione o Alvo</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Lei</label>
                <select value={selectedLaw?.id ?? ''} onChange={(event) => { setLawId(event.target.value); setNewText(''); }} className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all">
                  {selectableLaws.map((law) => (
                    <option key={law.id} value={law.id}>{law.titulo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Artigo</label>
                <select value={selectedArticle?.id ?? ''} onChange={(event) => { setArticleId(event.target.value); setNewText(''); }} className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all">
                  {selectedLaw?.artigos.map((article) => (
                    <option key={article.id} value={article.id}>{article.rotulo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Tema relacionado (opcional)</label>
                <input value={issueId} onChange={(event) => setIssueId(event.target.value)} type="text" placeholder="#12 - Problemas de acessibilidade" className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all placeholder:text-[var(--color-git-muted)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Bairros impactados</label>
                <div className="flex flex-wrap gap-2">
                  {neighborhoods.map((neighborhood) => (
                    <button key={neighborhood.id} type="button" onClick={() => toggleNeighborhood(neighborhood.id)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${impactedNeighborhoodIds.includes(neighborhood.id) ? 'bg-[var(--color-git-blue)] text-white border-[rgba(88,166,255,0.5)]' : 'bg-[var(--color-git-bg2)] text-[var(--color-git-text)] border-[var(--color-git-border)]'}`}>
                      {neighborhood.nome}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--color-git-muted)]">
                <input type="checkbox" checked={urgency} onChange={(event) => setUrgency(event.target.checked)} />
                Marcar como urgente
              </label>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Comparação do texto</h2>
            {selectedArticle ? (
              <>
                <DiffViewer before={selectedArticle.texto} after={newText} title={selectedArticle.rotulo} />
                <textarea
                  value={newText}
                  onChange={(event) => setNewText(event.target.value)}
                  rows={7}
                  className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all resize-none"
                />
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-medium text-[var(--color-git-muted)] uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Validação técnica (prévia)
                  </h3>
                  <div className="bg-[var(--color-git-bg2)] rounded-xl border border-[var(--color-git-border)] p-3 space-y-2">
                    <CIStatus status={ciPreview.conflito} label="Conflito com outras leis" />
                    <CIStatus status={ciPreview.constitucional} label="Constitucionalidade" />
                    <CIStatus status={ciPreview.orcamento} label="Impacto Orçamentário" />
                    <CIStatus status={ciPreview.redacao} label="Redação Técnica" />
                  </div>
                  <div className={`rounded-xl border p-3 text-sm ${
                    willOpenVoting
                      ? 'border-[rgba(63,185,80,0.3)] bg-[rgba(63,185,80,0.08)] text-[var(--color-git-text)]'
                      : 'border-[rgba(210,153,34,0.32)] bg-[rgba(210,153,34,0.08)] text-[var(--color-git-text)]'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${willOpenVoting ? 'text-[var(--color-git-green)]' : 'text-[var(--color-git-amber)]'}`} />
                      <p className="leading-relaxed">
                        {willOpenVoting
                          ? 'Se você publicar este texto, a proposta deve abrir votação imediatamente.'
                          : 'Se você publicar este texto, a proposta vai para revisão e a votação ficará bloqueada até que o conteúdo seja ajustado.'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Revisão e Assinatura</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Título da proposta</label>
                <input value={title} onChange={(event) => setTitle(event.target.value)} type="text" placeholder="Amplia largura minima no art. 4" className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Justificativa</label>
                <textarea value={justification} onChange={(event) => setJustification(event.target.value)} rows={4} placeholder="Explique o problema publico, o recorte territorial e o efeito esperado da mudanca." className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all resize-none" />
              </div>
            </div>

            <div className="bg-[rgba(210,153,34,0.1)] border border-[rgba(210,153,34,0.3)] rounded-xl p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-[var(--color-git-amber)] shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--color-git-text)]">
                <p className="font-medium mb-1">Assinatura EIP-712</p>
                <p className="text-xs text-[var(--color-git-muted)] leading-relaxed">
                  Você assinará esta proposta com sua carteira MetaMask. Esta ação não consome gas (taxa de rede), mas registra criptograficamente sua autoria on-chain.
                </p>
              </div>
            </div>

            {!willOpenVoting ? (
              <div className="bg-[rgba(210,153,34,0.1)] border border-[rgba(210,153,34,0.3)] rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--color-git-amber)] shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--color-git-text)]">
                  <p className="font-medium mb-1">Esta proposta será publicada em revisão</p>
                  <p className="text-xs text-[var(--color-git-muted)] leading-relaxed">
                    Quando a validação técnica não passa, a votação fica bloqueada. Vale ajustar o texto antes de publicar para evitar que a proposta expire sem abrir votação.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {error ? <div className="rounded-xl border border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.08)] p-3 text-sm text-[#ff7b72]">{error}</div> : null}
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-git-bg)]/90 backdrop-blur-md border-t border-[var(--color-git-border)] p-4 pb-safe z-20">
        <div className="max-w-md mx-auto flex gap-3">
          {step < 3 ? (
            <button 
              onClick={handleNext}
              className="w-full py-3 bg-[var(--color-git-blue)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity text-sm border border-[rgba(88,166,255,0.5)] flex items-center justify-center gap-2"
            >
              Próximo Passo <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <button 
              onClick={() => void handleSign()}
              disabled={isSigning}
              className="w-full py-3 bg-[var(--color-git-green)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity text-sm border border-[rgba(63,185,80,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSigning ? (
                <span className="animate-pulse">Aguardando MetaMask...</span>
              ) : (
                <>
                  <GitPullRequest className="w-4 h-4" /> Assinar e publicar proposta
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

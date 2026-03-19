import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, GitFork, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';

export function NovoFork() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { laws, currentCitizen, createProposal } = useApp();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [lawId, setLawId] = useState(params.id ?? searchParams.get('sourceLawId') ?? '');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [durationMonths, setDurationMonths] = useState(6);
  const [error, setError] = useState<string | null>(null);

  const baseLaws = laws.filter((law) => !law.isFork);
  const selectedLaw = baseLaws.find((law) => law.id === lawId) ?? baseLaws[0];

  useEffect(() => {
    if (!lawId && selectedLaw) {
      setLawId(selectedLaw.id);
    }
  }, [lawId, selectedLaw]);

  useEffect(() => {
    if (selectedLaw && name.length === 0 && currentCitizen) {
      setName(`${selectedLaw.titulo} - ${currentCitizen.bairroNome}`);
    }
  }, [currentCitizen, name.length, selectedLaw]);

  useEffect(() => {
    if (objective.length === 0 && selectedLaw) {
      setObjective(`Experimentar uma adaptacao local de ${selectedLaw.titulo} para responder melhor ao territorio.`);
    }
  }, [objective.length, selectedLaw]);

  const handleNext = () => setStep(s => Math.min(s + 1, 2));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async () => {
    if (!selectedLaw || !currentCitizen) {
      setError('Cidadania ativa e lei base são obrigatórias para propor uma variação.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const proposal = await createProposal({
        kind: 'variacao_local',
        lawId: selectedLaw.id,
        title: `Autoriza variação local de ${selectedLaw.titulo} em ${currentCitizen.bairroNome}`,
        justification: objective,
        impactedNeighborhoodIds: [currentCitizen.bairroId],
        variationDraft: {
          name,
          objective,
          durationMonths,
        },
      });
      navigate(`/propostas/${proposal.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível publicar a autorização da variação.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentCitizen) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-[var(--color-git-text)]">Cidadania obrigatória para propor variações</h1>
          <p className="text-sm text-[var(--color-git-muted)]">A variação local precisa de autoria territorial ativa para abrir a etapa de autorização pública.</p>
          <Link to="/connect" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-blue)] text-white rounded-xl text-sm font-medium">
            Conectar carteira
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-sm font-semibold truncate text-[var(--color-git-text)]">Propor variação local</h1>
          <div className="text-[10px] font-mono text-[var(--color-git-muted)]">Passo {step} de 2</div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between relative max-w-[200px] mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[var(--color-git-border2)] -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-git-blue)] -z-10 transition-all duration-500" 
            style={{ width: `${((step - 1) / 1) * 100}%` }}
          />
          
          {[1, 2].map(i => (
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
            <div className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl p-4 flex items-start gap-3">
              <GitFork className="w-5 h-5 text-[var(--color-git-purple)] shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--color-git-text)]">
                <p className="font-medium mb-1">O que é uma variação local?</p>
                <p className="text-xs text-[var(--color-git-muted)] leading-relaxed">
                  A variação local nasce em duas etapas: primeiro o bairro autoriza a abertura do experimento; depois a versão territorial é ativada com base nessa aprovação.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Lei Base</label>
                <select value={selectedLaw?.id ?? ''} onChange={(event) => setLawId(event.target.value)} className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all">
                  {baseLaws.map((law) => (
                    <option key={law.id} value={law.id}>{law.titulo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Bairro Alvo</label>
                <div className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl text-sm text-[var(--color-git-text)] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-git-muted)]" />
                  {currentCitizen.bairroNome} (Seu bairro registrado)
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Termos da autorização</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Nome da variação</label>
                <input value={name} onChange={(event) => setName(event.target.value)} type="text" className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Objetivo</label>
                <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">Duração do Teste</label>
                <select value={durationMonths} onChange={(event) => setDurationMonths(Number(event.target.value))} className="w-full px-3 py-2.5 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-xl text-sm text-[var(--color-git-text)] outline-none transition-all">
                  <option value={6}>6 meses</option>
                  <option value={12}>12 meses</option>
                </select>
              </div>
            </div>

            <div className="bg-[rgba(255,123,114,0.1)] border border-[rgba(255,123,114,0.3)] rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#ff7b72] shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--color-git-text)]">
                  <p className="font-medium mb-1 text-[#ff7b72]">Fluxo institucional</p>
                  <p className="text-xs text-[var(--color-git-muted)] leading-relaxed">
                    Este envio ainda não cria a variação. Ele publica a proposta de autorização territorial. Se ela for aprovada, o bairro poderá ativar a versão local da lei.
                  </p>
                </div>
              </div>
          </motion.div>
        )}

        {error ? <div className="rounded-xl border border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.08)] p-3 text-sm text-[#ff7b72]">{error}</div> : null}
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-git-bg)]/90 backdrop-blur-md border-t border-[var(--color-git-border)] p-4 pb-safe z-20">
        <div className="max-w-md mx-auto flex gap-3">
          {step < 2 ? (
            <button 
              onClick={handleNext}
              className="w-full py-3 bg-[var(--color-git-blue)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity text-sm border border-[rgba(88,166,255,0.5)] flex items-center justify-center gap-2"
            >
              Próximo Passo <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <button 
              onClick={() => void handleCreate()}
              disabled={isCreating}
              className="w-full py-3 bg-[var(--color-git-purple)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity text-sm border border-[rgba(137,87,229,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? (
                <span className="animate-pulse">Publicando autorização...</span>
              ) : (
                <>
                  <GitFork className="w-4 h-4" /> Publicar autorização
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

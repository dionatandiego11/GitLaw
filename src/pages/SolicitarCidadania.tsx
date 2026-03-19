import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppProvider';

export function SolicitarCidadania() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bairroId, setBairroId] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentAddress, currentCitizen, currentRequest, issueCitizenship, neighborhoods } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bairroId || !documentFile) {
      setError('Selecione um bairro e um comprovante de residencia para emitir a cidadania.');
      return;
    }

    setError(null);
    await issueCitizenship({
      bairroId,
      documentName: documentFile.name,
      documentType: documentFile.type,
      documentSize: documentFile.size,
    });
    setStep(2);
    window.setTimeout(() => {
      navigate('/');
    }, 1600);
  };

  if (!currentAddress) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-[var(--color-git-text)]">Entre antes de validar seu endereco</h1>
          <p className="text-sm text-[var(--color-git-muted)]">Primeiro abrimos sua sessao. Depois voce escolhe o bairro e envia o comprovante.</p>
          <Link to="/connect" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-blue)] text-white rounded-xl text-sm font-medium">
            Ir para entrada
          </Link>
        </div>
      </div>
    );
  }

  if (currentCitizen) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-[var(--color-git-text)]">Seu acesso completo ja esta liberado</h1>
          <p className="text-sm text-[var(--color-git-muted)]">Esta carteira ja foi validada para {currentCitizen.bairroNome}.</p>
          <Link to="/perfil" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-green)] text-white rounded-xl text-sm font-medium">
            Ver perfil
          </Link>
        </div>
      </div>
    );
  }

  if (currentRequest) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[var(--color-git-bg)] p-4 pb-20"
      >
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <div className="rounded-[28px] border border-[rgba(88,166,255,0.24)] bg-[rgba(88,166,255,0.06)] p-6">
            <div className="w-12 h-12 rounded-2xl border border-[rgba(88,166,255,0.28)] bg-[rgba(88,166,255,0.12)] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[var(--color-git-blue)]" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[var(--color-git-text)]">Validacao em andamento</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)]">
              Seu comprovante para <strong className="text-[var(--color-git-text)]">{currentRequest.bairroNome}</strong> ja foi enviado.
              Quando a validacao terminar, seu acesso de participacao sera liberado automaticamente.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-git-muted)]">Resumo</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--color-git-text)]">O que acontece agora</h2>
            </div>
            <div className="space-y-3 text-sm text-[var(--color-git-muted)]">
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg)] p-4">
                1. Sua solicitacao foi registrada com o comprovante enviado.
              </div>
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg)] p-4">
                2. O bairro informado e <strong className="text-[var(--color-git-text)]">{currentRequest.bairroNome}</strong>.
              </div>
              <div className="rounded-2xl border border-[var(--color-git-border)] bg-[var(--color-git-bg)] p-4">
                3. Assim que a validacao terminar, voce podera votar e acompanhar o painel completo.
              </div>
            </div>
            <Link to="/" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-git-blue)] text-white rounded-xl text-sm font-medium">
              Voltar ao inicio
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[var(--color-git-bg)] p-4 pb-20"
    >
      <div className="max-w-md mx-auto space-y-6 pt-8">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[var(--color-git-blue)]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-git-text)]">Validar residencia</h1>
          <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
            Falta so confirmar seu bairro para liberar voto, comentarios e participacao nas propostas locais.
          </p>
        </div>

        <div className="rounded-[24px] border border-[rgba(88,166,255,0.24)] bg-[rgba(88,166,255,0.06)] p-4 text-sm text-[var(--color-git-muted)]">
          <strong className="block text-[var(--color-git-text)]">Como funciona</strong>
          <span className="block mt-1">Escolha seu bairro, envie um comprovante e pronto. O sistema usa esse passo para liberar sua participacao local.</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-2xl p-5 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">
                  Carteira conectada
                </label>
                <div className="w-full px-3 py-2.5 bg-[var(--color-git-bg)] border border-[var(--color-git-border)] rounded-lg text-sm font-mono text-[var(--color-git-muted)] truncate">
                  {currentAddress}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">
                  Seu bairro
                </label>
                <select value={bairroId} onChange={(event) => setBairroId(event.target.value)} required className="w-full px-3 py-2.5 bg-[var(--color-git-bg)] border border-[var(--color-git-border)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)] rounded-lg text-sm text-[var(--color-git-text)] outline-none transition-all">
                  <option value="">Selecione seu bairro</option>
                  {neighborhoods.map((neighborhood) => (
                    <option key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-git-muted)] mb-1.5 uppercase tracking-wider">
                  Comprovante de residencia
                </label>
                <label className="border-2 border-dashed border-[var(--color-git-border)] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--color-git-bg)] transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-[var(--color-git-muted)] mb-2" />
                  <span className="text-sm text-[var(--color-git-text)] font-medium">
                    {documentFile ? documentFile.name : 'Selecionar documento'}
                  </span>
                  <span className="text-xs text-[var(--color-git-muted)] mt-1">PDF, JPG ou PNG de ate 5MB</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="text-[10px] text-[var(--color-git-muted)] mt-2 leading-relaxed">
                  O documento serve apenas para validar seu endereco. Depois da analise, so o resultado da validacao fica associado ao seu acesso.
                </p>
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-[var(--color-git-green)] hover:opacity-90 text-white rounded-xl font-medium transition-opacity text-sm border border-[rgba(63,185,80,0.5)]">
              Enviar comprovante
            </button>

            {error ? <p className="text-xs text-[#ff7b72]">{error}</p> : null}
          </form>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] rounded-2xl p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-[rgba(63,185,80,0.1)] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[var(--color-git-green)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Comprovante enviado</h2>
            <p className="text-sm text-[var(--color-git-muted)]">
              Seu endereco esta sendo analisado. Assim que a validacao terminar, seu acesso completo sera liberado.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

import { motion } from 'motion/react';
import { ArrowRight, GitFork, House, MapPin, Users, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRCard } from '@/components/PRCard';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppProvider';

function formatPopulation(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function MeuBairro() {
  const { currentCitizen, neighborhoods, proposals, forks, laws } = useApp();

  if (!currentCitizen) {
    return (
      <div className="p-4">
        <div className="rounded-[28px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.04)] p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(88,166,255,0.28)] bg-[rgba(88,166,255,0.08)]">
            <House className="h-7 w-7 text-[var(--color-git-blue)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-git-text)]">Ative seu bairro para personalizar a jornada</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)]">
            Quando sua cidadania estiver validada, esta area vai mostrar so o que importa para sua rua, seu bairro e as votacoes onde seu voto tem mais peso.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              to="/connect"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-git-blue)] px-4 py-3 text-sm font-medium text-white"
            >
              Entrar agora
            </Link>
            <Link
              to="/cidadania/solicitar"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--color-git-text)]"
            >
              Validar residencia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentNeighborhood = neighborhoods.find(
    (neighborhood) => neighborhood.id === currentCitizen.bairroId,
  );
  const adjacentNames = neighborhoods
    .filter((neighborhood) => currentNeighborhood?.adjacentes.includes(neighborhood.id))
    .map((neighborhood) => neighborhood.nome);
  const localProposals = proposals
    .filter((proposal) => proposal.impactedNeighborhoodIds.includes(currentCitizen.bairroId))
    .sort((left, right) => new Date(left.votingEndsAt).getTime() - new Date(right.votingEndsAt).getTime());
  const nearbyProposals = proposals.filter((proposal) => {
    if (proposal.impactedNeighborhoodIds.includes(currentCitizen.bairroId)) {
      return false;
    }

    return proposal.impactedNeighborhoodIds.some((impacted) =>
      currentNeighborhood?.adjacentes.includes(impacted),
    );
  });
  const neighborhoodForks = forks.filter((fork) => fork.bairroId === currentCitizen.bairroId);
  const localLaws = laws.filter((law) => law.bairroId === currentCitizen.bairroId);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-[var(--color-git-border)] bg-[linear-gradient(165deg,rgba(88,166,255,0.16),rgba(22,27,34,0.96)_48%,rgba(63,185,80,0.12))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(230,237,243,0.72)]">
              Meu bairro
            </span>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-[var(--color-git-text)]">
              {currentCitizen.bairroNome}
            </h1>
            <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-[rgba(230,237,243,0.74)]">
              Aqui ficam as propostas que mais mexem com seu cotidiano, os experimentos locais e o repositorio do seu territorio.
              
            </p>
          </div>
          <Badge variant="success">peso maximo</Badge>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-3">
            <MapPin className="h-4 w-4 text-[var(--color-git-blue)]" />
            <div className="mt-2 text-lg font-semibold text-[var(--color-git-text)]">
              {currentNeighborhood ? formatPopulation(currentNeighborhood.populacao) : '--'}
            </div>
            <div className="text-[11px] text-[rgba(230,237,243,0.66)]">moradores</div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-3">
            <Vote className="h-4 w-4 text-[var(--color-git-green)]" />
            <div className="mt-2 text-lg font-semibold text-[var(--color-git-text)]">{localProposals.length}</div>
            <div className="text-[11px] text-[rgba(230,237,243,0.66)]">votacoes locais</div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-3">
            <GitFork className="h-4 w-4 text-[var(--color-git-purple)]" />
            <div className="mt-2 text-lg font-semibold text-[var(--color-git-text)]">{neighborhoodForks.length}</div>
            <div className="text-[11px] text-[rgba(230,237,243,0.66)]">experimentos</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/bairros/${currentCitizen.bairroId}`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-git-text)] px-4 py-2 text-sm font-medium text-[var(--color-git-bg)]"
          >
            Ver repositorio local
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/propostas?status=meu-bairro"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.18)] px-4 py-2 text-sm font-medium text-[var(--color-git-text)]"
          >
            Ver votacoes do bairro
          </Link>
        </div>
      </section>

      <section className="rounded-[26px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-git-text)]">Como seu voto pesa aqui</h2>
            <p className="mt-1 text-sm text-[var(--color-git-muted)]">
              Quanto mais perto o assunto estiver do seu bairro, maior o peso do seu voto.
            </p>
          </div>
          <Users className="h-5 w-5 text-[var(--color-git-blue)]" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[rgba(63,185,80,0.25)] bg-[rgba(63,185,80,0.08)] p-3 text-center">
            <div className="text-xl font-semibold text-[var(--color-git-text)]">100%</div>
            <div className="mt-1 text-[11px] text-[var(--color-git-muted)]">se o tema impacta seu bairro</div>
          </div>
          <div className="rounded-2xl border border-[rgba(88,166,255,0.25)] bg-[rgba(88,166,255,0.08)] p-3 text-center">
            <div className="text-xl font-semibold text-[var(--color-git-text)]">60%</div>
            <div className="mt-1 text-[11px] text-[var(--color-git-muted)]">se o tema esta em bairro vizinho</div>
          </div>
          <div className="rounded-2xl border border-[rgba(210,153,34,0.25)] bg-[rgba(210,153,34,0.08)] p-3 text-center">
            <div className="text-xl font-semibold text-[var(--color-git-text)]">30%</div>
            <div className="mt-1 text-[11px] text-[var(--color-git-muted)]">se o tema afeta a cidade como um todo</div>
          </div>
        </div>
        {adjacentNames.length > 0 ? (
          <p className="mt-4 text-xs text-[var(--color-git-muted)]">
            Bairros vizinhos considerados neste piloto: {adjacentNames.join(', ')}.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-git-text)]">Em votacao no seu bairro</h2>
          <Link to="/propostas?status=meu-bairro" className="text-xs font-medium text-[var(--color-git-blue)]">
            ver tudo
          </Link>
        </div>
        {localProposals.length > 0 ? (
          localProposals.slice(0, 3).map((proposal) => <PRCard key={proposal.id} pr={proposal} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-git-border2)] p-4 text-sm text-[var(--color-git-muted)]">
            Nenhuma votacao aberta impacta diretamente {currentCitizen.bairroNome} neste momento.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-git-text)]">Perto de voce</h2>
          <Link to="/propostas" className="text-xs font-medium text-[var(--color-git-blue)]">
            explorar cidade inteira
          </Link>
        </div>
        {nearbyProposals.length > 0 ? (
          nearbyProposals.slice(0, 2).map((proposal) => <PRCard key={proposal.id} pr={proposal} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-git-border2)] p-4 text-sm text-[var(--color-git-muted)]">
            Nenhuma proposta de bairros vizinhos precisa da sua atencao agora.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-git-text)]">Variações e repositorio local</h2>
          <Link to={`/bairros/${currentCitizen.bairroId}`} className="text-xs font-medium text-[var(--color-git-blue)]">
            abrir repositorio
          </Link>
        </div>

        {neighborhoodForks.length > 0 ? (
          neighborhoodForks.map((fork) => (
            <Link
              key={fork.id}
              to={`/bairros/${fork.bairroId}`}
              className="block rounded-2xl border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:border-[rgba(188,140,255,0.45)]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(188,140,255,0.26)] bg-[rgba(188,140,255,0.08)]">
                  <GitFork className="h-5 w-5 text-[var(--color-git-purple)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[var(--color-git-text)]">{fork.nome}</h3>
                    <Badge variant="purple">{fork.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{fork.objetivo}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-git-border2)] p-4 text-sm text-[var(--color-git-muted)]">
            Seu bairro ainda nao iniciou variacoes locais. Quando uma variacao for criada, ela aparece aqui.
          </div>
        )}

        {localLaws.length > 0 ? (
          <p className="text-xs text-[var(--color-git-muted)]">
            Este bairro ja possui {localLaws.length} lei{localLaws.length > 1 ? 's' : ''} em variacao local para acompanhamento do territorio.
          </p>
        ) : null}
      </section>
    </motion.div>
  );
}

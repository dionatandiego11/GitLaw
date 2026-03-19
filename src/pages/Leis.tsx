import { useDeferredValue, useState } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  BookCopy,
  GitBranch,
  Landmark,
  Scale,
  Search,
  Users,
} from 'lucide-react';
import { LeiCard } from '@/components/LeiCard';
import { useApp } from '@/context/AppProvider';

type InstitutionalBlock = {
  title: string;
  summary: string;
  highlights: string[];
  icon: LucideIcon;
};

type WorkflowStep = {
  title: string;
  description: string;
};

const institutionalBlocks: InstitutionalBlock[] = [
  {
    title: 'Legislação vigente',
    summary: 'Reúne leis, códigos e redações consolidadas que já estão em vigor no município.',
    highlights: ['texto consolidado', 'histórico de alterações', 'referências normativas'],
    icon: BookCopy,
  },
  {
    title: 'Propostas e emendas',
    summary: 'Organiza matérias em tramitação, versões propostas e alterações apresentadas ao longo do processo.',
    highlights: ['projeto de lei', 'emenda modificativa', 'comparação entre redações'],
    icon: GitBranch,
  },
  {
    title: 'Pareceres e análise',
    summary: 'Concentra a leitura jurídica, técnica e orçamentária antes da deliberação política.',
    highlights: ['parecer jurídico', 'impacto orçamentário', 'admissibilidade'],
    icon: Scale,
  },
  {
    title: 'Participação e deliberação',
    summary: 'Registra contribuições públicas, votação, atas e publicação do resultado institucional.',
    highlights: ['consulta pública', 'votação nominal', 'publicação oficial'],
    icon: Landmark,
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    title: 'Protocolo da matéria',
    description: 'A proposta entra com autoria, justificativa e texto inicial para análise formal.',
  },
  {
    title: 'Exame técnico e jurídico',
    description: 'Comissões, jurídico e orçamento verificam constitucionalidade, impacto e redação.',
  },
  {
    title: 'Contribuição pública',
    description: 'Moradores e entidades acompanham a tramitação e registram sugestões com rastreabilidade.',
  },
  {
    title: 'Deliberação',
    description: 'A matéria segue para votação, com registro do placar e do posicionamento de cada agente.',
  },
  {
    title: 'Consolidação',
    description: 'Se aprovada, a redação final passa a compor o texto vigente sem perder o histórico.',
  },
];

export function Leis() {
  const { laws } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todas');
  const deferredQuery = useDeferredValue(query);

  const filteredLaws = laws.filter((law) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      `${law.titulo} ${law.numero} ${law.resumo}`.toLowerCase().includes(deferredQuery.toLowerCase());

    const matchesCategory =
      category === 'todas' ||
      (category === 'forks' ? Boolean(law.isFork) : law.categoria === category);

    return matchesQuery && matchesCategory;
  });

  const categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'urbanismo', label: 'Urbanismo' },
    { id: 'forks', label: 'Variações locais' },
    { id: 'meio-ambiente', label: 'Meio ambiente' },
    { id: 'transporte', label: 'Transporte' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-5"
    >
      <section className="overflow-hidden rounded-[30px] border border-[var(--color-git-border)] bg-[linear-gradient(180deg,rgba(88,166,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(88,166,255,0.24)] bg-[rgba(6,8,11,0.38)] px-3 py-1 text-[11px] font-medium text-[var(--color-git-blue)]">
            <Users className="h-3.5 w-3.5" />
            Leitura institucional do GitLaw
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight text-[var(--color-git-text)]">
              Legislação, tramitação e decisão em uma mesma linha do tempo
            </h1>
            <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
              O GitLaw usa lógica de versionamento, mas fala a língua do processo legislativo:
              cada mudança preserva autoria, pareceres, votação e redação final.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full border border-[var(--color-git-border)] bg-[rgba(6,8,11,0.28)] px-3 py-2 text-xs text-[var(--color-git-text)]">
              texto vigente
            </span>
            <span className="rounded-full border border-[var(--color-git-border)] bg-[rgba(6,8,11,0.28)] px-3 py-2 text-xs text-[var(--color-git-text)]">
              tramitação rastreável
            </span>
            <span className="rounded-full border border-[var(--color-git-border)] bg-[rgba(6,8,11,0.28)] px-3 py-2 text-xs text-[var(--color-git-text)]">
              deliberação registrada
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Como o sistema se organiza</h2>
          <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
            Em vez de mostrar a infraestrutura interna, esta área destaca só os blocos que fazem sentido para
            quem acompanha a vida legislativa.
          </p>
        </div>

        <div className="space-y-3">
          {institutionalBlocks.map((block) => {
            const Icon = block.icon;

            return (
              <article
                key={block.title}
                className="rounded-[26px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-git-border2)] bg-[rgba(88,166,255,0.08)]">
                    <Icon className="h-5 w-5 text-[var(--color-git-blue)]" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-git-text)]">{block.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-git-muted)]">{block.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {block.highlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[var(--color-git-border)] bg-[var(--color-git-bg2)] px-2.5 py-1 text-[11px] text-[var(--color-git-text)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Ciclo de tramitação</h2>
          <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
            A lógica do GitLaw aparece no encadeamento das etapas, sem depender de termos técnicos de plataforma.
          </p>
        </div>

        <div className="space-y-2">
          {workflowSteps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(88,166,255,0.14)] text-sm font-semibold text-[var(--color-git-blue)]">
                {index + 1}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--color-git-text)]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-[30px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-git-text)]">Consulta da legislação</h2>
          <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
            Use a busca abaixo para localizar leis vigentes, códigos municipais e variações locais em discussão.
          </p>
        </div>

        <div className="space-y-4 rounded-[24px] border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-git-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar leis, códigos e redações..."
              className="w-full rounded-2xl border border-[var(--color-git-border2)] bg-[var(--color-git-bg2)] py-3 pl-9 pr-4 text-sm text-[var(--color-git-text)] outline-none transition-all placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:ring-1 focus:ring-[var(--color-git-blue)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={`min-h-[42px] rounded-2xl border px-3 py-2 text-[11px] font-medium leading-tight transition-colors ${
                  category === item.id
                    ? 'border-[rgba(88,166,255,0.5)] bg-[var(--color-git-blue)] text-white'
                    : 'border-[var(--color-git-border)] bg-[var(--color-git-bg3)] text-[var(--color-git-text)] hover:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredLaws.length > 0 ? (
            filteredLaws.map((lei) => <LeiCard key={lei.id} lei={lei} />)
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--color-git-border2)] p-4 text-sm text-[var(--color-git-muted)]">
              Nenhuma lei encontrada para os filtros aplicados.
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

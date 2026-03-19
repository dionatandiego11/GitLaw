import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createFork,
  createProposal,
  syncProposalLifecycles,
  voteOnProposal,
} from '../../server/service.js';
import { DEMO_CITIZEN_ADDRESS, seedStore } from '../../server/seed.js';

function cloneStore() {
  return JSON.parse(JSON.stringify(seedStore));
}

describe('server proposal lifecycle', () => {
  it('rejects open proposals that miss quorum after the deadline', () => {
    const store = cloneStore();
    const proposal = store.proposals.find((item) => item.id === 'pr-102');

    proposal.votingEndsAt = '2000-01-01T00:00:00.000Z';

    const changed = syncProposalLifecycles(store);

    assert.equal(changed, true);
    assert.equal(proposal.status, 'rejeitado');
    assert.equal(proposal.resolutionReason, 'quorum_insuficiente');
    assert.ok(proposal.closedAt);
    assert.ok(
      store.activities.some(
        (activity) =>
          activity.tipo === 'pr_rejeitado' && activity.link === `/propostas/${proposal.id}`,
      ),
    );
  });

  it('rejects review-blocked proposals when the deadline expires', () => {
    const store = cloneStore();
    const proposal = store.proposals.find((item) => item.id === 'pr-101');

    proposal.votingEndsAt = '2000-01-01T00:00:00.000Z';

    syncProposalLifecycles(store);

    assert.equal(proposal.status, 'rejeitado');
    assert.equal(proposal.resolutionReason, 'bloqueio_ci');
    assert.ok(proposal.closedAt);
  });

  it('blocks votes on proposals that are still under review', () => {
    const store = cloneStore();

    assert.throws(
      () =>
        voteOnProposal(store, 'pr-101', {
          address: DEMO_CITIZEN_ADDRESS,
          choice: 'favor',
        }),
      /nao liberou a etapa de votacao/,
    );
  });

  it('links new fork proposals back to the owning fork record', () => {
    const store = cloneStore();
    const fork = store.forks.find((item) => item.id === 'fork-1');

    const result = createProposal(store, {
      authorAddress: DEMO_CITIZEN_ADDRESS,
      lawId: 'lei-fork-1',
      articleId: 'lei-fork-1-art-18',
      title: 'feat(fork): amplia horario de comercio local no experimento',
      justification:
        'Ajustar o experimento local para medir demanda de servicos de conveniencia no fim do dia sem alterar o restante da lei base.',
      newText:
        'Fica permitido comercio de baixo impacto, incluindo padarias artesanais, mercearias e servicos de conveniencia de pequeno porte, em vias residenciais previamente definidas no plano local do experimento, mediante licenca simplificada e horario regulado pelo conselho local.',
      impactedNeighborhoodIds: ['sape'],
      issueId: '#fork-44',
      urgency: false,
    });

    assert.equal(result.proposal.forkId, 'fork-1');
    assert.ok(fork.proposalIds.includes(result.proposal.id));
  });

  it('blocks duplicate active forks for the same law and neighborhood', () => {
    const store = cloneStore();

    assert.throws(
      () =>
        createFork(store, {
          authorAddress: DEMO_CITIZEN_ADDRESS,
          lawId: 'lei-2',
          bairroId: 'sape',
          name: 'Outro experimento no Sape',
          objective: 'Testar uma segunda versao local da mesma lei base.',
          durationMonths: 6,
        }),
      /Ja existe uma variacao ativa/,
    );
  });
});

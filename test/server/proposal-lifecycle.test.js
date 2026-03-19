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
      /nao abriu votacao/,
    );
  });

  it('blocks the author from voting on their own proposal', () => {
    const store = cloneStore();

    assert.throws(
      () =>
        voteOnProposal(store, 'pr-201', {
          address: DEMO_CITIZEN_ADDRESS,
          choice: 'favor',
        }),
      /nao vota na propria proposta/,
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
    assert.ok(
      store.events.some(
        (event) =>
          event.type === 'ProposalCreated' &&
          event.entityType === 'proposta' &&
          event.entityId === result.proposal.id,
      ),
    );
  });

  it('blocks duplicate active forks for the same law and neighborhood', () => {
    const store = cloneStore();

    assert.throws(
      () =>
        createFork(store, {
          authorAddress: DEMO_CITIZEN_ADDRESS,
          bairroId: 'sape',
          sourceProposalId: 'pr-104',
        }),
      /Ja existe uma variacao territorial registrada/,
    );
  });

  it('only opens a local variation from an approved authorization proposal', () => {
    const store = cloneStore();
    store.forks = [];
    const result = createFork(store, {
      authorAddress: DEMO_CITIZEN_ADDRESS,
      bairroId: 'sape',
      sourceProposalId: 'pr-104',
    });

    assert.equal(result.fork.sourceProposalId, 'pr-104');
    assert.equal(result.fork.bairroId, 'sape');
    assert.equal(result.fork.nome, 'Zoneamento Misto - Sape');
    assert.ok(
      store.events.some(
        (event) =>
          event.type === 'LocalVariationOpened' &&
          event.entityId === result.fork.id &&
          event.payload.sourceProposalId === 'pr-104',
      ),
    );
  });

  it('records vote, approval and law commit events when a proposal reaches quorum', () => {
    const store = cloneStore();

    const result = voteOnProposal(store, 'pr-102', {
      address: DEMO_CITIZEN_ADDRESS,
      choice: 'favor',
    });

    assert.equal(result.proposal.status, 'aprovado');
    assert.ok(
      store.events.some(
        (event) =>
          event.type === 'VoteCast' &&
          event.entityId === 'pr-102' &&
          event.actorAddress === DEMO_CITIZEN_ADDRESS,
      ),
    );
    assert.ok(
      store.events.some(
        (event) => event.type === 'ProposalApproved' && event.entityId === 'pr-102',
      ),
    );
    assert.ok(
      store.events.some(
        (event) => event.type === 'LawCommitRecorded' && event.entityId === 'lei-4',
      ),
    );
  });
});

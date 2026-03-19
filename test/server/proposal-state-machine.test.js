import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  determineInitialProposalState,
  listProposalStateMachine,
  resolveProposalLifecycleTransition,
  resolveProposalWorkflowStage,
} from '../../packages/domain/src/index.js';

describe('proposal state machine', () => {
  it('opens a proposal immediately when admissibility is satisfied', () => {
    const result = determineInitialProposalState({
      kind: 'emenda',
      ci: {
        conflito: true,
        constitucional: true,
      },
    });

    assert.equal(result.status, 'aberto');
    assert.equal(result.transition.key, 'initial_to_open');
    assert.equal(resolveProposalWorkflowStage(result.status), 'votacao');
  });

  it('starts in review when institutional checks block immediate voting', () => {
    const result = determineInitialProposalState({
      kind: 'emenda',
      ci: {
        conflito: false,
        constitucional: true,
      },
    });

    assert.equal(result.status, 'em-revisao');
    assert.equal(result.transition.key, 'initial_to_review');
  });

  it('resolves lifecycle transitions explicitly for approval and review expiry', () => {
    const approvedTransition = resolveProposalLifecycleTransition({
      proposal: {
        status: 'aberto',
        quorum: 2,
      },
      tally: {
        favor: 2.2,
        contra: 0,
        total: 2.2,
      },
      deadlineReached: false,
    });

    const expiredReviewTransition = resolveProposalLifecycleTransition({
      proposal: {
        status: 'em-revisao',
        quorum: 2,
      },
      tally: {
        favor: 0,
        contra: 0,
        total: 0,
      },
      deadlineReached: true,
    });

    assert.equal(approvedTransition?.key, 'vote_approved');
    assert.equal(expiredReviewTransition?.key, 'review_expired');
    assert.equal(expiredReviewTransition?.resolutionReason, 'bloqueio_ci');
  });

  it('publishes a machine catalog with statuses and transitions', () => {
    const machine = listProposalStateMachine();

    assert.ok(machine.statuses.some((status) => status.status === 'aberto'));
    assert.ok(machine.transitions.some((transition) => transition.key === 'vote_rejected_quorum'));
  });
});

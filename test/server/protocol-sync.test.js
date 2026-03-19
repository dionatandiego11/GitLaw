import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { replayVotingEndsAt } from '../../packages/infrastructure/src/protocol-sync.js';

describe('protocol replay voting deadline', () => {
  it('preserves a meaningful replay window when the chain clock is ahead of the local clock', () => {
    const wallClockTimestamp = Math.floor(new Date('2026-03-19T17:00:00Z').getTime() / 1000);
    const chainTimestamp = Math.floor(new Date('2026-04-02T17:00:01Z').getTime() / 1000);
    const proposal = {
      status: 'aberto',
      votingEndsAt: '2026-04-02T17:00:00Z',
      votes: [],
    };

    const replayEndsAt = replayVotingEndsAt(proposal, {
      chainTimestamp,
      wallClockTimestamp,
    });

    assert.ok(
      replayEndsAt >= chainTimestamp + (13 * 24 * 60 * 60),
      'open proposals should not collapse to a near-immediate deadline when the chain clock has advanced',
    );
  });

  it('keeps a minimum buffer to replay votes before finalizing a proposal already resolved locally', () => {
    const chainTimestamp = Math.floor(new Date('2026-04-02T17:00:01Z').getTime() / 1000);
    const proposal = {
      status: 'aprovado',
      votingEndsAt: '2026-04-02T17:00:00Z',
      votes: [{}, {}],
    };

    const replayEndsAt = replayVotingEndsAt(proposal, {
      chainTimestamp,
      wallClockTimestamp: Math.floor(new Date('2026-03-19T17:00:00Z').getTime() / 1000),
    });

    assert.ok(
      replayEndsAt >= chainTimestamp + 120,
      'finalized proposals should retain a replay buffer large enough to anchor historical votes before on-chain finalization',
    );
  });
});

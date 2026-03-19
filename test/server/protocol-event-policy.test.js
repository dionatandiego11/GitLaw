import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getProtocolEventPolicy,
  listProtocolEventPolicies,
  shouldAnchorEventOnChain,
} from '../../packages/infrastructure/src/index.js';

describe('protocol event policy', () => {
  it('marks citizenship, voting and territorial variation as on-chain critical events', () => {
    assert.equal(getProtocolEventPolicy('CitizenIssued')?.taskType, 'citizen_mint');
    assert.equal(getProtocolEventPolicy('VoteCast')?.taskType, 'proposal_vote');
    assert.equal(getProtocolEventPolicy('LocalVariationOpened')?.taskType, 'fork_open');
    assert.equal(shouldAnchorEventOnChain('CitizenIssued'), true);
    assert.equal(shouldAnchorEventOnChain('LocalVariationOpened'), true);
  });

  it('keeps comments and session authentication off-chain', () => {
    assert.equal(getProtocolEventPolicy('CommentAdded')?.executionLayer, 'off-chain');
    assert.equal(getProtocolEventPolicy('SessionAuthenticated')?.executionLayer, 'off-chain');
    assert.equal(shouldAnchorEventOnChain('CommentAdded'), false);
  });

  it('publishes a readable catalog of protocol policies', () => {
    const policies = listProtocolEventPolicies();

    assert.ok(policies.some((policy) => policy.eventType === 'ProposalApproved'));
    assert.ok(policies.some((policy) => policy.eventType === 'ActivitiesMarkedRead'));
  });
});

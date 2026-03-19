import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Wallet } from 'ethers';

import {
  connectDemoSession,
  issueWalletChallenge,
  readAuthenticatedSession,
  verifyWalletSession,
} from '../../packages/application/src/index.js';
import { seedStore } from '../../packages/infrastructure/src/index.js';

const SESSION_SECRET = 'gitlaw-test-secret';

function cloneStore() {
  return JSON.parse(JSON.stringify(seedStore));
}

describe('session auth', () => {
  it('creates a signed demo session token that can be verified later', () => {
    const store = cloneStore();
    const session = connectDemoSession(SESSION_SECRET, store);
    const decoded = readAuthenticatedSession(SESSION_SECRET, session.sessionToken);

    assert.equal(session.authenticated, true);
    assert.equal(session.authMethod, 'demo');
    assert.ok(session.sessionToken.length > 20);
    assert.equal(decoded?.address, session.address);
    assert.equal(decoded?.authMethod, 'demo');
  });

  it('verifies a wallet signature against the issued challenge', async () => {
    const store = cloneStore();
    const wallet = Wallet.createRandom();
    const challenge = issueWalletChallenge({ address: wallet.address });
    const signature = await wallet.signMessage(challenge.message);
    const session = verifyWalletSession(SESSION_SECRET, store, {
      address: wallet.address,
      signature,
    });

    assert.equal(session.address, wallet.address);
    assert.equal(session.authenticated, true);
    assert.equal(session.authMethod, 'wallet');
    assert.ok(
      store.events.some(
        (event) =>
          event.type === 'SessionAuthenticated' &&
          event.actorAddress === wallet.address,
      ),
    );
  });
});

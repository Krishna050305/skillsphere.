import assert from 'assert';
import { transition, ALLOWED_TRANSITIONS } from './escrow.service.js';

// Mock Mongoose Payment document
const createMockPayment = (initialState) => {
  return {
    state: initialState,
    stateHistory: [],
    save: async function () {
      return this; // mock Mongoose save behavior
    },
  };
};

async function runTests() {
  console.log('Running Escrow Service State Machine Unit Tests...');

  const actorId = '507f1f77bcf86cd799439011'; // Mock ObjectId

  // 1. Test Allowed Transitions
  for (const [fromState, toStates] of Object.entries(ALLOWED_TRANSITIONS)) {
    for (const toState of toStates) {
      const payment = createMockPayment(fromState);
      const updated = await transition(payment, toState, actorId);

      assert.strictEqual(
        updated.state,
        toState,
        `Expected transition from '${fromState}' to '${toState}' to succeed.`
      );
      assert.strictEqual(
        updated.stateHistory.length,
        1,
        'Expected stateHistory to have exactly 1 record appended.'
      );
      assert.strictEqual(
        updated.stateHistory[0].state,
        toState,
        `Expected stateHistory record state to equal '${toState}'.`
      );
      assert.strictEqual(
        updated.stateHistory[0].by,
        actorId,
        `Expected stateHistory record 'by' field to equal actorId.`
      );
      assert.ok(
        updated.stateHistory[0].at instanceof Date,
        'Expected stateHistory record to have a timestamp Date object.'
      );
    }
  }
  console.log('✓ SUCCESS: All allowed transitions completed successfully and recorded history.');

  // 2. Test Disallowed Transitions (Verify state machine boundary enforcement)
  const allStates = Object.keys(ALLOWED_TRANSITIONS);
  for (const fromState of allStates) {
    const allowed = ALLOWED_TRANSITIONS[fromState];
    // Filter down to states that are not allowed from the current state
    const disallowed = allStates.filter((s) => !allowed.includes(s));

    for (const toState of disallowed) {
      const payment = createMockPayment(fromState);
      await assert.rejects(
        transition(payment, toState, actorId),
        new RegExp(`Cannot move payment from ${fromState} to ${toState}`),
        `Expected transition from '${fromState}' to '${toState}' to be rejected.`
      );
    }
  }
  console.log('✓ SUCCESS: All disallowed transitions correctly blocked and threw errors.');
  console.log('🎉 Escrow State Machine Unit Tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test suite execution failed:', err);
  process.exit(1);
});

export const ALLOWED_TRANSITIONS = {
  created: ['funded'],
  funded: ['in_progress', 'refunded'],
  in_progress: ['submitted_for_review', 'disputed'],
  submitted_for_review: ['released', 'disputed'],
  disputed: ['released', 'refunded'],
  released: [],
  refunded: []
};

/**
 * Transitions a payment to a new state if allowed by the state machine.
 * Appends the action to the payment's stateHistory and persists it.
 *
 * @param {Object} payment - Mongoose Payment document
 * @param {string} toState - Target state to transition to
 * @param {string} actorUserId - User ID of the actor initiating the state change
 * @returns {Promise<Object>} Updated payment document
 */
export async function transition(payment, toState, actorUserId) {
  const allowed = ALLOWED_TRANSITIONS[payment.state] || [];
  if (!allowed.includes(toState)) {
    throw new Error(`Cannot move payment from ${payment.state} to ${toState}`);
  }
  payment.stateHistory.push({ state: toState, at: new Date(), by: actorUserId });
  payment.state = toState;
  return payment.save();
}

export default {
  transition,
  ALLOWED_TRANSITIONS
};

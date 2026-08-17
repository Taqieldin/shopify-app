import { describe, it, expect } from 'vitest';
import { TransferStateMachine } from '../../server/domains/transfer/transfer.state-machine.js';
import { InvalidStateTransitionError } from '../../server/shared/errors/index.js';

describe('TransferStateMachine', () => {
  it('allows valid state transitions', () => {
    expect(() => TransferStateMachine.validateTransition('DRAFT', 'PENDING')).not.toThrow();
    expect(() => TransferStateMachine.validateTransition('PENDING', 'ACCEPTED')).not.toThrow();
    expect(() => TransferStateMachine.validateTransition('ACCEPTED', 'COMPLETED')).not.toThrow();
    expect(() => TransferStateMachine.validateTransition('PENDING', 'CANCELLED')).not.toThrow();
  });

  it('rejects invalid state transitions from terminal states', () => {
    expect(() => TransferStateMachine.validateTransition('COMPLETED', 'PENDING')).toThrow(
      InvalidStateTransitionError
    );
    expect(() => TransferStateMachine.validateTransition('CANCELLED', 'ACCEPTED')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('correctly evaluates expired transfers', () => {
    const expiredTransfer = {
      status: 'PENDING',
      expires_at: new Date(Date.now() - 1000 * 60), // 1 minute in the past
    };
    const validTransfer = {
      status: 'PENDING',
      expires_at: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
    };

    expect(TransferStateMachine.isExpired(expiredTransfer)).toBe(true);
    expect(TransferStateMachine.isExpired(validTransfer)).toBe(false);
  });
});

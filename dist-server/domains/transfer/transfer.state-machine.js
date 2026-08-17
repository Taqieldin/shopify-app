import { InvalidStateTransitionError } from '../../shared/errors/index.js';
export class TransferStateMachine {
    static ALLOWED_TRANSITIONS = {
        DRAFT: ['PENDING', 'CANCELLED'],
        PENDING: ['ACCEPTED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'REVOKED'],
        ACCEPTED: ['COMPLETED', 'REVOKED'],
        COMPLETED: [], // Terminal
        EXPIRED: [], // Terminal
        CANCELLED: [], // Terminal
        REJECTED: [], // Terminal
        REVOKED: [], // Terminal
    };
    /**
     * Validate if transition from currentState to nextState is permitted
     */
    static validateTransition(currentState, nextState) {
        const allowed = this.ALLOWED_TRANSITIONS[currentState] || [];
        if (!allowed.includes(nextState)) {
            throw new InvalidStateTransitionError(currentState, nextState, 'OwnershipTransfer');
        }
    }
    /**
     * Check if an active transfer has passed its expiration deadline
     */
    static isExpired(transfer) {
        return transfer.status === 'PENDING' && new Date() > new Date(transfer.expires_at);
    }
}

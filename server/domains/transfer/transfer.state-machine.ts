import { InvalidStateTransitionError } from '../../shared/errors/index.js';
import { TransferStatus } from '../../shared/types/index.js';

export class TransferStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['ACCEPTED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'REVOKED'],
    ACCEPTED: ['COMPLETED', 'REVOKED'],
    COMPLETED: [], // Terminal
    EXPIRED: [],   // Terminal
    CANCELLED: [], // Terminal
    REJECTED: [],  // Terminal
    REVOKED: [],   // Terminal
  };

  /**
   * Validate if transition from currentState to nextState is permitted
   */
  static validateTransition(currentState: TransferStatus, nextState: TransferStatus): void {
    const allowed = this.ALLOWED_TRANSITIONS[currentState] || [];
    if (!allowed.includes(nextState)) {
      throw new InvalidStateTransitionError(currentState, nextState, 'OwnershipTransfer');
    }
  }

  /**
   * Check if an active transfer has passed its expiration deadline
   */
  static isExpired(transfer: { status: string; expires_at: Date }): boolean {
    return transfer.status === 'PENDING' && new Date() > new Date(transfer.expires_at);
  }
}

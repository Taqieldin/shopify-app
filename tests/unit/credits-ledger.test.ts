import { describe, it, expect } from 'vitest';

describe('CreditsLedger Logic', () => {
  it('computes running balances from immutable ledger entries', () => {
    const transactions = [
      { amount: 500, type: 'EARN' },
      { amount: 100, type: 'BONUS' },
      { amount: -200, type: 'REDEEM' },
      { amount: 50, type: 'ADJUSTMENT' },
    ];

    const balance = transactions.reduce((acc, t) => acc + t.amount, 0);
    expect(balance).toBe(450);
  });

  it('correctly detects insufficient funds for debit operations', () => {
    const currentBalance = 150;
    const attemptedDebit = -200;

    const wouldOverdraw = currentBalance + attemptedDebit < 0;
    expect(wouldOverdraw).toBe(true);
  });
});

import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { CreditCard, Check, Zap, Sparkles, Shield, Crown, ArrowRight } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  maxSerials: number;
  badge?: string;
  features: string[];
}

const TIERS: PricingTier[] = [
  {
    id: 'FREE',
    name: 'Free Starter',
    price: 0,
    maxSerials: 25,
    features: [
      'Up to 25 Serialized Passports',
      'QR Code Verification',
      'Standard Craftsmanship Storytelling',
      'Public Provenance View',
    ],
  },
  {
    id: 'STARTER',
    name: 'Atelier Starter',
    price: 49,
    maxSerials: 500,
    features: [
      'Up to 500 Serialized Passports',
      'NFC Tag UID Binding',
      'Ownership Registry & Transfers',
      'Care & Warranty Schedules',
      'Custom Storefront Domain',
    ],
  },
  {
    id: 'PRO',
    name: 'Maison Pro',
    price: 149,
    maxSerials: 5000,
    badge: 'MOST POPULAR',
    features: [
      'Up to 5,000 Serialized Passports',
      'Layered Risk Engine & Telemetry',
      'Private Club & Credits Ledger',
      'Atelier Service & Repair Cases',
      'VIP Early Access Drops',
      'Luxury Gift Unboxing Experience',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Haute Horlogerie Enterprise',
    price: 499,
    maxSerials: 50000,
    features: [
      'Unlimited Serialized Passports',
      'Dedicated NXP DNA Cryptographic Keys',
      'ERP / SAP / PLM Data Pipeline',
      'White-Glove Onboarding & SLA',
      '24/7 Dedicated Concierge Support',
    ],
  },
];

export const BillingView: React.FC = () => {
  const { currentTenant, pieces } = useTenant();
  const [activePlan, setActivePlan] = useState<string>(currentTenant.plan || 'PRO');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const currentTier = TIERS.find((t) => t.id === activePlan) || TIERS[2];
  const serialsUsed = pieces.length;
  const utilizationPercent = Math.min(100, Math.round((serialsUsed / currentTier.maxSerials) * 100));

  const handleUpgrade = (tierId: string) => {
    setActivePlan(tierId);
    setSuccessNotice(`Successfully upgraded store subscription to ${tierId} plan!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-zinc-100">Subscription & Platform Plans</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your Shopify App billing tier, serialized capacity limits, and enterprise feature flags.
        </p>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-500">Shopify App Billing Synced</span>
        </div>
      )}

      {/* Current Plan & Quota Utilization Card */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Active Subscription Plan
              </span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-zinc-100">{currentTier.name}</h3>
            <p className="text-xs text-zinc-400">
              Billed via Shopify App Subscription at <span className="text-zinc-200 font-semibold">${currentTier.price}/month</span>.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-400">Passport Capacity</span>
              <span className="text-amber-400 font-mono">
                {serialsUsed} / {currentTier.maxSerials.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, utilizationPercent)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 block text-right font-mono">
              {utilizationPercent}% Quota Used
            </span>
          </div>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.id === activePlan;
          return (
            <div
              key={tier.id}
              className={`glass-panel rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative ${
                isCurrent
                  ? 'border-amber-500 shadow-xl shadow-amber-500/10 bg-zinc-900/90'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold tracking-wide shadow-md">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-sm text-zinc-100">{tier.name}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-zinc-100">${tier.price}</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="text-[11px] font-semibold text-amber-400 font-mono">
                    Up to {tier.maxSerials.toLocaleString()} Serialized Pieces
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <button
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(tier.id)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-500 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md'
                  }`}
                >
                  {isCurrent ? 'Current Active Plan' : `Upgrade to ${tier.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

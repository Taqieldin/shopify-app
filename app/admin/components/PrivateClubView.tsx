import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Crown, Sparkles, Award, Gift, Plus, CheckCircle, ShieldCheck } from 'lucide-react';

export const PrivateClubView: React.FC = () => {
  const { currentTenant } = useTenant();
  const tiers = currentTenant.settings.membership_terms;

  const [benefits, setBenefits] = useState([
    {
      id: 'b-1',
      title: 'Annual Complimentary Atelier Spa',
      tier: tiers[1] || 'Atelier Privilège',
      type: 'COMPLIMENTARY_CARE',
      description: 'Comprehensive inspection, edge seal refreshment, and organic wax nourishment.',
    },
    {
      id: 'b-2',
      title: 'Private Runway & Salon Showcase Preview',
      tier: tiers[1] || 'Atelier Privilège',
      type: 'PRIVATE_EVENT',
      description: 'Front-row reservation for bi-annual seasonal collection reveals.',
    },
    {
      id: 'b-3',
      title: 'Bespoke Concierge & Priority Restoration',
      tier: tiers[2] || 'Cercle d’Or',
      type: 'PRIORITY_SERVICE',
      description: 'Direct communication with Head of Atelier and express repair turnaround.',
    },
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">{currentTenant.settings.club_name} Experience</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure luxury membership tiers, collector privileges, and private relationship milestones.
          </p>
        </div>
      </div>

      {/* Membership Tiers Cards */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Configured Membership Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tierName, index) => (
            <div
              key={index}
              className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-amber-500/40 transition relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Level {index + 1}</span>
                  <Crown
                    className={`w-4 h-4 ${
                      index === 2 ? 'text-amber-400' : index === 1 ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  />
                </div>
                <h4 className="font-serif font-bold text-base text-zinc-100">{tierName}</h4>
                <p className="text-xs text-zinc-400">
                  {index === 0
                    ? 'Entry milestone upon registering first verified digital product passport.'
                    : index === 1
                    ? 'Elevated collector tier with complimentary atelier care and early previews.'
                    : 'Prestige invitation tier for distinguished patrons with bespoke releases.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Eligibility:</span>
                <span className="font-medium text-amber-300">
                  {index === 0 ? '1+ Pieces Owned' : index === 1 ? '2+ Pieces / $2,500' : '4+ Pieces / $5,000'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Collector Privileges</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <div key={b.id} className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs text-zinc-100">{b.title}</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {b.tier}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

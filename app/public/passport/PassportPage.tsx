import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  ShieldCheck,
  Award,
  Sparkles,
  QrCode,
  Tag,
  Wrench,
  Clock,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const PassportPage: React.FC<{ serial: string; onBackToAdmin?: () => void }> = ({
  serial,
  onBackToAdmin,
}) => {
  const { currentTenant, pieces, passports, serviceCases, initiateTransfer, acceptTransfer } = useTenant();

  const piece = pieces.find((p) => p.serial === serial) || pieces[0];
  const passport = passports.find((p) => p.serial === piece?.serial) || passports[0];
  const services = serviceCases.filter((s) => s.serial === piece?.serial);

  const [activeTab, setActiveTab] = useState<'story' | 'craft' | 'materials' | 'care' | 'provenance'>('story');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [transferGeneratedToken, setTransferGeneratedToken] = useState<string | null>(null);

  // Accept Transfer Modal State
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptToken, setAcceptToken] = useState('');
  const [acceptName, setAcceptName] = useState('');
  const [acceptEmail, setAcceptEmail] = useState('');
  const [acceptedCertNumber, setAcceptedCertNumber] = useState<string | null>(null);

  if (!piece || !passport) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <ShieldCheck className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-xl font-serif">Digital Identity Not Found</h2>
          <p className="text-xs text-zinc-400">
            We were unable to retrieve the digital product passport for serial number: {serial}.
          </p>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-200"
            >
              Return to Admin Console
            </button>
          )}
        </div>
      </div>
    );
  }

  const isStolen = piece.status === 'STOLEN' || piece.status === 'LOST';

  const handleStartTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await initiateTransfer(piece.serial, recipientEmail, 'Designated Recipient');
    setTransferGeneratedToken(token);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-amber-500/20 selection:text-amber-300">
      {/* Editorial Topbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
        </div>

        <div className="text-center">
          <span className="font-serif tracking-widest uppercase font-bold text-xs text-zinc-200">
            {currentTenant.settings.brand_name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>{currentTenant.settings.passport_term}</span>
        </div>
      </header>

      {/* Hero Showcase */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Verification Status Pill */}
        <div className="flex justify-center mb-6">
          {isStolen ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold shadow-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Verification Notice — Contact Maison Atelier</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-xl">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="tracking-wide">Verified Digital Product Identity</span>
            </div>
          )}
        </div>

        {/* Product Imagery */}
        <div className="relative rounded-2xl overflow-hidden glass-panel border border-zinc-800 shadow-2xl group">
          <div className="aspect-[16/10] sm:aspect-[21/10] w-full bg-zinc-900 overflow-hidden">
            <img
              src={passport.hero_image}
              alt={passport.title}
              className="w-full h-full object-cover group-hover:scale-102 transition duration-700"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 pointer-events-auto">
            <div>
              <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                Serial No. {piece.serial}
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-zinc-100 mt-0.5">
                {passport.title}
              </h1>
            </div>

            {piece.edition_number && piece.edition_total && (
              <div className="bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-mono text-zinc-300">
                Edition {piece.edition_number} of {piece.edition_total}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto py-6 mt-4 border-b border-zinc-800/80 no-scrollbar">
          {[
            { id: 'story', label: 'The Piece' },
            { id: 'craft', label: 'Art of Craft' },
            { id: 'materials', label: 'Materials & Origin' },
            { id: 'care', label: 'Care & Longevity' },
            { id: 'provenance', label: 'Provenance & Ownership' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="mt-8 space-y-6">
          {/* 1. The Piece */}
          {activeTab === 'story' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="font-serif text-lg font-bold text-zinc-100">Product Specification</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{passport.description}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{passport.heritage_story}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Manufacturing Provenance</span>
                    <span className="text-zinc-200 font-medium">{piece.manufacturing_location}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Date of Creation</span>
                    <span className="text-zinc-200 font-medium">{piece.manufacturing_date}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Color & Finish</span>
                    <span className="text-zinc-200 font-medium">{piece.color}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Dimensions</span>
                    <span className="text-zinc-200 font-medium">{piece.dimensions}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">NFC Hardware Spec</span>
                    <span className="text-emerald-400 font-mono text-[11px]">NXP NTAG 424 DNA Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Art of Craft */}
          {activeTab === 'craft' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-serif text-lg font-bold text-zinc-100">Master Savoir-Faire</h3>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{passport.craft_info}</p>
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                  <div className="font-semibold text-zinc-200">Individually Hallmarked</div>
                  <p>
                    Each piece undergoes rigorous bench inspection before receiving its permanent cryptographic tag and engraved edition hallmark.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Materials */}
          {activeTab === 'materials' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="font-serif text-lg font-bold text-zinc-100">Ethical Material Origins & Traceability</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{passport.materials_summary}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{passport.sustainability_data}</p>

                <div className="space-y-2 pt-2">
                  {piece.materials.map((mat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs flex items-center justify-between"
                    >
                      <span className="text-zinc-200 font-medium">{mat.name}</span>
                      <span className="text-zinc-400 text-[11px]">{mat.origin} {mat.certification && `• ${mat.certification}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Care */}
          {activeTab === 'care' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-zinc-100">Care Guidelines & Verified Service</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    10-Year Warranty Active
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1">
                    <span className="font-semibold text-amber-300">Recommended Annual Maintenance:</span>
                    <p className="text-zinc-300">
                      Store in the provided breathable dust cover away from direct sunlight. Complimentary annual atelier cleaning available to active club members.
                    </p>
                  </div>

                  {services.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                        Verified Atelier Service Record
                      </span>
                      {services.map((srv) => (
                        <div key={srv.id} className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-medium text-zinc-200">{srv.service_type}</div>
                            <div className="text-[11px] text-zinc-400 italic">"{srv.customer_notes}"</div>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-400 font-semibold">{srv.completed_date || srv.received_date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Provenance & Ownership */}
          {activeTab === 'provenance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-zinc-100">Ownership & Provenance Record</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Immutable history secured in {currentTenant.settings.brand_name} digital registry.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAcceptModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Accept Transfer Invitation</span>
                    </button>

                    {!isStolen && piece.status === 'REGISTERED' && (
                      <button
                        onClick={() => setShowTransferModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-md"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Transfer Ownership</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">Current Registry Status</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" /> Active Registered Collector
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 text-[11px] block">Protected Identity</span>
                      <span className="text-zinc-400 text-[11px] font-mono">[Privacy Shielded]</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-zinc-100">Transfer Digital Ownership</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            {!transferGeneratedToken ? (
              <form onSubmit={handleStartTransfer} className="space-y-3 text-xs">
                <p className="text-zinc-400">
                  Transfer the digital product passport and lifetime provenance record of{' '}
                  <span className="font-mono text-amber-400 font-bold">{piece.serial}</span> to a new recipient.
                </p>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="new.owner@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                  >
                    Generate Secure Transfer Token
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800 text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Transfer Invitation Created
                  </div>
                  <p className="text-[11px] mt-1 text-emerald-400/90">
                    A single-use transfer token has been issued for {recipientEmail}.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-amber-400 break-all">
                  {transferGeneratedToken}
                </div>

                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferGeneratedToken(null);
                    setRecipientEmail('');
                  }}
                  className="w-full py-2 rounded-lg bg-zinc-800 text-zinc-200 font-semibold hover:bg-zinc-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept Transfer Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-serif font-bold text-base text-zinc-100">Accept Ownership Transfer</h3>
              </div>
              <button onClick={() => setShowAcceptModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            {!acceptedCertNumber ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  acceptTransfer(acceptToken, acceptEmail, acceptName);
                  setAcceptedCertNumber(`CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`);
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-zinc-400">
                  Claim verified digital ownership of <span className="font-mono text-amber-400 font-bold">{piece.serial}</span>.
                </p>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Transfer Invitation Token</label>
                  <input
                    type="text"
                    required
                    value={acceptToken}
                    onChange={(e) => setAcceptToken(e.target.value)}
                    className="w-full bg-zinc-950 font-mono border border-zinc-800 rounded-lg p-2.5 text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={acceptName}
                    onChange={(e) => setAcceptName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Your Email Address</label>
                  <input
                    type="email"
                    required
                    value={acceptEmail}
                    onChange={(e) => setAcceptEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAcceptModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold"
                  >
                    Accept & Issue Certificate
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <Check className="w-4 h-4" /> Ownership Successfully Transferred!
                  </div>
                  <p className="text-[11px] text-emerald-400/90">
                    Piece {piece.serial} is now registered to {acceptEmail}.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] space-y-1">
                  <span className="text-zinc-500">Ownership Transfer Certificate:</span>
                  <span className="font-mono text-amber-400 font-bold block">{acceptedCertNumber}</span>
                </div>

                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setAcceptedCertNumber(null);
                  }}
                  className="w-full py-2 rounded-lg bg-zinc-800 text-zinc-200 font-semibold hover:bg-zinc-700"
                >
                  Return to Digital Passport
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

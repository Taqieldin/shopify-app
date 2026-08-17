import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  QrCode,
  Plus,
  Search,
  ExternalLink,
  Eye,
  Download,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Award,
  Printer,
} from 'lucide-react';

export const PassportsView: React.FC<{ onPreviewPassport: (serial: string) => void }> = ({
  onPreviewPassport,
}) => {
  const { currentTenant, passports, pieces, createPieceAndPassport } = useTenant();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [selectedQrSerial, setSelectedQrSerial] = useState<string | null>(null);
  const [showCertSerial, setShowCertSerial] = useState<string | null>(null);

  // Form State for new passport
  const [formData, setFormData] = useState({
    title: '',
    product_title: '',
    serial: '',
    edition_number: 1,
    edition_total: 50,
    materials_summary: 'Full-Grain Leather with Precious Alloy Hardware',
    craft_info: 'Handcrafted by master artisans with traditional techniques.',
    heritage_story: 'Rooted in heritage savoir-faire and architectural restraint.',
    sustainability_data: '100% Traceable European Raw Materials.',
  });

  const filteredPassports = passports.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.serial.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPieceAndPassport(
      {
        serial: formData.serial,
        product_title: formData.product_title || formData.title,
        edition_number: Number(formData.edition_number),
        edition_total: Number(formData.edition_total),
      },
      {
        title: formData.title,
        craft_info: formData.craft_info,
        heritage_story: formData.heritage_story,
        materials_summary: formData.materials_summary,
        sustainability_data: formData.sustainability_data,
      }
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            {currentTenant.settings.passport_term} Registry
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage persistent digital identities and certificates for {currentTenant.settings.brand_name} products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              const autoSerial = `${currentTenant.id.includes('aurelia') ? 'AUR' : 'VNG'}-2026-${Math.floor(
                100000 + Math.random() * 900000
              )}`;
              setFormData({
                ...formData,
                serial: autoSerial,
                title: `${currentTenant.settings.brand_name} Masterpiece Edition`,
                product_title: `${currentTenant.settings.brand_name} Handcrafted Piece`,
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create {currentTenant.settings.passport_term}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search ${currentTenant.settings.passport_term} by title or serial number...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Passports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPassports.map((passport) => {
          const piece = pieces.find((p) => p.serial === passport.serial);
          return (
            <div
              key={passport.id}
              className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition group"
            >
              <div>
                <div className="relative h-48 bg-zinc-900 overflow-hidden">
                  <img
                    src={passport.hero_image}
                    alt={passport.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-700/60 text-[10px] font-mono font-medium text-amber-300">
                    {passport.serial}
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1">{passport.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{passport.description}</p>

                  <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Edition: {piece?.edition_number ? `${piece.edition_number}/${piece.edition_total}` : 'Unique Piece'}</span>
                    <span>{passport.view_count} Public Views</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  onClick={() => onPreviewPassport(passport.serial)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </button>

                <button
                  onClick={() => setShowCertSerial(passport.serial)}
                  className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 text-xs transition border border-zinc-700"
                  title="View Certificate of Authenticity"
                >
                  <Award className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedQrSerial(passport.serial)}
                  className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs transition border border-zinc-700"
                  title="View Passport QR & NFC Payload"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Passport Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-zinc-100">
                Create {currentTenant.settings.passport_term}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.product_title}
                    onChange={(e) => setFormData({ ...formData, product_title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Generated Serial Number</label>
                  <input
                    type="text"
                    required
                    value={formData.serial}
                    onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                    className="w-full bg-zinc-950 font-mono border border-zinc-800 rounded-lg p-2 text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Passport Display Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Edition Number</label>
                  <input
                    type="number"
                    value={formData.edition_number}
                    onChange={(e) => setFormData({ ...formData, edition_number: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Edition Total</label>
                  <input
                    type="number"
                    value={formData.edition_total}
                    onChange={(e) => setFormData({ ...formData, edition_total: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Materials Specification</label>
                <input
                  type="text"
                  value={formData.materials_summary}
                  onChange={(e) => setFormData({ ...formData, materials_summary: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Craftsmanship & Atelier Techniques</label>
                <textarea
                  rows={2}
                  value={formData.craft_info}
                  onChange={(e) => setFormData({ ...formData, craft_info: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Heritage & Savoir-Faire Story</label>
                <textarea
                  rows={2}
                  value={formData.heritage_story}
                  onChange={(e) => setFormData({ ...formData, heritage_story: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400"
                >
                  Publish Passport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {selectedQrSerial && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="font-semibold text-xs text-zinc-200">Passport QR & NFC Tag</span>
              <button onClick={() => setSelectedQrSerial(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block mx-auto shadow-inner">
              {/* QR representation */}
              <div className="w-44 h-44 bg-zinc-100 flex items-center justify-center border-2 border-zinc-900 text-zinc-950 font-mono text-[10px] p-3 text-center leading-tight">
                [QR PAYLOAD]
                <br />
                https://{currentTenant.shop_domain}/passport/{selectedQrSerial}
              </div>
            </div>

            <div className="text-left bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] space-y-1">
              <div className="text-zinc-400">
                Serial: <span className="font-mono text-amber-400">{selectedQrSerial}</span>
              </div>
              <div className="text-zinc-400">
                Resolver URI: <span className="font-mono text-zinc-300">/passport/{selectedQrSerial}</span>
              </div>
              <div className="text-zinc-400">
                NFC Tag Standard: <span className="text-emerald-400 font-semibold">NXP NTAG 424 DNA Ready</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedQrSerial(null)}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CSV Batch Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Batch CSV Passport Import</h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Stream large serial numbers and passport batches without blocking memory. Supported format: <code className="text-amber-300">serial, title, edition, materials, location</code>.
            </p>

            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center text-xs text-zinc-400 hover:border-amber-500/50 transition cursor-pointer">
              <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <span className="font-semibold text-zinc-300">Click to upload CSV</span> or drag and drop file here
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate of Authenticity Luxury Modal */}
      {showCertSerial && (
        <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative overflow-hidden text-center animate-fade-in">
            {/* Background luxury watermark glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="font-serif tracking-widest uppercase font-bold text-xs text-amber-300">
                  {currentTenant.settings.brand_name} Official Hallmark
                </span>
              </div>
              <button onClick={() => setShowCertSerial(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 tracking-wide">
                Certificate of Authenticity
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Permanent cryptographic identity verified in {currentTenant.settings.brand_name} Atelier registry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-zinc-500">Serial Number:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{showCertSerial}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-zinc-500">Registry Status:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated Original
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-zinc-500">Certificate Number:</span>
                <span className="font-mono text-zinc-300">CERT-2026-AUR-{(Math.random() * 9000 + 1000).toFixed(0)}</span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-zinc-500 block mb-0.5">SHA-256 Verification Stamp:</span>
                <span className="font-mono text-[9px] text-zinc-400 break-all bg-zinc-900 p-1.5 rounded block">
                  0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCertSerial(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

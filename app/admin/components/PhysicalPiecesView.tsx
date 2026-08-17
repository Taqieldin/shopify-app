import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Tag, Search, ShieldCheck, UserCheck, QrCode, UploadCloud, Download, Plus, Check, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

export const PhysicalPiecesView: React.FC = () => {
  const { currentTenant, pieces, createPieceAndPassport } = useTenant();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showQRModal, setShowQRModal] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvText, setCsvText] = useState('serial,product_title,category,edition_number,edition_total,...\n');
  const [csvImportResult, setCsvImportResult] = useState<string | null>(null);

  // Generate QR code when a piece is selected
  useEffect(() => {
    if (showQRModal) {
      const destinationUrl = `${window.location.origin}/passport/${showQRModal.serial}`;
      QRCode.toDataURL(destinationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#18181b',
          light: '#ffffff',
        },
      }).then(setQrDataUrl);
    }
  }, [showQRModal]);

  const handleDownloadQR = () => {
    if (!qrDataUrl || !showQRModal) return;
    const link = document.createElement('a');
    link.download = `QR-${showQRModal.serial}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleBatchImport = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;

    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2 && parts[0].trim()) {
        createPieceAndPassport(
          {
            serial: parts[0].trim(),
            product_title: parts[1].trim(),
            product_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
            edition_number: parts[2] ? Number(parts[2].trim()) : undefined,
            edition_total: parts[3] ? Number(parts[3].trim()) : undefined,
            manufacturing_location: parts[4]?.trim() || 'Paris Atelier',
            color: parts[5]?.trim() || 'Classic',
            materials: [{ name: 'Box Calfskin' }],
          },
          {
            title: `Digital Passport — ${parts[1].trim()}`,
            description: `Official digital product identity for ${parts[0].trim()}.`,
          }
        );
        count++;
      }
    }

    setCsvImportResult(`Successfully registered ${count} new serialized pieces into registry!`);
    setTimeout(() => {
      setShowCSVModal(false);
      setCsvImportResult(null);
    }, 1500);
  };

  const filteredPieces = pieces.filter((p) => {
    const matchesSearch =
      p.serial.toLowerCase().includes(search.toLowerCase()) ||
      p.product_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Physical Pieces & Serial Registry</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking individual manufactured objects, active collectors, and physical NFC chip tags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Batch Import CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search piece by serial, model or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="MANUFACTURED">Manufactured (Unregistered)</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="SERVICED">Serviced</option>
          <option value="STOLEN">Stolen / Blacklisted</option>
        </select>
      </div>

      {/* Pieces Table */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Serial Number</th>
                <th className="p-3.5">Product Model</th>
                <th className="p-3.5">Edition</th>
                <th className="p-3.5">NFC UID Tag</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5">Active Owner</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredPieces.map((piece) => (
                <tr key={piece.id} className="hover:bg-zinc-900/40 transition">
                  <td className="p-3.5 pl-5 font-mono font-semibold text-amber-400">{piece.serial}</td>
                  <td className="p-3.5 font-medium text-zinc-200">{piece.product_title}</td>
                  <td className="p-3.5 text-zinc-400">
                    {piece.edition_number ? `${piece.edition_number} / ${piece.edition_total}` : 'Standard'}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-zinc-500">{piece.nfc_uid || 'Unmapped'}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        piece.status === 'REGISTERED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : piece.status === 'STOLEN'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {piece.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {piece.active_owner ? (
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{piece.active_owner.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 italic">Unclaimed</span>
                    )}
                  </td>
                  <td className="p-3.5 pr-5 text-right">
                    <button
                      onClick={() => setShowQRModal(piece)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition"
                      title="Generate Physical QR Tag"
                    >
                      <QrCode className="w-3 h-3 text-amber-400" />
                      <span>QR Tag</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Tag Generator Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-sm text-zinc-100">Physical Tag QR Code</h3>
              <button onClick={() => setShowQRModal(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block shadow-inner mx-auto">
              {qrDataUrl && <img src={qrDataUrl} alt="Passport QR" className="w-48 h-48 mx-auto" />}
            </div>

            <div className="text-xs space-y-1">
              <span className="font-mono text-amber-400 font-bold block">{showQRModal.serial}</span>
              <p className="text-zinc-400 text-[11px]">{showQRModal.product_title}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDownloadQR}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Batch Import Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-zinc-100">Batch Import Serialized Pieces</h3>
              </div>
              <button onClick={() => setShowCSVModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-zinc-400 block">Paste CSV Data or Edit Directly:</label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-zinc-500">
                Headers: <code className="text-amber-400">serial, product_title, edition_number, edition_total, location, color</code>
              </p>
            </div>

            {csvImportResult && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{csvImportResult}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800 text-xs">
              <button
                onClick={() => setShowCSVModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchImport}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
              >
                Import Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

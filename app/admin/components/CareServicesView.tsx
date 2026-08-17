import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Wrench, Shield, Plus, CheckCircle, Clock, FileText, User } from 'lucide-react';

export const CareServicesView: React.FC = () => {
  const { currentTenant, serviceCases, pieces, createServiceCase, updateServiceStatus } = useTenant();
  const [showModal, setShowModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(pieces[0]?.serial || '');
  const [serviceType, setServiceType] = useState('Annual Leather Spa & Edge Restoration');
  const [technician, setTechnician] = useState('');
  const [internalNotes, setInternalNotes] = useState('Inspect stitching tension and edge coating resin.');
  const [customerNotes, setCustomerNotes] = useState('Your piece is undergoing master leather conditioning.');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createServiceCase({
      serial: selectedSerial,
      service_type: serviceType,
      technician_name: technician,
      internal_notes: internalNotes,
      customer_notes: customerNotes,
      warranty_covered: true,
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Care, Restoration & Warranty Service</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage atelier service tickets with strict isolation between internal technician logs and customer updates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Open Service Ticket</span>
        </button>
      </div>

      {/* Service Tickets List */}
      <div className="space-y-4">
        {serviceCases.map((srv) => (
          <div
            key={srv.id}
            className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {srv.case_number}
                  </span>
                  <h3 className="font-semibold text-sm text-zinc-100">{srv.service_type}</h3>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Serial: <span className="font-mono text-zinc-300">{srv.serial}</span> • Technician:{' '}
                  <span className="text-zinc-300">{srv.technician_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    srv.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {srv.status}
                </span>

                {srv.status !== 'COMPLETED' && (
                  <button
                    onClick={() => updateServiceStatus(srv.id, 'COMPLETED', 'Service and care completed successfully.')}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[11px] font-semibold"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>

            {/* Note Separation: Internal vs Customer Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Customer-Facing Updates
                </span>
                <p className="text-zinc-300 italic">"{srv.customer_notes}"</p>
              </div>

              <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 space-y-1">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Confidential Internal Notes (Hidden from customer)
                </span>
                <p className="text-zinc-300">{srv.internal_notes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-zinc-100">Create Atelier Service Ticket</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Select Physical Piece</label>
                <select
                  value={selectedSerial}
                  onChange={(e) => setSelectedSerial(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                >
                  {pieces.map((p) => (
                    <option key={p.id} value={p.serial}>
                      {p.serial} — {p.product_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Service Type</label>
                <input
                  type="text"
                  required
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Assigned Master Artisan / Tech</label>
                <input
                  type="text"
                  required
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Customer-Facing Note</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-red-400 font-medium mb-1">Confidential Internal Notes</label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-red-900/40 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  Create Service Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

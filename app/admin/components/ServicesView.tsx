import React, { useState, useEffect } from 'react';
import { Page, Card, TextField, Button, Badge, Box, Spinner, Text } from '@shopify/polaris';
import { Plus, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../api';

interface ServiceRecord {
  id: string;
  piece_id: string;
  service_date: string;
  service_type: string;
  notes: string | null;
  piece: { serial: string; model_name: string };
  created_at: string;
}

interface PhysicalPiece {
  id: string;
  serial: string;
  model_name: string;
}

export const ServicesView: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [pieces, setPieces] = useState<PhysicalPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ piece_id: '', service_date: '', service_type: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    const [recordsData, piecesData] = await Promise.all([
      apiFetch<ServiceRecord[]>('/api/admin/services'),
      apiFetch<PhysicalPiece[]>('/api/admin/products'),
    ]);
    if (recordsData) setRecords(recordsData);
    if (piecesData) setPieces(piecesData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await apiFetch<ServiceRecord>('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (result) {
      setSuccess('Service record added');
      setForm({ piece_id: '', service_date: '', service_type: '', notes: '' });
      setView('list');
      load();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    load();
  };

  if (view === 'create') {
    return (
      <Page title="Add Service Record" primaryAction={{ content: 'Back', onAction: () => setView('list'), icon: <ArrowLeft /> }}>
        <Card>
          <Box padding="500">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Product</label>
                <select
                  value={form.piece_id}
                  onChange={(e) => setForm((f) => ({ ...f, piece_id: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm"
                  required
                >
                  <option value="">Select a product...</option>
                  {pieces.map((p) => (
                    <option key={p.id} value={p.id}>{p.serial} — {p.model_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Service Date" type="date" value={form.service_date} onChange={(v) => setForm((f) => ({ ...f, service_date: v }))} required />
                <TextField label="Service Type" value={form.service_type} onChange={(v) => setForm((f) => ({ ...f, service_type: v }))} placeholder="Professional Care" required />
              </div>
              <TextField label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes..." multiline />
              <div className="flex gap-2 pt-2">
                <Button variant="primary" submit loading={saving}>Add Record</Button>
                <Button onClick={() => setView('list')}>Cancel</Button>
              </div>
            </form>
          </Box>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Service Records"
      primaryAction={{ content: 'Add Record', onAction: () => setView('create'), icon: <Plus /> }}
    >
      {success && <Box paddingBlockEnd="400"><Badge tone="success">{success}</Badge></Box>}

      {loading ? (
        <Box padding="800" alignment="center"><Spinner size="small" /></Box>
      ) : records.length === 0 ? (
        <Card><Box padding="800" alignment="center"><Text variant="bodyMd" tone="subdued">No service records yet</Text></Box></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-zinc-400 font-medium">Product</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Serial</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Date</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Type</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Notes</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="p-3 text-zinc-200">{r.piece.model_name}</td>
                    <td className="p-3 font-mono text-amber-400">{r.piece.serial}</td>
                    <td className="p-3 text-zinc-300">{new Date(r.service_date).toLocaleDateString()}</td>
                    <td className="p-3"><Badge>{r.service_type}</Badge></td>
                    <td className="p-3 text-zinc-400 max-w-[200px] truncate">{r.notes || '—'}</td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Page>
  );
};

import React, { useState, useEffect } from 'react';
import { Page, Card, TextField, Button, Badge, InlineStack, Text, Box, Spinner } from '@shopify/polaris';
import { Plus, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../api';

interface PhysicalPiece {
  id: string;
  serial: string;
  model_name: string;
  color: string;
  material: string;
  size: string;
  hardware: string;
  weight: string;
  manufacturing_year: number;
  purchase_date: string | null;
  warranty_until: string | null;
  service_status: string;
  authentication_status: string;
  nfc_tag_id: string | null;
  nfc_tag?: { tag_uid: string } | null;
  created_at: string;
}

const EMPTY_FORM = {
  serial: '', model_name: '', color: '', material: '', size: '', hardware: '', weight: '',
  manufacturing_year: '2026', purchase_date: '', warranty_until: '',
  service_status: 'NOT_IN_SERVICE', authentication_status: 'UNVERIFIED',
};

export const ProductsView: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [pieces, setPieces] = useState<PhysicalPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await apiFetch<PhysicalPiece[]>('/api/admin/products');
    if (data) setPieces(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = pieces.filter((p) =>
    !search || p.serial.toLowerCase().includes(search.toLowerCase()) ||
    p.model_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await apiFetch<PhysicalPiece>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (result) {
      setSuccess('Product created');
      setForm(EMPTY_FORM);
      setView('list');
      load();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (view === 'create') {
    return (
      <Page
        title="Create Product"
        primaryAction={{ content: 'Cancel', onAction: () => setView('list'), icon: <ArrowLeft /> }}
      >
        <Card>
          <Box padding="500">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Serial Number" value={form.serial} onChange={(v) => update('serial', v)} placeholder="GR-2026-000184" required />
                <TextField label="Model" value={form.model_name} onChange={(v) => update('model_name', v)} placeholder="Model 01" required />
                <TextField label="Color" value={form.color} onChange={(v) => update('color', v)} placeholder="Black" required />
                <TextField label="Material" value={form.material} onChange={(v) => update('material', v)} placeholder="Italian Leather" required />
                <TextField label="Size" value={form.size} onChange={(v) => update('size', v)} placeholder="Medium" required />
                <TextField label="Hardware" value={form.hardware} onChange={(v) => update('hardware', v)} placeholder="Brass" required />
                <TextField label="Weight" value={form.weight} onChange={(v) => update('weight', v)} placeholder="850g" required />
                <TextField label="Manufacturing Year" type="number" value={form.manufacturing_year} onChange={(v) => update('manufacturing_year', v)} required />
                <TextField label="Purchase Date" type="date" value={form.purchase_date} onChange={(v) => update('purchase_date', v)} />
                <TextField label="Warranty Until" type="date" value={form.warranty_until} onChange={(v) => update('warranty_until', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Service Status" value={form.service_status} onChange={(v) => update('service_status', v)} />
                <TextField label="Authentication Status" value={form.authentication_status} onChange={(v) => update('authentication_status', v)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="primary" submit loading={saving}>Create Product</Button>
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
      title="Products"
      primaryAction={{ content: 'Add Product', onAction: () => setView('create'), icon: <Plus /> }}
    >
      {success && <Box paddingBlockEnd="400"><Badge tone="success">{success}</Badge></Box>}

      <Box paddingBlockEnd="400">
        <TextField placeholder="Search by serial or model..." value={search} onChange={setSearch} />
      </Box>

      {loading ? (
        <Box padding="800" alignment="center"><Spinner size="small" /></Box>
      ) : filtered.length === 0 ? (
        <Card><Box padding="800" alignment="center"><Text variant="bodyMd" tone="subdued">No products found</Text></Box></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-zinc-400 font-medium">Serial</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Model</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Color</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Material</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">NFC Tag</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Auth</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Warranty</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="p-3 font-mono text-amber-400">{p.serial}</td>
                    <td className="p-3 text-zinc-200">{p.model_name}</td>
                    <td className="p-3 text-zinc-300">{p.color}</td>
                    <td className="p-3 text-zinc-300">{p.material}</td>
                    <td className="p-3">{p.nfc_tag ? <Badge tone="success">Linked</Badge> : <Badge tone="subdued">None</Badge>}</td>
                    <td className="p-3">
                      <Badge tone={p.authentication_status === 'AUTHENTIC' ? 'success' : p.authentication_status === 'FLAGGED' ? 'critical' : 'attention'}>
                        {p.authentication_status}
                      </Badge>
                    </td>
                    <td className="p-3 text-zinc-400">{p.warranty_until ? new Date(p.warranty_until).toLocaleDateString() : '—'}</td>
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

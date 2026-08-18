import React, { useState, useEffect } from 'react';
import { Page, Card, TextField, Button, Badge, Box, Spinner, Text } from '@shopify/polaris';
import { Plus, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../api';

interface NfcTag {
  id: string;
  tag_uid: string;
  tag_id: string;
  status: string;
  piece_id: string | null;
  piece?: { serial: string; model_name: string } | null;
  registered_at: string;
}

interface PhysicalPiece {
  id: string;
  serial: string;
  model_name: string;
}

export const TagsView: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'assign'>('list');
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [pieces, setPieces] = useState<PhysicalPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagUid, setTagUid] = useState('');
  const [tagId, setTagId] = useState('');
  const [assignTagId, setAssignTagId] = useState('');
  const [assignPieceId, setAssignPieceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    const [tagsData, piecesData] = await Promise.all([
      apiFetch<NfcTag[]>('/api/admin/tags'),
      apiFetch<PhysicalPiece[]>('/api/admin/products'),
    ]);
    if (tagsData) setTags(tagsData);
    if (piecesData) setPieces(piecesData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await apiFetch<NfcTag>('/api/admin/tags', {
      method: 'POST',
      body: JSON.stringify({ tag_uid: tagUid, tag_id: tagId }),
    });
    setSaving(false);
    if (result) {
      setSuccess('Tag registered');
      setTagUid('');
      setTagId('');
      setView('list');
      load();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await apiFetch<NfcTag>('/api/admin/tags/assign', {
      method: 'POST',
      body: JSON.stringify({ tag_id: assignTagId, piece_id: assignPieceId || undefined }),
    });
    setSaving(false);
    if (result) {
      setSuccess('Tag assigned');
      setAssignTagId('');
      setAssignPieceId('');
      setView('list');
      load();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
    load();
  };

  if (view === 'create') {
    return (
      <Page title="Register NFC Tag" primaryAction={{ content: 'Back', onAction: () => setView('list'), icon: <ArrowLeft /> }}>
        <Card>
          <Box padding="500">
            <form onSubmit={handleCreateTag} className="space-y-4">
              <TextField label="Tag UID (from NTAG 424 DNA)" value={tagUid} onChange={setTagUid} placeholder="04:AB:CD:EF:12:34:56" required />
              <TextField label="Tag ID (your label)" value={tagId} onChange={setTagId} placeholder="TAG_7A91X82" required />
              <div className="flex gap-2 pt-2">
                <Button variant="primary" submit loading={saving}>Register Tag</Button>
                <Button onClick={() => setView('list')}>Cancel</Button>
              </div>
            </form>
          </Box>
        </Card>
      </Page>
    );
  }

  if (view === 'assign') {
    return (
      <Page title="Assign Tag to Product" primaryAction={{ content: 'Back', onAction: () => setView('list'), icon: <ArrowLeft /> }}>
        <Card>
          <Box padding="500">
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select Tag</label>
                <select
                  value={assignTagId}
                  onChange={(e) => setAssignTagId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm"
                  required
                >
                  <option value="">Choose a tag...</option>
                  {tags.filter((t) => t.status === 'UNREGISTERED').map((t) => (
                    <option key={t.tag_id} value={t.tag_id}>{t.tag_id} ({t.tag_uid})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select Product</label>
                <select
                  value={assignPieceId}
                  onChange={(e) => setAssignPieceId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm"
                >
                  <option value="">Unassign (remove from product)</option>
                  {pieces.map((p) => (
                    <option key={p.id} value={p.id}>{p.serial} — {p.model_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="primary" submit loading={saving}>Assign Tag</Button>
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
      title="NFC Tags"
      primaryAction={{ content: 'Register Tag', onAction: () => setView('create'), icon: <Plus /> }}
    >
      <Box paddingBlockEnd="400">
        <Button onClick={() => setView('assign')}>Assign Tag to Product</Button>
      </Box>

      {success && <Box paddingBlockEnd="400"><Badge tone="success">{success}</Badge></Box>}

      {loading ? (
        <Box padding="800" alignment="center"><Spinner size="small" /></Box>
      ) : tags.length === 0 ? (
        <Card><Box padding="800" alignment="center"><Text variant="bodyMd" tone="subdued">No tags registered yet</Text></Box></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-zinc-400 font-medium">Tag ID</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Tag UID</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Assigned To</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="p-3 font-mono text-amber-400">{t.tag_id}</td>
                    <td className="p-3 font-mono text-zinc-300">{t.tag_uid}</td>
                    <td className="p-3">
                      <Badge tone={t.status === 'ACTIVE' ? 'success' : t.status === 'REVOKED' ? 'critical' : 'subdued'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-zinc-300">
                      {t.piece ? `${t.piece.serial} — ${t.piece.model_name}` : <Text variant="bodySm" tone="subdued">Unassigned</Text>}
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
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

import React, { useState, useEffect } from 'react';
import { Box, Spinner, Badge } from '@shopify/polaris';
import { ShieldCheck, Clock, Wrench } from 'lucide-react';

interface PassportData {
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
  has_service_history: boolean;
  service_count: number;
  last_service_date: string | null;
  authentication_status: string;
  tag_uid: string | null;
  services: Array<{ date: string; type: string; notes: string | null }>;
}

interface Props {
  serial: string;
}

export const ProductPassport: React.FC<Props> = ({ serial }) => {
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/passport/by-serial/${serial}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error || 'Not found');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load');
        setLoading(false);
      });
  }, [serial]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">{error || 'Product not found'}</p>
          <p className="text-zinc-600 text-sm mt-2">Serial: {serial}</p>
        </div>
      </div>
    );
  }

  const isAuthentic = data.authentication_status === 'AUTHENTIC';
  const warrantyValid = data.warranty_until && new Date(data.warranty_until) > new Date();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-serif font-bold text-lg tracking-wide">GORGERINE</span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Product Passport</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-6 space-y-6">

        <div className="text-center py-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            isAuthentic ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            {isAuthentic ? 'AUTHENTICITY VERIFIED' : data.authentication_status}
          </div>
          {isAuthentic && (
            <p className="text-zinc-500 text-xs mt-2">This piece has been registered and verified.</p>
          )}
        </div>

        <div className="border border-zinc-800 rounded-xl p-5 space-y-3 bg-zinc-900/50">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">The Piece</h2>
          <InfoRow label="Model" value={data.model_name} />
          <InfoRow label="Serial" value={data.serial} mono />
          <InfoRow label="Color" value={data.color} />
          <InfoRow label="Material" value={data.material} />
          <InfoRow label="Size" value={data.size} />
          <InfoRow label="Hardware" value={data.hardware} />
          <InfoRow label="Weight" value={data.weight} />
          <InfoRow label="Manufactured" value={String(data.manufacturing_year)} />
        </div>

        {data.purchase_date && (
          <div className="border border-zinc-800 rounded-xl p-5 space-y-3 bg-zinc-900/50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Purchase</h2>
            <InfoRow label="Purchased" value={new Date(data.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
          </div>
        )}

        {data.warranty_until && (
          <div className="border border-zinc-800 rounded-xl p-5 space-y-3 bg-zinc-900/50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Warranty</h2>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Valid until</span>
              <span className="text-zinc-200 text-sm">
                {new Date(data.warranty_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Status</span>
              <Badge tone={warrantyValid ? 'success' : 'critical'}>
                {warrantyValid ? 'Active' : 'Expired'}
              </Badge>
            </div>
          </div>
        )}

        <div className="border border-zinc-800 rounded-xl p-5 space-y-3 bg-zinc-900/50">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Care & Service</h2>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Current Status</span>
            <span className="text-zinc-200 text-sm">
              {data.service_status === 'IN_SERVICE' ? 'Currently in service' : 'Not currently in service'}
            </span>
          </div>
          {data.has_service_history && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Service History</span>
                <span className="text-zinc-200 text-sm">
                  {data.service_count} {data.service_count === 1 ? 'service' : 'services'}
                </span>
              </div>
              {data.services.length > 0 && data.services.map((s, i) => (
                <div key={i} className="border-t border-zinc-800 pt-3 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-300">{new Date(s.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                    <span className="text-zinc-500">—</span>
                    <span className="text-zinc-400">{s.type}</span>
                  </div>
                  {s.notes && <p className="text-zinc-500 text-xs mt-1 ml-5">{s.notes}</p>}
                </div>
              ))}
            </>
          )}
          {!data.has_service_history && (
            <p className="text-zinc-600 text-xs">No service history recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-center justify-between">
    <span className="text-zinc-400 text-sm">{label}</span>
    <span className={`text-zinc-200 text-sm ${mono ? 'font-mono text-amber-400' : ''}`}>{value}</span>
  </div>
);

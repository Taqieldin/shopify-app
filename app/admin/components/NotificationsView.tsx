import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { authFetch } from '../../utils/api';
import { Mail, Send, CheckCircle2, Clock, AlertCircle, Sparkles, User, Tag } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { currentTenant } = useTenant();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    authFetch('/api/admin/notifications')
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications ?? data ?? []))
      .catch(() => setNotifications([]));
  }, []);

  const filtered = notifications.filter(
    (n) => filter === 'ALL' || n.type === filter
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Customer Communications & Alerts</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Automated transactional communications, ownership invitations, and atelier care reminders.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Notification Types</option>
          <option value="PASSPORT_REGISTERED">Passport Registrations</option>
          <option value="OWNERSHIP_TRANSFERRED">Ownership Transfers</option>
          <option value="CARE_REMINDER_DUE">Care Reminders</option>
          <option value="GIFT_PRESENTED">Gift Presentations</option>
        </select>
      </div>

      {/* Notifications Table */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Dispatched Message Logs</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Queue: Active Worker</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {filtered.map((item) => (
            <div key={item.id} className="p-4 text-xs hover:bg-zinc-900/30 transition space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.type === 'PASSPORT_REGISTERED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.type === 'OWNERSHIP_TRANSFERRED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-zinc-200 font-semibold">{item.subject}</span>
                </div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-zinc-500" />
                    <span>Recipient: <span className="text-zinc-300">{item.recipient_email}</span></span>
                  </span>
                  {item.metadata && (
                    <span className="text-zinc-500 font-mono">• {item.metadata}</span>
                  )}
                </div>

                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

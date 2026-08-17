import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { FileText, Shield, User, Clock, Terminal } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { currentTenant, auditLogs } = useTenant();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-zinc-100">Immutable Compliance Audit Log</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Cryptographically recorded timeline of all sensitive administrative actions, ownership updates, and financial adjustments.
        </p>
      </div>

      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Audit Trail Records</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Status: Append-Only Immutable</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 text-xs hover:bg-zinc-900/30 transition space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {log.action}
                  </span>
                  <span className="text-zinc-300 font-medium">Target: {log.target}</span>
                </div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{log.time}</span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 flex items-center gap-4">
                <span>
                  Actor: <span className="font-mono text-zinc-300">{log.actor}</span>
                </span>
                {log.metadata && (
                  <span className="font-mono text-[10px] text-zinc-500 truncate max-w-md">
                    Metadata: {JSON.stringify(log.metadata)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

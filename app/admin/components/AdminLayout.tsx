import React from 'react';
import { Package, Nfc, Wrench } from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

const navItems = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'tags', label: 'NFC Tags', icon: Nfc },
  { id: 'services', label: 'Service Records', icon: Wrench },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onSelectTab, children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm">
            G
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide text-zinc-100">Gorgerine</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Passport Admin
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-zinc-950/40 p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

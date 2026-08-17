import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Settings, Palette, Type, ToggleLeft, ToggleRight, Check, Sparkles } from 'lucide-react';

export const BrandingSettingsView: React.FC = () => {
  const { currentTenant, updateSettings, updateFeatures } = useTenant();

  const [settingsForm, setSettingsForm] = useState(currentTenant.settings);
  const [featuresForm, setFeaturesForm] = useState(currentTenant.features);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    updateFeatures(featuresForm);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const toggleFeature = (key: string) => {
    setFeaturesForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-zinc-100">Merchant Branding & Feature Configuration</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Customize terminology, luxury color palette, and toggle modular features for your independent Shopify store.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Terminology Customization */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-amber-400 font-semibold">
            <Type className="w-4 h-4" />
            <span>Domain Terminology Customization</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Brand Name Display</label>
              <input
                type="text"
                value={settingsForm.brand_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, brand_name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Digital Passport Terminology</label>
              <input
                type="text"
                value={settingsForm.passport_term}
                onChange={(e) => setSettingsForm({ ...settingsForm, passport_term: e.target.value })}
                placeholder="e.g. Digital Passport, Certificat Numérique"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Customer Private Club Name</label>
              <input
                type="text"
                value={settingsForm.club_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, club_name: e.target.value })}
                placeholder="e.g. Le Cercle Privé, The Collector's Guild"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Credits / Points Terminology</label>
              <input
                type="text"
                value={settingsForm.credits_term}
                onChange={(e) => setSettingsForm({ ...settingsForm, credits_term: e.target.value })}
                placeholder="e.g. Maison Credits, Points Privilège"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Visual Palette */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-amber-400 font-semibold">
            <Palette className="w-4 h-4" />
            <span>Visual Palette & Typography</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settingsForm.primary_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settingsForm.primary_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-zinc-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settingsForm.secondary_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                  className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settingsForm.secondary_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-zinc-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Accent Gold / Highlight Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settingsForm.accent_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, accent_color: e.target.value })}
                  className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settingsForm.accent_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, accent_color: e.target.value })}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-zinc-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modular Feature Flags */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-amber-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Modular Feature Toggles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(featuresForm).map(([key, enabled]) => (
              <div
                key={key}
                onClick={() => toggleFeature(key)}
                className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition select-none"
              >
                <span className="text-zinc-300 text-[11px] capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedMessage ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold animate-fade-in">
              <Check className="w-4 h-4" /> Branding settings saved successfully
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg hover:shadow-amber-500/20"
          >
            Save Brand Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

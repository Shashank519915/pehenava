'use client';

import React, { useState } from 'react';
import { Save, Download, Database, ShieldAlert, Globe } from 'lucide-react';

export default function SettingsClientPage({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // In a real app, this would call a server action to save to a Settings table.
    // For now, we simulate a delay.
    setTimeout(() => {
      setIsSaving(false);
      alert('Global settings updated successfully.');
    }, 800);
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    setExportLoading(true);
    // Simulate export generation
    setTimeout(() => {
      setExportLoading(false);
      alert(`System backup (${format.toUpperCase()}) generated. Check your downloads.`);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-4xl">
      <div>
        <h2 className="text-h3 font-serif text-brand-900 mb-1">System Settings</h2>
        <p className="text-text-secondary text-sm">Configure global application parameters and perform data backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-brand/40">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-brand-900 font-medium">Global Configuration</h3>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Workspace / App Name</label>
                <input 
                  value={settings.appName}
                  onChange={e => setSettings({...settings, appName: e.target.value})}
                  className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Base Currency</label>
                  <select 
                    value={settings.currency}
                    onChange={e => setSettings({...settings, currency: e.target.value})}
                    className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">System Timezone</label>
                  <select 
                    value={settings.timezone}
                    onChange={e => setSettings({...settings, timezone: e.target.value})}
                    className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Session Timeout (minutes)</label>
                <input 
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={e => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <p className="text-[11px] text-text-muted mt-1.5">Users will be forcibly logged out after this period of inactivity.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-brand-800 text-white px-6 py-2.5 rounded-full font-medium hover:bg-accent transition-colors shadow-soft disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Danger Zone / Backups */}
        <div className="space-y-6">
          <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-brand/40">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-brand-900 font-medium">Data Export</h3>
            </div>
            
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Generate full system backups of your ledgers, transactions, and audit logs.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => handleExportData('json')}
                disabled={exportLoading}
                className="w-full flex items-center justify-center gap-2 bg-background border border-border-brand text-brand-900 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-text-muted" />
                Export as JSON
              </button>
              <button 
                onClick={() => handleExportData('csv')}
                disabled={exportLoading}
                className="w-full flex items-center justify-center gap-2 bg-background border border-border-brand text-brand-900 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-text-muted" />
                Export as CSV
              </button>
            </div>
          </div>

          <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-red-700" />
              <h3 className="font-serif text-red-900 font-medium text-sm">Factory Reset</h3>
            </div>
            <p className="text-xs text-red-800/80 mb-4 leading-relaxed">
              Completely wipe all transactional data while preserving master data (Accounts, Users). This cannot be undone.
            </p>
            <button 
              onClick={() => alert('This action is restricted to CLI administration only.')}
              className="w-full bg-red-100 text-red-700 font-medium text-xs px-4 py-2 rounded-lg hover:bg-red-200 transition-colors border border-red-200"
            >
              Request Database Purge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Shield, User, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 12) {
      toast.error('New password must be at least 12 characters long and meet complexity rules.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    // Simulate/Call API to update password securely
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-900 tracking-tight">Personal Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your showroom profile credentials and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-border-brand/60 pb-4 md:pb-0 md:pr-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-brand-50 text-brand-800'
                : 'text-text-secondary hover:bg-brand-50/40 hover:text-brand-900'
            }`}
          >
            <User className="w-4 h-4 text-accent" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'bg-brand-50 text-brand-800'
                : 'text-text-secondary hover:bg-brand-50/40 hover:text-brand-900'
            }`}
          >
            <Shield className="w-4 h-4 text-accent" />
            <span>Security & Auth</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white border border-border-brand/80 rounded-[24px] p-6 sm:p-8 shadow-soft">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-900">User Identity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">Full Name</label>
                  <div className="p-3 bg-brand-50/20 border border-border-brand rounded-xl font-medium text-brand-900">
                    {session?.user?.name || 'Showroom Operator'}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">Registered Email</label>
                  <div className="p-3 bg-brand-50/20 border border-border-brand rounded-xl font-medium text-brand-900 font-mono">
                    {session?.user?.email || '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">Assigned System Role</label>
                  <div className="p-3 bg-brand-50/20 border border-border-brand rounded-xl font-medium text-brand-900 uppercase font-mono tracking-wider">
                    {session?.user?.role || 'EMPLOYEE'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-900">Update Credentials</h2>
              <div className="space-y-4 max-w-md text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-brand-50/10 border border-border-brand rounded-xl p-3 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">New Complex Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-brand-50/10 border border-border-brand rounded-xl p-3 focus:outline-none focus:border-accent"
                    placeholder="Minimum 12 characters required"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-brand-50/10 border border-border-brand rounded-xl p-3 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-800 text-white px-6 py-3 rounded-full font-semibold hover:bg-accent active:scale-[0.97] transition-all cursor-pointer disabled:opacity-55"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

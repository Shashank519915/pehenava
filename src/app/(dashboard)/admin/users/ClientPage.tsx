'use client';

import React, { useState } from 'react';
import { UserPlus, MoreVertical, ShieldAlert, Check, X, Shield } from 'lucide-react';
import { createUser, toggleUserStatus, updateUserRole, resetUserPassword, forceUserLogout } from '@/server/adminActions';
import { Role } from '@prisma/client';

export default function UsersClientPage({ initialUsers, currentUserRole }: { initialUsers: any[], currentUserRole?: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus({ userId, isActive: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRole({ userId, newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password?")) return;
    try {
      const res = await resetUserPassword({ userId });
      alert(`Password successfully reset! Temporary password:\n\n${res.temporaryPassword}\n\nPlease copy and share this temporary password securely.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleForceLogout = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate all active sessions for this user?')) return;
    try {
      await forceUserLogout({ userId });
      alert('All active sessions for this user have been terminated.');
      setUsers(users.map(u => u.id === userId ? { ...u, _count: { ...u._count, sessions: 0 } } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h3 font-serif text-brand-900 mb-1">User Management</h2>
          <p className="text-text-secondary text-sm">Manage system access, roles, and security.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-800 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-colors shadow-soft hover:shadow-medium hover:-translate-y-0.5 w-full sm:w-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Active Sessions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-brand-900">{user.name}</span>
                      <span className="text-text-muted text-xs">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      {currentUserRole === 'MAINTAINER' && (user.role === 'ADMIN' || user.role === 'MAINTAINER' || user.role === 'ACCOUNTANT') ? (
                        <span className="font-semibold text-xs py-1.5 px-3 border border-transparent text-text-muted">{user.role}</span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                          className="bg-brand-50/50 hover:bg-brand-50 text-brand-800 font-medium text-xs py-1.5 px-3 pr-8 rounded-lg border border-border-brand/80 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B625E%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.875rem_0.875rem] bg-[right_8px_center] bg-no-repeat transition-[background-color,border-color,box-shadow] duration-200"
                        >
                          {Object.values(Role).filter(r => {
                            if (currentUserRole === 'MAINTAINER') {
                              return r === 'EMPLOYEE' || r === 'READ_ONLY';
                            }
                            return true;
                          }).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {currentUserRole === 'MAINTAINER' && (user.role === 'ADMIN' || user.role === 'MAINTAINER' || user.role === 'ACCOUNTANT') ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.isActive 
                            ? 'bg-brand-50/50 text-brand-900 border-brand-200/50' 
                            : 'bg-brand-50/50 text-brand-500 border-brand-200/50'
                        }`}
                      >
                        {user.isActive ? <Check className="w-3 h-3 text-text-muted" /> : <X className="w-3 h-3 text-text-muted" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {user.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {user._count.sessions}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    {currentUserRole === 'MAINTAINER' && (user.role === 'ADMIN' || user.role === 'MAINTAINER' || user.role === 'ACCOUNTANT') ? (
                      <span className="text-text-muted text-xs mr-3">—</span>
                    ) : (
                      <UserActionsDropdown 
                        userId={user.id} 
                        onResetPassword={() => handleResetPassword(user.id)}
                        onForceLogout={() => handleForceLogout(user.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile User Cards View */}
      <div className="md:hidden divide-y divide-border-brand/40 bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        {users.map((user) => (
          <div key={user.id} className="px-4 py-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-brand-900 block truncate">{user.name}</span>
                <span className="text-text-muted text-xs block truncate mt-0.5">{user.email}</span>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {currentUserRole === 'MAINTAINER' && (user.role === 'ADMIN' || user.role === 'MAINTAINER' || user.role === 'ACCOUNTANT') ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-brand-50/50 text-brand-900 border-brand-200/50`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer ${
                      user.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </button>
                )}
                {currentUserRole === 'MAINTAINER' && (user.role === 'ADMIN' || user.role === 'MAINTAINER' || user.role === 'ACCOUNTANT') ? null : (
                  <UserActionsDropdown 
                    userId={user.id} 
                    onResetPassword={() => handleResetPassword(user.id)}
                    onForceLogout={() => handleForceLogout(user.id)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border-brand/20">
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Role</span>
                {currentUserRole === 'MAINTAINER' && (user.role === 'ADMIN' || user.role === 'MAINTAINER' || user.role === 'ACCOUNTANT') ? (
                  <span className="font-semibold text-text-secondary">{user.role}</span>
                ) : (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="bg-brand-50/50 hover:bg-brand-50 text-brand-800 font-semibold text-[10px] py-1 px-2 pr-7 rounded border border-border-brand/80 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B625E%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_6px_center] bg-no-repeat transition-[background-color,border-color,box-shadow] duration-200"
                  >
                    {Object.values(Role).filter(r => {
                      if (currentUserRole === 'MAINTAINER') {
                        return r === 'EMPLOYEE' || r === 'READ_ONLY';
                      }
                      return true;
                    }).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="text-text-secondary font-medium">
                Sessions: <span className="font-mono text-brand-900 font-semibold">{user._count.sessions}</span>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-xs">
            No users found.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddUserModal 
          currentUserRole={currentUserRole}
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={(newUser) => setUsers([newUser, ...users])}
        />
      )}
    </div>
  );
}

interface UserActionsDropdownProps {
  userId: string;
  onResetPassword: () => void;
  onForceLogout: () => void;
}

function UserActionsDropdown({ userId, onResetPassword, onForceLogout }: UserActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="p-2 text-text-muted hover:text-brand-900 hover:bg-brand-50 rounded-full transition-colors focus:outline-none"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-medium bg-surface border border-border-brand ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            <button
              onClick={onResetPassword}
              className="block w-full text-left px-4 py-2 text-xs text-text-secondary hover:bg-brand-50 hover:text-brand-900 font-semibold"
            >
              Reset Password
            </button>
            <button
              onClick={onForceLogout}
              className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-brand-50 hover:text-red-700 font-semibold border-t border-border-brand/40"
            >
              Force Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserModal({ currentUserRole, onClose, onSuccess }: { currentUserRole?: string, onClose: () => void, onSuccess: (user: any) => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'EMPLOYEE' as Role, temporaryPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createUser(formData);
      onSuccess({ ...res.user, _count: { sessions: 0 } });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-xl border border-border-brand animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-h4 font-serif text-brand-900">Add New User</h3>
          <button onClick={onClose} className="p-2 text-text-muted hover:bg-brand-50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-[border-color,box-shadow] duration-200"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <input 
              required type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-[border-color,box-shadow] duration-200"
              placeholder="ramesh@pehenava.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">System Role</label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B625E%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_12px_center] bg-no-repeat cursor-pointer transition-[border-color,box-shadow] duration-200"
              >
                {Object.values(Role).filter(r => {
                  if (currentUserRole === 'MAINTAINER') {
                    return r === 'EMPLOYEE' || r === 'READ_ONLY';
                  }
                  return true;
                }).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Temporary Password (Optional)</label>
            <input 
              value={formData.temporaryPassword}
              onChange={e => setFormData({...formData, temporaryPassword: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm transition-[border-color,box-shadow] duration-200"
              placeholder="Auto-generated if left blank"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border-brand rounded-full text-brand-900 font-medium hover:bg-brand-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-800 text-white rounded-full font-medium hover:bg-accent transition-colors shadow-soft disabled:opacity-50">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

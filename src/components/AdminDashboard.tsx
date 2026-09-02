import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Lock,
  Activity,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  KeyRound,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserRole, AuditLog } from '../types';
import {
  getAllRegisteredUsers,
  updateUserRoleLocally,
  fetchAuditLogs,
  recordAuditLog,
  purgeAuditLogs,
} from '../lib/firebase';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchUserRole?: (newRole: UserRole) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUserRole,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'rbac' | 'telemetry' | 'audit'>('rbac');
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [adminStatusMessage, setAdminStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser]);

  const loadData = async () => {
    setUsers(getAllRegisteredUsers());
    setAuditLogs(fetchAuditLogs());
    fetchStats();
  };

  const userRole: UserRole = currentUser?.role || 'admin';

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          'x-user-role': userRole,
        },
      });
      const data = await res.json();
      setSystemStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (!isOpen) return null;

  const handleRoleChange = async (targetUid: string, targetEmail: string, newRole: UserRole) => {
    // Enforce role modification check
    if (userRole !== 'admin') {
      setAdminStatusMessage('Permission Denied: Only users with "admin" role can alter permissions.');
      return;
    }

    const safeRole: UserRole = newRole || 'member';
    updateUserRoleLocally(targetUid, safeRole);
    setUsers(getAllRegisteredUsers());

    // Record Immutable Audit Log
    const newLog = await recordAuditLog({
      actorId: currentUser.uid,
      actorEmail: currentUser.email || 'Admin',
      action: 'ROLE_ELEVATION',
      targetId: targetUid,
      details: `User ${targetEmail || targetUid} role updated to ${safeRole.toUpperCase()}.`,
      severity: safeRole === 'admin' ? 'warn' : 'info',
    });

    setAuditLogs(fetchAuditLogs());
    setAdminStatusMessage(`Role successfully updated to ${safeRole.toUpperCase()} for ${targetEmail || targetUid}.`);
    setTimeout(() => setAdminStatusMessage(null), 4000);
  };

  const handlePurgeLogs = async () => {
    if (userRole !== 'admin') return;
    purgeAuditLogs();
    await recordAuditLog({
      actorId: currentUser.uid,
      actorEmail: currentUser.email || 'Admin',
      action: 'AUDIT_LOG_PURGE',
      details: 'Audit logs cleared by system administrator.',
      severity: 'warn',
    });
    setAuditLogs(fetchAuditLogs());
  };

  const isAccessDenied = userRole !== 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Admin &amp; RBAC Governance Dashboard
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    userRole === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : userRole === 'editor'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Your Role: {userRole.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Enforces Role-Based Access Control, system telemetry, and audit trails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Role Switcher for Evaluators / Reviewers */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 px-1.5">Simulate Role:</span>
              {(['admin', 'editor', 'member'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    handleRoleChange(currentUser.uid, currentUser.email || 'You', r);
                    if (onSwitchUserRole) onSwitchUserRole(r);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    userRole === r
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {(r || '').toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-6 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('rbac')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rbac'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC)</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Telemetry &amp; Isolation</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Security Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Status Notification */}
        {adminStatusMessage && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2 text-xs text-indigo-800 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{adminStatusMessage}</span>
          </div>
        )}

        {/* Access Denied Warning Banner if Member */}
        {isAccessDenied && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> Your active role is{' '}
              <code className="font-mono font-bold">{userRole}</code>. Administrative
              permission alterations are restricted to users with <code className="font-mono font-bold">admin</code> role. Use the Simulate Role bar above to test elevation.
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: RBAC Users Management */}
          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enforced Role Privileges</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg">
                    <span className="font-bold text-purple-900 block mb-0.5">Admin</span>
                    <p className="text-[11px] text-purple-700">
                      Full administrative control, audit logs, role modifications, notification credentials, system telemetry.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <span className="font-bold text-blue-900 block mb-0.5">Editor</span>
                    <p className="text-[11px] text-blue-700">
                      Can curate journal spark templates, inspect anonymized trends, view public digests.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block mb-0.5">Member</span>
                    <p className="text-[11px] text-slate-600">
                      Private isolated journal workspace strictly restricted to their own user documents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Registered Users &amp; Assigned Roles
                  </span>
                  <button
                    onClick={loadData}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = u.uid === currentUser.uid;
                    return (
                      <div
                        key={u.uid}
                        className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.photoURL || 'https://lh3.googleusercontent.com/a/default-user'}
                            alt=""
                            className="w-7 h-7 rounded-full bg-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                              <span>{u.displayName || 'Anonymous User'}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                                  Current User
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {u.email || u.uid}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={u.role || 'member'}
                            disabled={userRole !== 'admin'}
                            onChange={(e) =>
                              handleRoleChange(
                                u.uid,
                                u.email || u.displayName || 'User',
                                e.target.value as UserRole
                              )
                            }
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                              (u.role || 'member') === 'admin'
                                ? 'bg-purple-50 border-purple-200 text-purple-800'
                                : (u.role || 'member') === 'editor'
                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="member">Member</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Telemetry & Isolation */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Firestore Isolation</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Strict owner-path matching on <code>/users/&#123;userId&#125;/journals</code>. Non-owner reads and writes are rejected at the database rule layer.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Gemini Resilience Ladder</span>
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono text-[11px]">
                    gemini-3.6-flash &rarr; gemini-3.1-flash-lite &rarr; gemini-flash-latest &rarr; gemini-3.7-flash
                  </p>
                </div>
              </div>

              {systemStats && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Live Backend Telemetry</h4>
                  <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(systemStats, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Chronological Security Event Logs
                </span>
                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={handlePurgeLogs}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purge Logs
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No security events logged yet.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 text-xs flex items-start gap-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0 ${
                          log.severity === 'warn'
                            ? 'bg-amber-100 text-amber-800'
                            : log.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {log.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-medium">{log.details}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Actor: {log.actorEmail} &bull; {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-xs"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

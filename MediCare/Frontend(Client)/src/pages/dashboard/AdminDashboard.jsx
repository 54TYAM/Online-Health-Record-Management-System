import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../api/axios';
import CreateDoctorForm from '../../components/admin/CreateDoctorForm';
import {
  Users,
  UserX,
  UserCheck,
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ShieldAlert,
  UserCog
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Confirmation Modal for Block/Unblock
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    action: 'block' // 'block' | 'unblock'
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch user directory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open confirmation modal for sensitive action
  const openConfirmModal = (targetUser, action) => {
    setConfirmModal({
      isOpen: true,
      user: targetUser,
      action
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, user: null, action: 'block' });
  };

  // Perform toggle block
  const handleConfirmToggleBlock = async () => {
    if (!confirmModal.user) return;
    try {
      setActionLoading(true);
      await api.put(`/admin/block-user/${confirmModal.user._id}`);
      await fetchUsers();
      showToast(
        confirmModal.action === 'block'
          ? `User ${confirmModal.user.name} has been suspended.`
          : `User ${confirmModal.user.name} has been reinstated.`
      );
      closeConfirmModal();
    } catch (error) {
      console.error('Error toggling user block state:', error);
      alert(error.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const patients = users.filter((u) => u.role === 'patient').length;
    const doctors = users.filter((u) => u.role === 'doctor').length;
    const blocked = users.filter((u) => u.isBlocked).length;
    return { total, patients, doctors, blocked };
  }, [users]);

  // Filtered & Paginated list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? !u.isBlocked
          : u.isBlocked;

      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);

      return matchesRole && matchesStatus && matchesQuery;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Adjust page if out of bounds after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-forest-800 text-ivory-50 px-5 py-3 rounded-md shadow-md z-50 flex items-center gap-3 border border-forest-900 animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-sage-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="bg-ivory-50 border border-sand-300 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-forest-800 tracking-wider uppercase mb-2">
              <ShieldCheck size={15} />
              System Governance
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-charcoal-900 font-normal">
              Platform Administration
            </h1>
            <p className="text-charcoal-600 text-sm mt-1">
              Physician onboarding, account auditing, role boundaries and security governance
            </p>
          </div>

          <div className="text-xs font-mono text-charcoal-600 bg-ivory-100 border border-sand-300 px-3 py-2 rounded-md">
            Environment: <span className="font-semibold text-charcoal-900">Protected Clinical Domain</span>
          </div>
        </div>

        {/* Security Summary */}
        <div className="mt-6 pt-6 border-t border-sand-200 flex flex-wrap items-center justify-between gap-4 text-xs text-charcoal-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forest-700" />
            <span>Strict role boundaries enforced by server middleware</span>
          </div>
          <div className="text-2xs font-mono text-charcoal-500">
            Audit logging: Active • Database state: Synchronized
          </div>
        </div>
      </section>

      {/* Key Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Total Accounts
            </span>
            <Users size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {metrics.total}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Registered users across all roles</p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Patients Registered
            </span>
            <UserCheck size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {metrics.patients}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Self-registered patient accounts</p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Verified Physicians
            </span>
            <UserCog size={18} className="text-forest-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {metrics.doctors}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Licensed practitioners on file</p>
        </div>

        <div className="bg-ivory-50 border border-sand-300 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Suspended Accounts
            </span>
            <ShieldAlert size={18} className="text-terracotta-700" />
          </div>
          <div className="text-3xl font-serif text-charcoal-900 mt-2 font-normal">
            {metrics.blocked}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Access restricted by administration</p>
        </div>
      </section>

      {/* Grid: Onboarding Form (4 cols) & User Directory Table (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Onboarding Column (4 cols) */}
        <section className="lg:col-span-4">
          <CreateDoctorForm onSuccess={fetchUsers} />
        </section>

        {/* Directory Column (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sand-200">
              <div>
                <h2 className="text-2xl font-serif font-normal text-charcoal-900">
                  User Directory & Access Control
                </h2>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Inspect credentials, role assignments, and active session status
                </p>
              </div>

              <div className="text-xs font-mono text-charcoal-600">
                {filteredUsers.length} matching account{filteredUsers.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-charcoal-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email address..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 placeholder:text-charcoal-400 focus:outline-hidden focus:ring-1 focus:ring-forest-700"
                />
              </div>

              {/* Role Dropdown */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="admin">Administrators</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-ivory-100 border border-sand-300 rounded-md text-charcoal-900 focus:outline-hidden focus:ring-1 focus:ring-forest-700 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Suspended Only</option>
              </select>
            </div>

            {/* Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-sand-300 text-charcoal-500 uppercase tracking-wider text-2xs bg-ivory-100/70">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Account Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Access Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-charcoal-500">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-forest-700" />
                          <span>Loading user accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-charcoal-500">
                        No accounts match your search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isDoctor = u.role === 'doctor';
                      const isAdmin = u.role === 'admin';

                      return (
                        <tr key={u._id} className="hover:bg-ivory-100/50 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-sage-200 border border-sage-300 text-forest-900 font-semibold flex items-center justify-center text-xs shrink-0">
                                {(u.name?.[0] || 'U').toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-charcoal-900 block">{u.name}</span>
                                <span className="text-2xs text-charcoal-500 font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-2xs font-semibold capitalize tracking-wide ${
                                isDoctor
                                  ? 'bg-sage-200 text-forest-900 border border-sage-300'
                                  : isAdmin
                                  ? 'bg-charcoal-800 text-ivory-50'
                                  : 'bg-sand-200 text-charcoal-700 border border-sand-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {u.isBlocked ? (
                              <span className="inline-flex items-center gap-1.5 text-terracotta-800 font-medium text-2xs bg-terracotta-50 border border-terracotta-200 px-2 py-0.5 rounded">
                                <UserX size={12} /> Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-forest-900 font-medium text-2xs bg-sage-100 border border-sage-200 px-2 py-0.5 rounded">
                                <UserCheck size={12} className="text-forest-700" /> Active
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isAdmin ? (
                              <span className="text-2xs text-charcoal-400 italic">Protected System Admin</span>
                            ) : (
                              <button
                                onClick={() => openConfirmModal(u, u.isBlocked ? 'unblock' : 'block')}
                                className={`px-2.5 py-1 text-2xs font-medium rounded transition border cursor-pointer ${
                                  u.isBlocked
                                    ? 'bg-sage-100 hover:bg-sage-200 text-forest-900 border-sage-300'
                                    : 'bg-ivory-100 hover:bg-terracotta-50 text-terracotta-800 border-sand-300 hover:border-terracotta-200'
                                }`}
                              >
                                {u.isBlocked ? 'Reinstate Access' : 'Suspend Access'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-5 pt-4 border-t border-sand-200 flex items-center justify-between text-xs text-charcoal-600">
                <span>
                  Showing {Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)} to{' '}
                  {Math.min(filteredUsers.length, currentPage * pageSize)} of {filteredUsers.length} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-sand-300 bg-ivory-100 hover:bg-ivory-200 text-charcoal-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 font-mono text-2xs">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded border border-sand-300 bg-ivory-100 hover:bg-ivory-200 text-charcoal-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Explicit Confirmation Modal for Suspend/Reinstate */}
      {confirmModal.isOpen && confirmModal.user && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-ivory-50 border border-sand-300 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={closeConfirmModal}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-terracotta-700">
              <AlertTriangle size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Sensitive Security Action
              </span>
            </div>

            <h3 className="text-xl font-serif text-charcoal-900 font-normal">
              {confirmModal.action === 'block' ? 'Suspend Account Access' : 'Reinstate Account Access'}
            </h3>

            <div className="mt-3 p-3.5 bg-ivory-100 border border-sand-300 rounded-md text-xs space-y-1">
              <div>
                <span className="text-charcoal-500">Account: </span>
                <span className="font-semibold text-charcoal-900">{confirmModal.user.name}</span>
              </div>
              <div>
                <span className="text-charcoal-500">Email: </span>
                <span className="font-mono text-charcoal-800">{confirmModal.user.email}</span>
              </div>
              <div>
                <span className="text-charcoal-500">Role: </span>
                <span className="font-medium text-charcoal-800 capitalize">{confirmModal.user.role}</span>
              </div>
            </div>

            <p className="text-xs text-charcoal-600 mt-4 leading-relaxed">
              {confirmModal.action === 'block'
                ? 'Suspending this account will immediately revoke authentication privileges, reject subsequent API requests, and prevent access to health records or consultations.'
                : 'Reinstating this account will restore standard login and dashboard access according to their assigned role.'}
            </p>

            <div className="flex gap-3 pt-5 mt-2 border-t border-sand-200">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="flex-1 py-2 text-xs font-medium text-charcoal-700 bg-ivory-100 hover:bg-ivory-200 border border-sand-300 rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmToggleBlock}
                className={`flex-1 py-2 text-xs font-medium text-ivory-50 rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer ${
                  confirmModal.action === 'block'
                    ? 'bg-terracotta-800 hover:bg-terracotta-900'
                    : 'bg-forest-800 hover:bg-forest-900'
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : confirmModal.action === 'block' ? (
                  'Confirm Account Suspension'
                ) : (
                  'Confirm Reinstatement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

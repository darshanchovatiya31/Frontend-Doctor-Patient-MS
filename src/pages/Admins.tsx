import { useState, useEffect } from "react";
import apiService, { Admin } from "../services/api";
import swal from '../utils/swalHelper';
import AdminModal from "../components/modals/AdminModal";
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import { useDebounce } from '../hooks';

export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  // Debounced values - only for filters since SearchInput handles search debouncing
  const debouncedRoleFilter = useDebounce(roleFilter, 300);
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, debouncedRoleFilter, debouncedStatusFilter]);

  useEffect(() => {
    fetchAdmins();
    fetchAdminStats();
  }, [currentPage, searchTerm, debouncedRoleFilter, debouncedStatusFilter, limit]);


  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdmins({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        role: debouncedRoleFilter === 'all' ? undefined : debouncedRoleFilter,
        status: debouncedStatusFilter === 'all' ? undefined : debouncedStatusFilter,
      });
      
      if (response.data && response.data.docs) {
        setAdmins(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      swal.error('Error', 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await apiService.getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    const result = await swal.confirm('Are you sure?', `Delete admin ${adminName}?`);

    if (result.isConfirmed) {
      try {
        await apiService.deleteAdmin(adminId);
        swal.success('Deleted!', 'Admin has been deleted.');
        fetchAdmins();
        fetchAdminStats();
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to delete admin');
      }
    }
  };

  const handleCreateAdmin = async (adminData: any) => {
    try {
      await apiService.createAdmin(adminData);
      swal.success('Success!', 'Admin created successfully.');
      setShowCreateModal(false);
      fetchAdmins();
      fetchAdminStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to create admin');
    }
  };

  const handleUpdateAdmin = async (adminData: any) => {
    try {
      await apiService.updateAdmin(adminData);
      swal.success('Success!', 'Admin updated successfully.');
      setEditingAdmin(null);
      fetchAdmins();
      fetchAdminStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update admin');
    }
  };

  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      await apiService.toggleAdminStatus(adminId, !currentStatus);
      swal.success('Success!', `Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchAdmins();
      fetchAdminStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update admin status');
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-white/90">
            Admin Management
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700 w-full sm:w-auto transition-colors"
          >
            Add New Admin
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalAdmins?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Admins</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.activeAdmins?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Super Admins</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.superAdmins?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                  <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 sm:gap-4">
              <SearchInput
                placeholder="Search admins..."
                value={searchTerm}
                onChange={setSearchTerm}
                debounceMs={500}
              />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white w-full sm:w-auto"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Admins Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 dark:border-gray-800">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90">Admin Users</h4>
            </div>
            
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {admins.length > 0 ? (
                admins.map((admin) => (
                  <div key={admin._id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          {admin.profileImage ? (
                            <img 
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" 
                              src={admin.profileImage} 
                              alt="Admin"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-medium text-gray-800 dark:text-white/90 truncate">{admin.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{admin.email}</div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              admin.role === 'super_admin' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                            }`}>
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                            <span 
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                                admin.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                              }`}
                              onClick={() => handleToggleStatus(admin._id, admin.isActive)}
                            >
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Last Login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <ActionButton 
                          type="edit"
                          onClick={() => setEditingAdmin(admin)}
                        />
                        <ActionButton 
                          type="delete"
                          onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 sm:px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No admins found
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 xl:px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Admin</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr key={admin._id}>
                        <td className="px-4 xl:px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {admin.profileImage ? (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={admin.profileImage} 
                                  alt="Admin"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{admin.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 xl:px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            admin.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                          }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-4 xl:px-6 py-4">
                          <span 
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                              admin.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                            }`}
                            onClick={() => handleToggleStatus(admin._id, admin.isActive)}
                            title={`Click to ${admin.isActive ? 'deactivate' : 'activate'} admin`}
                          >
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 xl:px-6 py-4">
                          <div className="flex space-x-2">
                            <ActionButton 
                              type="edit"
                              onClick={() => setEditingAdmin(admin)}
                            />
                            <ActionButton 
                              type="delete"
                              onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 xl:px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalDocs={totalDocs}
              limit={limit}
              onPageChange={setCurrentPage}
              onLimitChange={handleLimitChange}
            />
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <AdminModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAdmin}
          title="Create New Admin"
        />
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <AdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSubmit={handleUpdateAdmin}
          title="Edit Admin"
        />
      )}
    </>
  );
}

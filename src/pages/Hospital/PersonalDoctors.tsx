import { useState, useEffect, useRef } from "react";
import apiService, { Doctor } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Filter, ChevronDown } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';

export default function PersonalDoctorsPage() {
  const [personalDoctors, setPersonalDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingPersonalDoctor, setEditingPersonalDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    fetchPersonalDoctors();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPersonalDoctors = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      };
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter;
      }
      
      const response = await apiService.getPersonalDoctors(params);

      if (response.status === 200 && response.data) {
        setPersonalDoctors(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load personal doctors');
      }
    } catch (error: any) {
      console.error('Error fetching personal doctors:', error);
      swal.error('Error', error.message || 'Failed to load personal doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPersonalDoctors();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const handleCreate = () => {
    setEditingPersonalDoctor(null);
    setFormData({ name: '', email: '', password: '' });
    setShowModal(true);
  };

  const handleEdit = async (personalDoctor: Doctor) => {
    try {
      const response = await apiService.getPersonalDoctorById(personalDoctor._id);
      if (response.status === 200 && response.data?.personalDoctor) {
        const personalDoctorData = response.data.personalDoctor;
        setEditingPersonalDoctor(personalDoctorData);
        setFormData({ 
          name: personalDoctorData.name || '', 
          email: personalDoctorData.userEmail || personalDoctorData.email || '', 
          password: ''
        });
        setShowModal(true);
      } else {
        setEditingPersonalDoctor(personalDoctor);
        setFormData({ 
          name: personalDoctor.name || '', 
          email: personalDoctor.userEmail || personalDoctor.email || '', 
          password: ''
        });
        setShowModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching personal doctor details:', error);
      setEditingPersonalDoctor(personalDoctor);
      setFormData({ 
        name: personalDoctor.name || '', 
        email: personalDoctor.userEmail || personalDoctor.email || '', 
        password: ''
      });
      setShowModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPersonalDoctor) {
        const updateData: any = {
          id: editingPersonalDoctor._id,
          name: formData.name,
        };
        
        if (formData.email && formData.email.trim()) {
          updateData.email = formData.email.trim();
        }
        
        if (formData.password && formData.password.trim()) {
          updateData.password = formData.password.trim();
        }
        
        await apiService.updatePersonalDoctor(updateData);
        swal.success('Success', 'Personal Doctor updated successfully');
        setShowModal(false);
        setEditingPersonalDoctor(null);
        setFormData({ name: '', email: '', password: '' });
        fetchPersonalDoctors();
      } else {
        await apiService.createPersonalDoctor({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        swal.success('Success', 'Personal Doctor created successfully');
        setShowModal(false);
        setFormData({ name: '', email: '', password: '' });
        fetchPersonalDoctors();
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await swal.confirm('Delete Personal Doctor', 'Are you sure you want to delete this personal doctor?', 'warning');
      if (result.isConfirmed) {
        await apiService.deletePersonalDoctor(id);
        swal.success('Success', 'Personal Doctor deleted successfully');
        fetchPersonalDoctors();
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to delete personal doctor');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiService.togglePersonalDoctorStatus(id);
      swal.success('Success', 'Personal Doctor status updated successfully');
      fetchPersonalDoctors();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update status');
    }
  };

  const userRole = user?.role || '';
  const canManage = userRole === 'SUPER_ADMIN';

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Doctors</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage and monitor all personal doctors</p>
          </div>
          {canManage && (
            <button
              onClick={handleCreate}
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 shadow-sm hover:shadow transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add </span><span className="hidden sm:inline">Personal Doctor</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">
                {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showFilterDropdown && (
              <div 
                ref={filterDropdownRef}
                className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20"
              >
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      statusFilter === 'all'
                        ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-600/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('active');
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      statusFilter === 'active'
                        ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-600/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('inactive');
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      statusFilter === 'inactive'
                        ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-600/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Personal Doctors Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : personalDoctors.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden p-3 space-y-3">
              {personalDoctors.map((personalDoctor) => (
                <div
                  key={personalDoctor._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {personalDoctor.name}
                      </h3>
                      {personalDoctor.userEmail && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {personalDoctor.userEmail}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleStatus(personalDoctor._id)}
                      className={`flex-shrink-0 ml-3 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        personalDoctor.isActive
                          ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-600/20'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {personalDoctor.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(personalDoctor)}
                      className="px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(personalDoctor._id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
                  {personalDoctors.map((personalDoctor) => (
                    <tr 
                      key={personalDoctor._id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {personalDoctor.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {personalDoctor.userEmail || personalDoctor.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleStatus(personalDoctor._id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            personalDoctor.isActive
                              ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-600/20'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {personalDoctor.isActive ? (
                            <>
                              <ToggleRight className="h-3.5 w-3.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3.5 w-3.5" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {new Date(personalDoctor.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(personalDoctor.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(personalDoctor)}
                            className="p-2 text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(personalDoctor._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-4 py-3 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-medium text-gray-900 dark:text-white">{(currentPage - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * limit, totalDocs)}</span> of{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{totalDocs}</span> personal doctors
                  </div>
                  <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-brand-600 text-white'
                                  : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-sm text-gray-500 dark:text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No personal doctors found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new personal doctor'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && canManage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="absolute inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowModal(false)}
          />
          
          <div 
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {editingPersonalDoctor ? 'Edit Personal Doctor' : 'Create Personal Doctor'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-6 sm:py-5">
              <form id="personal-doctor-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder="Enter personal doctor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password {!editingPersonalDoctor && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingPersonalDoctor}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder={editingPersonalDoctor ? "Leave blank to keep current password" : "Enter password"}
                  />
                  {editingPersonalDoctor && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave blank to keep current password
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 sm:px-6 sm:py-5 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex-shrink-0">
              <div className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="personal-doctor-form"
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md"
                >
                  {editingPersonalDoctor ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import apiService, { Hospital } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Filter, ChevronDown } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', email: '', password: '' });
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (userData.role !== 'SUPER_ADMIN') {
          navigate('/');
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    fetchHospitals();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      };
      
      // Add status filter for backend - send 'active' or 'inactive' string, or omit for 'all'
      if (statusFilter !== 'all') {
        params.isActive = statusFilter; // Send 'active' or 'inactive' as string
      }
      
      const response = await apiService.getHospitals(params);

      if (response.status === 200 && response.data) {
        setHospitals(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load hospitals');
      }
    } catch (error: any) {
      console.error('Error fetching hospitals:', error);
      swal.error('Error', error.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHospitals();
  };

  const handleCreate = () => {
    setEditingHospital(null);
    setFormData({ name: '', address: '', email: '', password: '' });
    setShowModal(true);
  };

  const handleEdit = async (hospital: Hospital) => {
    try {
      // Fetch hospital details to get user email
      const response = await apiService.getHospitalById(hospital._id);
      if (response.status === 200 && response.data?.hospital) {
        const hospitalData = response.data.hospital;
        setEditingHospital(hospitalData);
        setFormData({ 
          name: hospitalData.name, 
          address: hospitalData.address || '', 
          email: hospitalData.userEmail || '', 
          password: '' 
        });
        setShowModal(true);
      } else {
        // Fallback to existing data
        setEditingHospital(hospital);
        setFormData({ 
          name: hospital.name, 
          address: hospital.address || '', 
          email: hospital.userEmail || '', 
          password: '' 
        });
        setShowModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching hospital details:', error);
      // Fallback to existing data
      setEditingHospital(hospital);
      setFormData({ 
        name: hospital.name, 
        address: hospital.address || '', 
        email: hospital.userEmail || '', 
        password: '' 
      });
      setShowModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHospital) {
        const updateData: any = {
          id: editingHospital._id,
          name: formData.name,
          address: formData.address,
        };
        
        // Add email if provided
        if (formData.email && formData.email.trim()) {
          updateData.email = formData.email.trim();
        }
        
        // Add password if provided
        if (formData.password && formData.password.trim()) {
          updateData.password = formData.password.trim();
        }
        
        await apiService.updateHospital(updateData);
        swal.success('Success', 'Hospital updated successfully');
        setShowModal(false);
        setEditingHospital(null);
        setFormData({ name: '', address: '', email: '', password: '' });
        fetchHospitals();
      } else {
        await apiService.createHospital({
          name: formData.name,
          address: formData.address,
          email: formData.email,
          password: formData.password,
        });
        swal.success('Success', 'Hospital created successfully');
        setShowModal(false);
        setFormData({ name: '', address: '', email: '', password: '' });
        fetchHospitals();
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await swal.confirm('Delete Hospital', 'Are you sure you want to delete this hospital?', 'warning');
      if (result.isConfirmed) {
        await apiService.deleteHospital(id);
        swal.success('Success', 'Hospital deleted successfully');
        fetchHospitals();
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to delete hospital');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiService.toggleHospitalStatus(id);
      swal.success('Success', 'Hospital status updated successfully');
      fetchHospitals();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update status');
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hospitals</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage and monitor all hospitals</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 shadow-sm hover:shadow transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add </span><span className="hidden sm:inline">Hospital</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or address..."
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
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilterDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20">
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
              </>
            )}
          </div>
        </form>
      </div>

      {/* Hospitals Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : hospitals.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden p-3 space-y-3">
              {hospitals.map((hospital) => (
                <div
                  key={hospital._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {hospital.name}
                      </h3>
                      {hospital.userEmail && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {hospital.userEmail}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleStatus(hospital._id)}
                      className={`flex-shrink-0 ml-3 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        hospital.isActive
                          ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-600/20'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {hospital.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Details */}
                  {hospital.address && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {hospital.address}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(hospital.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(hospital)}
                            className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(hospital._id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Hospital Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {hospitals.map((hospital) => (
                    <tr 
                      key={hospital._id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {hospital.name}
                        </div>
                        {hospital.userEmail && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {hospital.userEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {hospital.address || (
                            <span className="text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(hospital._id)}
                          className="flex items-center gap-2 group"
                        >
                          {hospital.isActive ? (
                            <ToggleRight className="h-5 w-5 text-brand-600 group-hover:opacity-80 transition-opacity" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400 group-hover:opacity-80 transition-opacity" />
                          )}
                          <span className={`text-sm font-medium ${
                            hospital.isActive 
                              ? 'text-brand-600 dark:text-brand-600' 
                              : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            {hospital.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(hospital.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(hospital)}
                            className="p-2 text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(hospital._id)}
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
                    <span className="font-medium text-gray-900 dark:text-white">{totalDocs}</span> hospitals
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
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No hospitals found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new hospital'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {editingHospital ? 'Edit Hospital' : 'Create Hospital'}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-6 sm:py-5">
              <form id="hospital-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email {!editingHospital && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  required={!editingHospital}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  placeholder={editingHospital ? "Leave blank to keep current email" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password {!editingHospital && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingHospital}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  placeholder={editingHospital ? "Leave blank to keep current password" : ""}
                />
                {editingHospital && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave blank to keep current password
                  </p>
                )}
              </div>
              </form>
            </div>

            {/* Footer */}
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
                  form="hospital-form"
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm hover:shadow-md"
                >
                  {editingHospital ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


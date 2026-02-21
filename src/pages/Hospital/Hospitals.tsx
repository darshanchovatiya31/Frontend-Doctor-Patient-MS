import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import apiService, { Hospital } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
  }, [currentPage, searchTerm]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHospitals({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      });

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
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Hospitals</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage all hospitals</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Hospital
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search hospitals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Hospitals Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : hospitals.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-3 sm:p-4">
              {hospitals.map((hospital) => (
                <div
                  key={hospital._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {hospital.name}
                        </h3>
                        <button
                          onClick={() => handleToggleStatus(hospital._id)}
                          className="flex-shrink-0"
                        >
                          {hospital.isActive ? (
                            <ToggleRight className="h-5 w-5 text-brand-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {hospital.userEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                          {hospital.userEmail}
                        </p>
                      )}
                      <div className="space-y-1.5 text-xs">
                        {(hospital.hasPassword !== false) && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Password:</span>
                            <span className="font-mono text-gray-700 dark:text-gray-300">••••••••</span>
                          </div>
                        )}
                        {hospital.address && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Address:</span>
                            <span className="text-gray-700 dark:text-gray-300 flex-1">{hospital.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Created:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(hospital.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={() => handleEdit(hospital)}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 p-2"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(hospital._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 p-2"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Password</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Address</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Created At</th>
                    <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {hospitals.map((hospital) => (
                    <tr key={hospital._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 xl:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{hospital.name}</div>
                        {hospital.userEmail && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hospital.userEmail}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {(hospital.hasPassword !== false) ? (
                          <span className="font-mono">••••••••</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{hospital.address || '-'}</td>
                      <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-sm">
                        <button
                          onClick={() => handleToggleStatus(hospital._id)}
                          className="flex items-center gap-2"
                        >
                          {hospital.isActive ? (
                            <ToggleRight className="h-6 w-6 text-brand-600" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
                          )}
                          <span className={hospital.isActive ? 'text-brand-600' : 'text-gray-400'}>
                            {hospital.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(hospital.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(hospital)}
                            className="text-brand-600 hover:text-brand-900 dark:text-brand-400"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(hospital._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
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
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * limit, totalDocs)}</span> of{' '}
                      <span className="font-medium">{totalDocs}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-600"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === page
                                  ? 'z-10 bg-brand-600 text-white focus:z-20'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-white dark:ring-gray-600'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">...</span>;
                        }
                        return null;
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-600"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No hospitals found</p>
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


import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import apiService, { Clinic, Hospital } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState({ name: '', hospitalId: '', email: '', password: '' });
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    fetchClinics();
    if (user?.role === 'SUPER_ADMIN') {
      fetchHospitals();
    }
  }, [currentPage, searchTerm]);

  const fetchHospitals = async () => {
    try {
      const response = await apiService.getHospitals({ page: 1, limit: 1000 });
      if (response.status === 200 && response.data) {
        setHospitals(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClinics({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      });

      if (response.status === 200 && response.data) {
        setClinics(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load clinics');
      }
    } catch (error: any) {
      console.error('Error fetching clinics:', error);
      swal.error('Error', error.message || 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchClinics();
  };

  const handleCreate = () => {
    setEditingClinic(null);
    setFormData({ name: '', hospitalId: '', email: '', password: '' });
    setShowModal(true);
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    const hospitalId = typeof clinic.hospitalId === 'object' ? clinic.hospitalId._id : clinic.hospitalId;
    setFormData({ name: clinic.name, hospitalId: hospitalId || '', email: '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClinic) {
        const response = await apiService.updateClinic({
          id: editingClinic._id,
          name: formData.name,
        });
        if (response.status === 200) {
          swal.success('Success', 'Clinic updated successfully');
          setShowModal(false);
          fetchClinics();
        } else {
          throw new Error(response.message || 'Failed to update clinic');
        }
      } else {
        const response = await apiService.createClinic({
          name: formData.name,
          hospitalId: formData.hospitalId || undefined,
          email: formData.email || undefined,
          password: formData.password || undefined,
        });
        if (response.status === 200) {
          swal.success('Success', 'Clinic created successfully');
          setShowModal(false);
          setFormData({ name: '', hospitalId: '', email: '', password: '' });
          fetchClinics();
        } else {
          throw new Error(response.message || 'Failed to create clinic');
        }
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await swal.confirm('Delete Clinic', 'Are you sure you want to delete this clinic?', 'warning');
      if (result.isConfirmed) {
        const response = await apiService.deleteClinic(id);
        if (response.status === 200) {
          swal.success('Success', 'Clinic deleted successfully');
          fetchClinics();
        } else {
          throw new Error(response.message || 'Failed to delete clinic');
        }
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to delete clinic');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await apiService.toggleClinicStatus(id);
      if (response.status === 200) {
        swal.success('Success', 'Clinic status updated successfully');
        fetchClinics();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update status');
    }
  };

  const userRole = user?.role || '';
  const canManage = userRole === 'SUPER_ADMIN' || userRole === 'super_admin' || userRole === 'HOSPITAL';

  if (!canManage && userRole !== 'CLINIC' && userRole !== 'DOCTOR') {
    return null;
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Clinics</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage clinics</p>
        </div>
        {canManage && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Clinic
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clinics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Clinics Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : clinics.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Hospital</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Created At</th>
                    {canManage && (
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {clinics.map((clinic) => {
                    const hospital = typeof clinic.hospitalId === 'object' ? clinic.hospitalId : null;
                    return (
                      <tr key={clinic._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{clinic.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{hospital?.name || '-'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {canManage ? (
                            <button
                              onClick={() => handleToggleStatus(clinic._id)}
                              className="flex items-center gap-2"
                            >
                              {clinic.isActive ? (
                                <ToggleRight className="h-6 w-6 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-gray-400" />
                              )}
                              <span className={clinic.isActive ? 'text-green-600' : 'text-gray-400'}>
                                {clinic.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          ) : (
                            <span className={clinic.isActive ? 'text-green-600' : 'text-gray-400'}>
                              {clinic.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(clinic.createdAt).toLocaleDateString()}
                        </td>
                        {canManage && (
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(clinic)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(clinic._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination - same as Hospitals */}
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
                                  ? 'z-10 bg-green-600 text-white focus:z-20'
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
            <p className="text-gray-500 dark:text-gray-400">No clinics found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {editingClinic ? 'Edit Clinic' : 'Create Clinic'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {(userRole === 'SUPER_ADMIN' || userRole === 'super_admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hospital <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.hospitalId}
                    onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Hospital</option>
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {!editingClinic && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password {formData.email && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      required={!!formData.email}
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  {editingClinic ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


import { useState, useEffect } from "react";
import apiService, { Doctor, Clinic } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Stethoscope } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', clinicId: '' });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    fetchDoctors();
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL' || user?.role === 'CLINIC') {
      fetchClinics();
    }
  }, [currentPage, searchTerm]);

  const fetchClinics = async () => {
    try {
      const response = await apiService.getClinics({ page: 1, limit: 1000 });
      if (response.status === 200 && response.data) {
        setClinics(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDoctors({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      });

      if (response.status === 200 && response.data) {
        setDoctors(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load doctors');
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      swal.error('Error', error.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDoctors();
  };

  const handleCreate = () => {
    setEditingDoctor(null);
    setFormData({ name: '', email: '', password: '', clinicId: '' });
    setShowModal(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    const clinicId = typeof doctor.clinicId === 'object' ? doctor.clinicId._id : doctor.clinicId;
    const userName = typeof doctor.userId === 'object' ? doctor.userId.name : '';
    setFormData({ name: userName, email: '', password: '', clinicId: clinicId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        const response = await apiService.updateDoctor({
          id: editingDoctor._id,
          isActive: undefined, // Will be handled by toggle
        });
        if (response.status === 200) {
          swal.success('Success', 'Doctor updated successfully');
          setShowModal(false);
          fetchDoctors();
        } else {
          throw new Error(response.message || 'Failed to update doctor');
        }
      } else {
        const response = await apiService.createDoctor({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          clinicId: formData.clinicId || undefined,
        });
        if (response.status === 200) {
          swal.success('Success', 'Doctor created successfully');
          setShowModal(false);
          setFormData({ name: '', email: '', password: '', clinicId: '' });
          fetchDoctors();
        } else {
          throw new Error(response.message || 'Failed to create doctor');
        }
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await swal.confirm('Delete Doctor', 'Are you sure you want to delete this doctor?', 'warning');
      if (result.isConfirmed) {
        const response = await apiService.deleteDoctor(id);
        if (response.status === 200) {
          swal.success('Success', 'Doctor deleted successfully');
          fetchDoctors();
        } else {
          throw new Error(response.message || 'Failed to delete doctor');
        }
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to delete doctor');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await apiService.toggleDoctorStatus(id);
      if (response.status === 200) {
        swal.success('Success', 'Doctor status updated successfully');
        fetchDoctors();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update status');
    }
  };

  const userRole = user?.role || '';
  const canManage = userRole === 'SUPER_ADMIN' || userRole === 'super_admin' || userRole === 'HOSPITAL' || userRole === 'CLINIC';

  if (!canManage && userRole !== 'DOCTOR') {
    return null;
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Doctors</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage doctors</p>
        </div>
        {canManage && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Doctor
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
              placeholder="Search doctors..."
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

      {/* Doctors Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : doctors.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Clinic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Created At</th>
                    {canManage && (
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {doctors.map((doctor) => {
                    const doctorUser = typeof doctor.userId === 'object' ? doctor.userId : null;
                    const clinic = typeof doctor.clinicId === 'object' ? doctor.clinicId : null;
                    return (
                      <tr key={doctor._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{doctorUser?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{doctorUser?.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{clinic?.name || '-'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {canManage ? (
                            <button
                              onClick={() => handleToggleStatus(doctor._id)}
                              className="flex items-center gap-2"
                            >
                              {doctor.isActive ? (
                                <ToggleRight className="h-6 w-6 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-gray-400" />
                              )}
                              <span className={doctor.isActive ? 'text-green-600' : 'text-gray-400'}>
                                {doctor.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          ) : (
                            <span className={doctor.isActive ? 'text-green-600' : 'text-gray-400'}>
                              {doctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(doctor.createdAt).toLocaleDateString()}
                        </td>
                        {canManage && (
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(doctor)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(doctor._id)}
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

            {/* Pagination - same pattern as other pages */}
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
            <p className="text-gray-500 dark:text-gray-400">No doctors found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {editingDoctor ? 'Edit Doctor' : 'Create Doctor'}
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
              {!editingDoctor && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'super_admin' || userRole === 'HOSPITAL') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Clinic <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.clinicId}
                        onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Clinic</option>
                        {clinics.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
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
                  {editingDoctor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


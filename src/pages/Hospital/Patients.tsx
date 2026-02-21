import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import apiService, { Patient } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Plus, Search, Edit, Trash2, Download, FileDown } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);
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
    fetchPatients();
  }, [currentPage, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatients({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      });

      if (response.status === 200 && response.data) {
        setPatients(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load patients');
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      swal.error('Error', error.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await swal.confirm('Delete Patient', 'Are you sure you want to delete this patient?', 'warning');
      if (result.isConfirmed) {
        await apiService.deletePatient(id);
        swal.success('Success', 'Patient deleted successfully');
        fetchPatients();
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to delete patient');
    }
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      if (type === 'pdf') {
        await apiService.exportPatients('pdf');
      } else {
        await apiService.exportPatients('excel');
      }
      swal.success('Success', `Patients exported as ${type.toUpperCase()} successfully`);
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to export patients');
    }
  };

  const userRole = user?.role || '';
  const canManage = userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC';
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC' || userRole === 'DOCTOR';

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Patients</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage all patients</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {canCreate && (
            <button
              onClick={() => navigate('/hospital/patients/create')}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </button>
          )}
          {canManage && (
            <>
              <button
                onClick={() => handleExport('excel')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <FileDown className="h-4 w-4" />
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
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

      {/* Patients Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : patients.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-3 sm:p-4">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                        {patient.name}
                      </h3>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Mobile:</span>
                          <span className="text-gray-700 dark:text-gray-300">{patient.mobile}</span>
                        </div>
                        {patient.address && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Address:</span>
                            <span className="text-gray-700 dark:text-gray-300 flex-1">{patient.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Doctor:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {typeof patient.doctorId === 'object' && patient.doctorId?.name
                              ? patient.doctorId.name
                              : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Clinic:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {typeof patient.clinicId === 'object' ? patient.clinicId.name : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">Created:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex flex-col gap-2 flex-shrink-0 ml-3">
                        <button
                          onClick={() => navigate(`/hospital/patients/${patient._id}/edit`)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 p-2"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 p-2"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Mobile</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Address</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Doctor</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Clinic</th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Created At</th>
                    {canManage && (
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {patients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 xl:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{patient.name}</td>
                      <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{patient.mobile}</td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{patient.address || '-'}</td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {typeof patient.doctorId === 'object' && patient.doctorId?.name
                          ? patient.doctorId.name
                          : '-'}
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {typeof patient.clinicId === 'object' ? patient.clinicId.name : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-4 xl:px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/hospital/patients/${patient._id}/edit`)}
                              className="text-brand-600 hover:text-brand-900 dark:text-brand-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(patient._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
            <p className="text-gray-500 dark:text-gray-400">No patients found</p>
          </div>
        )}
      </div>
    </>
  );
}

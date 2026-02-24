import { useState, useEffect } from "react";
import apiService, { Patient } from "../../services/api";
import swal from '../../utils/swalHelper';
import { Search, Edit, Trash2, Download, FileDown } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';

export default function HospitalPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', diagnosis: '', treatment: '', doctorId: '', clinicId: '', hospitalId: '' });
  const [formLoading, setFormLoading] = useState(false);

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
    fetchPatients();
  }, [currentPage, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHospitalPatients({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      });

      if (response.status === 200 && response.data) {
        setPatients(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load hospital patients');
      }
    } catch (error: any) {
      console.error('Error fetching hospital patients:', error);
      swal.error('Error', error.message || 'Failed to load hospital patients');
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

  const handleEdit = async (patient: Patient) => {
    try {
      setFormLoading(true);
      const response = await apiService.getPatientById(patient._id);
      if (response.status === 200 && response.data?.patient) {
        const patientData = response.data.patient;
        setEditingPatient(patientData);
        setFormData({
          name: patientData.name,
          mobile: patientData.mobile,
          address: patientData.address || '',
          diagnosis: patientData.diagnosis || '',
          treatment: patientData.treatment || '',
          doctorId: (patientData.doctorId && typeof patientData.doctorId === 'object') ? patientData.doctorId._id : (patientData.doctorId || ''),
          clinicId: (patientData.clinicId && typeof patientData.clinicId === 'object') ? patientData.clinicId._id : (patientData.clinicId || ''),
          hospitalId: (patientData.hospitalId && typeof patientData.hospitalId === 'object') ? patientData.hospitalId._id : (patientData.hospitalId || ''),
        });
        setShowModal(true);
      } else {
        throw new Error(response.message || 'Failed to load patient');
      }
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      swal.error('Error', error.message || 'Failed to load patient');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^\d{10}$/.test(formData.mobile)) {
      swal.error('Error', 'Mobile number must be exactly 10 digits');
      return;
    }

    try {
      setFormLoading(true);
      await apiService.updatePatient({
        id: editingPatient!._id,
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
      });
      swal.success('Success', 'Patient updated successfully');
      setShowModal(false);
      setEditingPatient(null);
      setFormData({ name: '', mobile: '', address: '', diagnosis: '', treatment: '', doctorId: '', clinicId: '', hospitalId: '' });
      fetchPatients();
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    } finally {
      setFormLoading(false);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Patients</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage patients added by Hospital Doctors</p>
          </div>
        </div>
      </div>

      {/* Search and Export */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, mobile, address, diagnosis, or treatment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          {canManage && (
            <div className="hidden sm:flex gap-2">
              <button
                type="button"
                onClick={() => handleExport('excel')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 shadow-sm hover:shadow transition-all"
              >
                <FileDown className="h-4 w-4" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 shadow-sm hover:shadow transition-all"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Patients Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : patients.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden p-3 space-y-3">
              {patients.map((patient: any) => {
                const hospitalName = typeof patient.hospitalId === 'object' ? patient.hospitalId?.name : 'N/A';
                const clinicName = typeof patient.clinicId === 'object' ? patient.clinicId?.name : 'N/A';
                const doctorName = typeof patient.doctorId === 'object' ? patient.doctorId?.name : 'N/A';
                
                return (
                  <div
                    key={patient._id}
                    className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {patient.mobile}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {new Date(patient.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(patient.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                      {hospitalName !== 'N/A' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Hospital:</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{hospitalName}</span>
                        </div>
                      )}
                      {clinicName !== 'N/A' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Clinic:</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{clinicName}</span>
                        </div>
                      )}
                      {doctorName !== 'N/A' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Doctor:</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{doctorName}</span>
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Patient Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Hospital Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Clinic Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Doctor Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created Date</th>
                    {canManage && (
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
                  {patients.map((patient: any) => {
                    const hospitalName = typeof patient.hospitalId === 'object' ? patient.hospitalId?.name : 'N/A';
                    const clinicName = typeof patient.clinicId === 'object' ? patient.clinicId?.name : 'N/A';
                    const doctorName = typeof patient.doctorId === 'object' ? patient.doctorId?.name : 'N/A';
                    
                    return (
                      <tr 
                        key={patient._id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {patient.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {patient.mobile}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {hospitalName !== 'N/A' ? hospitalName : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {clinicName !== 'N/A' ? clinicName : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {doctorName !== 'N/A' ? doctorName : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {new Date(patient.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(patient.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                        {canManage && (
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(patient)}
                                className="p-2 text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(patient._id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-4 py-3 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-medium text-gray-900 dark:text-white">{(currentPage - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * limit, totalDocs)}</span> of{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{totalDocs}</span> patients
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
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No hospital patients found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'No patients added by Hospital Doctors yet'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingPatient && canManage && (
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
                Edit Patient
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
              <form id="patient-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, mobile: value });
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder="Enter 10-digit mobile number"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be exactly 10 digits
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder="Enter diagnosis (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Treatment
                  </label>
                  <textarea
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder="Enter treatment details (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    placeholder="Enter patient address (optional)"
                  />
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
                  form="patient-form"
                  disabled={formLoading}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md"
                >
                  {formLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


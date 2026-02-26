import { useState, useEffect } from "react";
import apiService, { Patient, Hospital, Clinic, Doctor } from "../../services/api";
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
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', diagnosis: '', treatment: '', doctorId: '', clinicId: '', hospitalId: '' });
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Load dropdowns based on role
        if (userData.role === 'SUPER_ADMIN') {
          fetchHospitals();
        } else if (userData.role === 'HOSPITAL') {
          fetchClinicsForHospital();
        } else if (userData.role === 'CLINIC') {
          fetchDoctorsForClinic();
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    fetchPatients();
  }, [currentPage, searchTerm]);

  // Fetch doctors when clinic is selected (for super admin)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && formData.clinicId && !editingPatient) {
      fetchDoctors();
    }
  }, [formData.clinicId]);

  // Fetch clinics when hospital is selected (for super admin)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && formData.hospitalId && !editingPatient) {
      fetchClinics();
      setFormData(prev => ({ ...prev, clinicId: '', doctorId: '' }));
    }
  }, [formData.hospitalId]);

  // Fetch doctors when clinic is selected (for hospital)
  useEffect(() => {
    if (user?.role === 'HOSPITAL' && formData.clinicId && !editingPatient) {
      fetchDoctors();
      setFormData(prev => ({ ...prev, doctorId: '' }));
    }
  }, [formData.clinicId]);

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

  const fetchHospitals = async () => {
    try {
      const response = await apiService.getHospitals({ page: 1, limit: 1000, isActive: 'active' });
      if (response.status === 200 && response.data) {
        setHospitals(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const params: any = { page: 1, limit: 1000, isActive: 'active' };
      if (user?.role === 'SUPER_ADMIN' && formData.hospitalId) {
        params.hospitalId = formData.hospitalId;
      }
      const response = await apiService.getClinics(params);
      if (response.status === 200 && response.data) {
        setClinics(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchClinicsForHospital = async () => {
    try {
      const response = await apiService.getClinics({ page: 1, limit: 1000, isActive: 'active' });
      if (response.status === 200 && response.data) {
        setClinics(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const params: any = { page: 1, limit: 1000, isActive: 'active' };
      if (user?.role === 'SUPER_ADMIN' && formData.clinicId) {
        params.clinicId = formData.clinicId;
      } else if (user?.role === 'HOSPITAL' && formData.clinicId) {
        params.clinicId = formData.clinicId;
      } else if (user?.role === 'CLINIC') {
        params.clinicId = user._id;
      }
      const response = await apiService.getDoctors(params);
      if (response.status === 200 && response.data) {
        setDoctors(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchDoctorsForClinic = async () => {
    try {
      const response = await apiService.getDoctors({ page: 1, limit: 1000, isActive: 'active' });
      if (response.status === 200 && response.data) {
        setDoctors(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleCreate = () => {
    setEditingPatient(null);
    setFormData({ name: '', mobile: '', address: '', diagnosis: '', treatment: '', doctorId: '', clinicId: '', hospitalId: '' });
    setShowModal(true);
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
    
    // Validate mobile
    if (!/^\d{10}$/.test(formData.mobile)) {
      swal.error('Error', 'Mobile number must be exactly 10 digits');
      return;
    }

    try {
      setFormLoading(true);
      if (editingPatient) {
        await apiService.updatePatient({
          id: editingPatient._id,
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
      } else {
        const createData: any = {
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
        };

        // Personal Doctor creates patients without hospital/clinic
        if (user?.role === 'PERSONAL_DOCTOR') {
          // No doctorId, clinicId, or hospitalId needed - backend will handle it
        } else {
          // Add doctorId if provided (for super admin, hospital, clinic, doctor)
          if (formData.doctorId) {
            createData.doctorId = formData.doctorId;
          }
          if (formData.clinicId && user?.role === 'SUPER_ADMIN') {
            createData.clinicId = formData.clinicId;
          }
          if (formData.hospitalId && user?.role === 'SUPER_ADMIN') {
            createData.hospitalId = formData.hospitalId;
          }
        }

        await apiService.createPatient(createData);
        swal.success('Success', 'Patient created successfully');
        setShowModal(false);
        setFormData({ name: '', mobile: '', address: '', diagnosis: '', treatment: '', doctorId: '', clinicId: '', hospitalId: '' });
        fetchPatients();
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const userRole = user?.role || '';
  const canEdit = userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC' || userRole === 'DOCTOR' || userRole === 'PERSONAL_DOCTOR';
  const canDelete = userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC' || userRole === 'PERSONAL_DOCTOR';
  const canExport = userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC' || userRole === 'PERSONAL_DOCTOR';
  const canManage = canEdit || canDelete; // For showing Actions column header
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC' || userRole === 'DOCTOR' || userRole === 'PERSONAL_DOCTOR';

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage and monitor all patients</p>
            {/* Export buttons on mobile - below name */}
            {canExport && (
              <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
                <button
                  onClick={() => handleExport('excel')}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 shadow-sm hover:shadow transition-all"
                >
                  <FileDown className="h-4 w-4" />
                  Export Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 shadow-sm hover:shadow transition-all"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 shadow-sm hover:shadow transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add </span><span className="hidden sm:inline">Patient</span>
            </button>
          )}
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
          {/* Export buttons on desktop - replace search button */}
          {canExport && (
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
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                          {patient.name}
                        </h3>
                        <a 
                          href={`tel:${patient.mobile}`}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
                        >
                          {patient.mobile}
                        </a>
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

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                      {userRole === 'SUPER_ADMIN' && hospitalName !== 'N/A' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Hospital:</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{hospitalName}</span>
                        </div>
                      )}
                      {(userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL') && clinicName !== 'N/A' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Clinic:</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{clinicName}</span>
                        </div>
                      )}
                      {(userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC') && doctorName !== 'N/A' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Doctor:</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{doctorName}</span>
                        </div>
                      )}
                      {patient.address && (
                        <div className="col-span-2 flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Address:</span>
                          <span 
                            className="text-gray-700 dark:text-gray-300 line-clamp-2 cursor-help"
                            title={patient.address}
                          >
                            {patient.address}
                          </span>
                        </div>
                      )}
                      {patient.diagnosis && (
                        <div className="col-span-2 flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Diagnosis:</span>
                          <span 
                            className="text-gray-700 dark:text-gray-300 line-clamp-2 cursor-help"
                            title={patient.diagnosis}
                          >
                            {patient.diagnosis}
                          </span>
                        </div>
                      )}
                      {patient.treatment && (
                        <div className="col-span-2 flex items-start gap-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">Treatment:</span>
                          <span 
                            className="text-gray-700 dark:text-gray-300 line-clamp-3 cursor-help"
                            title={patient.treatment}
                          >
                            {patient.treatment}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(canEdit || canDelete) && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(patient)}
                            className="px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(patient._id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        )}
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
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[180px]">Patient</th>
                    {userRole !== 'DOCTOR' && userRole !== 'PERSONAL_DOCTOR' && (
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[220px]">Details</th>
                    )}
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[200px]">Address</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[200px]">Diagnosis</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[220px]">Treatment</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[140px]">Created At</th>
                    {canManage && (
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[100px]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
                  {patients.map((patient: any) => {
                    const hospitalName = typeof patient.hospitalId === 'object' ? patient.hospitalId?.name : 'N/A';
                    const clinicName = typeof patient.clinicId === 'object' ? patient.clinicId?.name : 'N/A';
                    const doctorName = typeof patient.doctorId === 'object' ? patient.doctorId?.name : 'N/A';
                    
                    const detailsText = [
                      userRole === 'SUPER_ADMIN' && hospitalName !== 'N/A' ? `Hospital: ${hospitalName}` : '',
                      (userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL') && clinicName !== 'N/A' ? `Clinic: ${clinicName}` : '',
                      (userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC') && doctorName !== 'N/A' ? `Doctor: ${doctorName}` : ''
                    ].filter(Boolean).join(' • ');
                    
                    return (
                      <tr 
                        key={patient._id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {patient.name}
                          </div>
                          <a 
                            href={`tel:${patient.mobile}`}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors mt-0.5"
                          >
                            {patient.mobile}
                          </a>
                        </td>
                        {userRole !== 'DOCTOR' && userRole !== 'PERSONAL_DOCTOR' && (
                          <td className="px-4 py-4">
                            <div 
                              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                              title={detailsText}
                            >
                              {userRole === 'SUPER_ADMIN' && hospitalName !== 'N/A' && (
                                <div className="mb-1">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Hospital: </span>
                                  <span className="text-gray-900 dark:text-white">{hospitalName}</span>
                                </div>
                              )}
                              {(userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL') && clinicName !== 'N/A' && (
                                <div className="mb-1">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Clinic: </span>
                                  <span className="text-gray-900 dark:text-white">{clinicName}</span>
                                </div>
                              )}
                              {(userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC') && doctorName !== 'N/A' && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Doctor: </span>
                                  <span className="text-gray-900 dark:text-white">{doctorName}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-4">
                          <div 
                            className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 cursor-help"
                            title={patient.address || undefined}
                          >
                            {patient.address || <span className="text-gray-400 dark:text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div 
                            className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 cursor-help"
                            title={patient.diagnosis || undefined}
                          >
                            {patient.diagnosis || <span className="text-gray-400 dark:text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div 
                            className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 cursor-help"
                            title={patient.treatment || undefined}
                          >
                            {patient.treatment || <span className="text-gray-400 dark:text-gray-500">-</span>}
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
                        {(canEdit || canDelete) && (
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1.5">
                              {canEdit && (
                                <button
                                  onClick={() => handleEdit(patient)}
                                  className="p-2 text-brand-600 hover:bg-brand-600/10 dark:hover:bg-brand-600/20 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(patient._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
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
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No patients found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new patient'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && canCreate && (
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
                {editingPatient ? 'Edit Patient' : 'Create Patient'}
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
              <form id="patient-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {user?.role === 'SUPER_ADMIN' && !editingPatient && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hospital <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.hospitalId}
                        onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value, clinicId: '', doctorId: '' })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                      >
                        <option value="">Select Hospital</option>
                        {hospitals.map((h) => (
                          <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Clinic <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.clinicId}
                        onChange={(e) => setFormData({ ...formData, clinicId: e.target.value, doctorId: '' })}
                        disabled={!formData.hospitalId}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{formData.hospitalId ? 'Select Clinic' : 'Select Hospital first'}</option>
                        {clinics.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL' || user?.role === 'CLINIC') && !editingPatient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                      disabled={(user?.role === 'SUPER_ADMIN' && !formData.clinicId) || (user?.role === 'HOSPITAL' && !formData.clinicId)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {user?.role === 'SUPER_ADMIN' && !formData.clinicId
                          ? 'Select Clinic first'
                          : user?.role === 'HOSPITAL' && !formData.clinicId
                          ? 'Select Clinic first'
                          : 'Select Doctor'}
                      </option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {user?.role === 'HOSPITAL' && !editingPatient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Clinic <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.clinicId}
                      onChange={(e) => setFormData({ ...formData, clinicId: e.target.value, doctorId: '' })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
                    >
                      <option value="">Select Clinic</option>
                      {clinics.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                  form="patient-form"
                  disabled={formLoading}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md"
                >
                  {formLoading ? 'Saving...' : editingPatient ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

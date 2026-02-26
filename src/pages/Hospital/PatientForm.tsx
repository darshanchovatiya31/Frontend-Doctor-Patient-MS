import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import apiService, { Hospital, Clinic, Doctor } from "../../services/api";
import swal from '../../utils/swalHelper';
import { ArrowLeft, Save } from 'lucide-react';
import { FormSkeleton } from '../../components/common/Skeleton';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', diagnosis: '', treatment: '', doctorId: '', clinicId: '', hospitalId: '' });
  const [user, setUser] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const isEdit = !!id;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Load dropdowns based on role
        if (!isEdit) {
          if (userData.role === 'SUPER_ADMIN') {
            fetchHospitals();
          } else if (userData.role === 'HOSPITAL') {
            fetchClinicsForHospital();
          } else if (userData.role === 'CLINIC') {
            fetchDoctorsForClinic();
          }
        }
        
        // Doctors can now edit their own patients
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    if (isEdit) {
      fetchPatient();
    }
  }, [id]);

  // Fetch doctors when clinic is selected (for super admin)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && formData.clinicId && !isEdit) {
      fetchDoctors();
    }
  }, [formData.clinicId]);

  // Fetch clinics when hospital is selected (for super admin)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && formData.hospitalId && !isEdit) {
      fetchClinics();
      setFormData(prev => ({ ...prev, clinicId: '', doctorId: '' }));
    }
  }, [formData.hospitalId]);

  // Fetch doctors when clinic is selected (for hospital)
  useEffect(() => {
    if (user?.role === 'HOSPITAL' && formData.clinicId && !isEdit) {
      fetchDoctors();
      setFormData(prev => ({ ...prev, doctorId: '' }));
    }
  }, [formData.clinicId]);

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

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatientById(id!);
      if (response.status === 200 && response.data?.patient) {
        const patient = response.data.patient;
        setFormData({
          name: patient.name,
          mobile: patient.mobile,
          address: patient.address || '',
          diagnosis: patient.diagnosis || '',
          treatment: patient.treatment || '',
          doctorId: typeof patient.doctorId === 'object' ? patient.doctorId._id : patient.doctorId || '',
          clinicId: typeof patient.clinicId === 'object' ? patient.clinicId._id : patient.clinicId || '',
          hospitalId: typeof patient.hospitalId === 'object' ? patient.hospitalId._id : patient.hospitalId || '',
        });
      } else {
        throw new Error(response.message || 'Failed to load patient');
      }
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      swal.error('Error', error.message || 'Failed to load patient');
      navigate('/hospital/patients');
    } finally {
      setLoading(false);
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
      setLoading(true);
      if (isEdit) {
        await apiService.updatePatient({
          id: id!,
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
        });
        swal.success('Success', 'Patient updated successfully');
        navigate('/hospital/patients');
      } else {
        const createData: any = {
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
        };

        // Add doctorId if provided (for super admin, hospital, clinic)
        if (formData.doctorId) {
          createData.doctorId = formData.doctorId;
        }
        if (formData.clinicId && user?.role === 'SUPER_ADMIN') {
          createData.clinicId = formData.clinicId;
        }
        if (formData.hospitalId && user?.role === 'SUPER_ADMIN') {
          createData.hospitalId = formData.hospitalId;
        }

        await apiService.createPatient(createData);
        swal.success('Success', 'Patient created successfully');
        navigate('/hospital/patients');
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const userRole = user?.role || '';

  if (loading && isEdit) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <FormSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/hospital/patients')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Patient' : 'Create Patient'}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {isEdit ? 'Update patient information' : 'Add a new patient to your list'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {userRole === 'SUPER_ADMIN' && !isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hospital <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value, clinicId: '', doctorId: '' })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.hospitalId ? 'Select Clinic' : 'Select Hospital first'}</option>
                  {clinics.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {(userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC') && !isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                disabled={(userRole === 'SUPER_ADMIN' && !formData.clinicId) || (userRole === 'HOSPITAL' && !formData.clinicId)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {userRole === 'SUPER_ADMIN' && !formData.clinicId
                    ? 'Select Clinic first'
                    : userRole === 'HOSPITAL' && !formData.clinicId
                    ? 'Select Clinic first'
                    : 'Select Doctor'}
                </option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          {userRole === 'HOSPITAL' && !isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinic <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.clinicId}
                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value, doctorId: '' })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
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
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
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
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
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
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
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
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
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
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              placeholder="Enter patient address (optional)"
            />
          </div>

          <div className="flex gap-3 sm:gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/hospital/patients')}
              className="flex-1 sm:flex-initial rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : isEdit ? 'Update Patient' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

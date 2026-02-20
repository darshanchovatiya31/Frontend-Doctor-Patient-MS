import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import apiService, { Patient } from "../../services/api";
import swal from '../../utils/swalHelper';
import { ArrowLeft, Save } from 'lucide-react';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '' });
  const [user, setUser] = useState<any>(null);
  const isEdit = !!id;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Check permissions
        if (isEdit && userData.role === 'DOCTOR') {
          swal.error('Error', 'Doctors cannot edit patients');
          navigate('/hospital/patients');
          return;
        }
        
        if (!isEdit && userData.role !== 'DOCTOR') {
          swal.error('Error', 'Only doctors can create patients');
          navigate('/hospital/patients');
          return;
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    if (isEdit) {
      fetchPatient();
    }
  }, [id]);

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
        const response = await apiService.updatePatient({
          id: id!,
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
        });
        if (response.status === 200) {
          swal.success('Success', 'Patient updated successfully');
          navigate('/hospital/patients');
        } else {
          throw new Error(response.message || 'Failed to update patient');
        }
      } else {
        const response = await apiService.createPatient({
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
        });
        if (response.status === 200) {
          swal.success('Success', 'Patient created successfully');
          navigate('/hospital/patients');
        } else {
          throw new Error(response.message || 'Failed to create patient');
        }
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter 10-digit mobile number"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be exactly 10 digits
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter patient address (optional)"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => navigate('/hospital/patients')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
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


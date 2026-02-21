import { useState, useEffect } from "react";
import apiService, { DashboardStats, Patient } from "../../services/api";
import swal from '../../utils/swalHelper';
import { 
  Building2, 
  Stethoscope, 
  Users, 
  Calendar,
  UserCheck
} from 'lucide-react';

export default function HospitalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboardStats();
      if (response.status === 200 && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      swal.error('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const userRole = user?.role || '';

  return (
    <>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {userRole === 'SUPER_ADMIN' && 'Super Admin Dashboard'}
            {userRole === 'HOSPITAL' && 'Hospital Dashboard'}
            {userRole === 'CLINIC' && 'Clinic Dashboard'}
            {userRole === 'DOCTOR' && 'Doctor Dashboard'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Super Admin Stats */}
        {userRole === 'SUPER_ADMIN' && (
          <>
            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Hospitals</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalHospitals?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 ml-2 flex-shrink-0">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Clinics</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalClinics?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Doctors</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalDoctors?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
                  <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Hospital Stats */}
        {userRole === 'HOSPITAL' && (
          <>
            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Clinics</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalClinics?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Doctors</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalDoctors?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
                  <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Clinic Stats */}
        {userRole === 'CLINIC' && (
          <>
            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Doctors</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalDoctors?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
                  <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active Doctors</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.activeDoctors?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
                  <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Doctor Stats */}
        {userRole === 'DOCTOR' && (
          <>
            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Today's Patients</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.todayPatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 ml-2 flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Patients (Doctor only) */}
      {userRole === 'DOCTOR' && stats?.recentPatients && stats.recentPatients.length > 0 && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Patients</h3>
          </div>
          <div className="space-y-4">
            {stats.recentPatients.map((patient: Patient) => (
              <div key={patient._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-800">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-500/20">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {patient.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {patient.mobile} • {patient.address || 'No address'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}


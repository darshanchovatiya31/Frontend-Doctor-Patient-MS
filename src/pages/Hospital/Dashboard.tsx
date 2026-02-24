import { useState, useEffect } from "react";
import { Link } from "react-router";
import apiService, { DashboardStats } from "../../services/api";
import swal from '../../utils/swalHelper';
import { 
  Building2, 
  Stethoscope, 
  Users, 
  Calendar,
  UserCheck
} from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton';

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
    return <DashboardSkeleton />;
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
      <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
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
                <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 ml-2 flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Latest Patients - All Roles */}
      {stats?.recentPatients && stats.recentPatients.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Latest Patients</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {userRole === 'SUPER_ADMIN' && 'Last 5 patients from all hospitals'}
                  {userRole === 'HOSPITAL' && 'Last 5 patients from your hospital'}
                  {userRole === 'CLINIC' && 'Last 5 patients from your clinic'}
                  {userRole === 'DOCTOR' && 'Last 5 patients created by you'}
                </p>
              </div>
              {stats.recentPatients.length === 5 && (
                <Link
                  to="/hospital/patients"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  View All →
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[180px]">Patient</th>
                  {userRole !== 'DOCTOR' && (
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[220px]">Details</th>
                  )}
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[200px]">Address</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[200px]">Diagnosis</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[220px]">Treatment</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[140px]">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
                {stats.recentPatients.map((patient: any) => {
                  const hospitalName = typeof patient.hospitalId === 'object' ? patient.hospitalId?.name : 'N/A';
                  const clinicName = typeof patient.clinicId === 'object' ? patient.clinicId?.name : 'N/A';
                  const doctorName = typeof patient.doctorId === 'object' ? patient.doctorId?.name : 'N/A';
                  
                  const detailsText = [
                    userRole === 'SUPER_ADMIN' && hospitalName !== 'N/A' ? `Hospital: ${hospitalName}` : '',
                    (userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL') && clinicName !== 'N/A' ? `Clinic: ${clinicName}` : '',
                    (userRole === 'SUPER_ADMIN' || userRole === 'HOSPITAL' || userRole === 'CLINIC') && doctorName !== 'N/A' ? `Doctor: ${doctorName}` : ''
                  ].filter(Boolean).join(' • ');
                  
                  return (
                    <tr key={patient._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {patient.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {patient.mobile}
                        </div>
                      </td>
                      {userRole !== 'DOCTOR' && (
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 p-4">
            {stats.recentPatients.map((patient: any) => {
              const hospitalName = typeof patient.hospitalId === 'object' ? patient.hospitalId?.name : 'N/A';
              const clinicName = typeof patient.clinicId === 'object' ? patient.clinicId?.name : 'N/A';
              const doctorName = typeof patient.doctorId === 'object' ? patient.doctorId?.name : 'N/A';
              
              return (
                <div key={patient._id} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                        {patient.name}
                      </h4>
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

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}


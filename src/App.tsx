import { HashRouter, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";

import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Hospital Management Pages
import HospitalDashboard from "./pages/Hospital/Dashboard";
import HospitalsPage from "./pages/Hospital/Hospitals";
import ClinicsPage from "./pages/Hospital/Clinics";
import DoctorsPage from "./pages/Hospital/Doctors";
import PatientsPage from "./pages/Hospital/Patients";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0891b2] dark:border-gray-700 dark:border-t-[#0891b2]"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0891b2] dark:border-gray-700 dark:border-t-[#0891b2]"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <>{children}</>;
  }
  
  // Redirect based on user role
  // Note: CLINIC cannot login, so they won't reach here
  let redirectPath = '/hospital/dashboard';
  if (user) {
    const userRole = (user as any).role;
    if (['SUPER_ADMIN', 'HOSPITAL', 'DOCTOR'].includes(userRole)) {
      redirectPath = '/hospital/dashboard';
    }
  }
  
  return <Navigate to={redirectPath} replace />;
}

// Dashboard Redirect Component - redirects based on user role
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (user) {
    const userRole = (user as any).role;
    // Redirect all roles to their appropriate dashboard
    // Note: CLINIC cannot login, so they won't reach here
    if (['SUPER_ADMIN', 'HOSPITAL', 'DOCTOR'].includes(userRole)) {
      return <Navigate to="/hospital/dashboard" replace />;
    }
  }
  
  // Fallback: redirect to hospital dashboard if no role matches
  return <Navigate to="/hospital/dashboard" replace />;
}

function AppRoutes() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index path="/" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfiles />
            </ProtectedRoute>
          } />
          
          {/* Hospital Management Routes */}
          <Route path="/hospital/dashboard" element={
            <ProtectedRoute>
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hospital/hospitals" element={
            <ProtectedRoute>
              <HospitalsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/clinics" element={
            <ProtectedRoute>
              <ClinicsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/doctors" element={
            <ProtectedRoute>
              <DoctorsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/patients" element={
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* delete route:- Patients, Categories, Doctors & Labs, Slots, BookingHistory */}

        {/* Auth Layout */}
        <Route path="/signin" element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        } />
        {/* Super Admin Registration Route - Commented out after initial setup */}
        {/* <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } /> */}

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

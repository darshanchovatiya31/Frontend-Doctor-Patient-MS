import { HashRouter, Routes, Route, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import SignIn from "./pages/AuthPages/SignIn";
import Register from "./pages/AuthPages/Register";
import NotFound from "./pages/OtherPage/NotFound";

import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Hospital Management Pages
import HospitalDashboard from "./pages/Hospital/Dashboard";
import HospitalsPage from "./pages/Hospital/Hospitals";
import ClinicsPage from "./pages/Hospital/Clinics";
import DoctorsPage from "./pages/Hospital/Doctors";
import PatientsPage from "./pages/Hospital/Patients";
import PatientForm from "./pages/Hospital/PatientForm";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <>{children}</>;
  }
  
  // Redirect based on user role
  let redirectPath = '/';
  if (user) {
    const userRole = (user as any).role;
    if (userRole === 'SUPER_ADMIN') {
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
    if (userRole === 'SUPER_ADMIN') {
      return <Navigate to="/hospital/dashboard" replace />;
    }
  }
  
  return <Home />;
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
          <Route path="/hospital/patients/create" element={
            <ProtectedRoute>
              <PatientForm />
            </ProtectedRoute>
          } />
          <Route path="/hospital/patients/:id/edit" element={
            <ProtectedRoute>
              <PatientForm />
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

// Get API URL from environment variable
// Make sure to set VITE_API_URL in your .env file
// Admin API (for admin panel) - uses /api/admin routes
export const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3300/api/admin';
// Hospital Management API - uses /api routes (not /api/admin)
export const HOSPITAL_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3300/api';
// Legacy: Keep for backward compatibility (defaults to admin API)
export const API_BASE_URL = ADMIN_API_BASE_URL;

// Types
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  profileImage?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalAdmins?: number;
  activeAdmins?: number;
  recentAdmins?: Admin[];
  // Hospital Management Stats
  totalHospitals?: number;
  totalClinics?: number;
  totalDoctors?: number;
  totalPatients?: number;
  activeDoctors?: number;
  todayPatients?: number;
  recentPatients?: Patient[];
}

export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL' | 'CLINIC' | 'DOCTOR';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
  clinicId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  _id: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  _id: string;
  name: string;
  hospitalId: string | Hospital;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  _id: string;
  userId: string | User;
  clinicId: string | Clinic;
  hospitalId: string | Hospital;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  name: string;
  mobile: string;
  address?: string;
  doctorId: string | Doctor;
  clinicId: string | Clinic;
  hospitalId: string | Hospital;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Get base URL (without /api/admin) for image URLs
  getBaseUrl(): string {
    return ADMIN_API_BASE_URL.replace('/api/admin', '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = API_BASE_URL
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle network errors
      if (!response.ok && response.status === 0) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }

      // Try to parse JSON response
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
        }
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text || response.statusText}`);
      }
      
      // Handle non-200 status codes
      if (!response.ok) {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.message).join(', ');
          throw new Error(errorMessages);
        }
        
        // Handle backend error response format (consistent format)
        if (data.message) {
          throw new Error(data.message);
        }
        
        // Handle different error formats
        if (data.Message) {
          throw new Error(data.Message);
        }
        
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
      
      // Check if response has status field indicating error (backend sometimes returns 200 with error status)
      if (data.status && data.status !== 200 && data.status !== 201) {
        if (data.message) {
          throw new Error(data.message);
        }
        throw new Error('Request failed');
      }
      
      return data;
    } catch (error: any) {
      console.error('API Request failed:', {
        url,
        error: error.message,
        endpoint
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running on http://localhost:3000');
      }
      
      throw error;
    }
  }

  // Authentication (Admin Panel)
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; admin: Admin }>> {
  const response = await this.request('/login', {
    body: JSON.stringify({ email, password }),
  }, ADMIN_API_BASE_URL) as ApiResponse<{ token: string; admin: Admin }>; // ✅ assert type

  // Check if login was successful - backend returns message "Invalid credentials." when login fails
  if (!response.data || !response.data.token) {
    const errorMessage = response.message || 'Invalid email or password. Please check your credentials and try again.';
    throw new Error(errorMessage);
  }

  if (response.data.token) {
    this.token = response.data.token;
    localStorage.setItem('authToken', this.token);
    localStorage.setItem('user', JSON.stringify(response.data.admin));
  }

  return response;
}


  async register(adminData: Partial<Admin> & { password: string }): Promise<ApiResponse<{ token: string; admin: Admin }>> {
    const response = await this.request('/register', {
      body: JSON.stringify(adminData),
    }, ADMIN_API_BASE_URL) as ApiResponse<{ token: string; admin: Admin }>;

    // Check if registration was successful
    if (!response.data || !response.data.token) {
      const errorMessage = response.message || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }

    // Store token and user data
    if (response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(response.data.admin));
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/logout', {}, ADMIN_API_BASE_URL);
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return response;
  }

// Profile (Admin Panel)
async getProfile(id?: string): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request('/profile', {
      method: 'POST',
      body: JSON.stringify(id ? { id } : {})
    }, ADMIN_API_BASE_URL);
  }

  async updateProfile(profileData: { name?: string; email?: string; id?: string }): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request('/profile/update', {
      method: 'POST',
      body: JSON.stringify(profileData)
    }, ADMIN_API_BASE_URL);
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{}>> {
    return this.request('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    }, ADMIN_API_BASE_URL);
  }

  // Admins
  async getAdmins(params: PaginationParams & { role?: string; status?: string } = {}): Promise<ApiResponse> {
    return this.request('/admins', {
      body: JSON.stringify(params),
    }, ADMIN_API_BASE_URL);
  }

  async createAdmin(adminData: Partial<Admin> & { password: string }): Promise<ApiResponse<{ admin: Admin }>> {
    const response = await this.request<{ admin: Admin } | 0>('/admins/create', {
      body: JSON.stringify(adminData),
    }, ADMIN_API_BASE_URL);
    
    // Check if backend returned an error message with data: 0 (status 200 but error condition)
    if (response.data === 0 || response.data === null || (!response.data && response.message)) {
      throw new Error(response.message || 'Failed to create admin');
    }
    
    return response as ApiResponse<{ admin: Admin }>;
  }

  async updateAdmin(adminData: Partial<Admin> & { id: string }): Promise<ApiResponse<{ admin: Admin }>> {
    const response = await this.request<{ admin: Admin } | 0>('/admins/update', {
      body: JSON.stringify(adminData),
    }, ADMIN_API_BASE_URL);
    
    // Check if backend returned an error message with data: 0 (status 200 but error condition)
    if (response.data === 0 || response.data === null || (!response.data && response.message)) {
      throw new Error(response.message || 'Failed to update admin');
    }
    
    return response as ApiResponse<{ admin: Admin }>;
  }

  async deleteAdmin(id: string): Promise<ApiResponse> {
    return this.request('/admins/delete', {
      body: JSON.stringify({ id }),
    }, ADMIN_API_BASE_URL);
  }

  async toggleAdminStatus(id: string, isActive: boolean): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request('/admins/update', {
      body: JSON.stringify({ id, isActive }),
    }, ADMIN_API_BASE_URL);
  }

  async getAdminStats(): Promise<ApiResponse> {
    return this.request('/admins/stats', {}, ADMIN_API_BASE_URL);
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats', {
      method: 'POST',
      body: JSON.stringify({})
    }, HOSPITAL_API_BASE_URL);
  }

  // ==================== HOSPITAL MANAGEMENT API ====================
  
  // Auth (Hospital Management)
  async hospitalLogin(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, HOSPITAL_API_BASE_URL) as ApiResponse<{ token: string; user: User }>;

    if (!response.data || !response.data.token) {
      throw new Error(response.message || 'Invalid credentials');
    }

    if (response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async getHospitalProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/profile', {
      method: 'POST',
      body: JSON.stringify({})
    }, HOSPITAL_API_BASE_URL);
  }

  async updateHospitalProfile(data: { name?: string; email?: string }): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/profile/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async changeHospitalPassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.request('/auth/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  // Hospitals
  async getHospitals(params: PaginationParams & { isActive?: string } = {}): Promise<ApiResponse> {
    return this.request('/hospitals/list', {
      method: 'POST',
      body: JSON.stringify(params)
    }, HOSPITAL_API_BASE_URL);
  }

  async createHospital(data: { name: string; address?: string; email: string; password: string }): Promise<ApiResponse<{ hospital: Hospital; user: User }>> {
    return this.request('/hospitals', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async getHospitalById(id: string): Promise<ApiResponse<{ hospital: Hospital }>> {
    return this.request(`/hospitals/${id}`, {
      method: 'GET'
    }, HOSPITAL_API_BASE_URL);
  }

  async updateHospital(data: { id: string; name?: string; address?: string; isActive?: boolean }): Promise<ApiResponse<{ hospital: Hospital }>> {
    return this.request('/hospitals/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async deleteHospital(id: string): Promise<ApiResponse> {
    return this.request('/hospitals/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  async toggleHospitalStatus(id: string): Promise<ApiResponse<{ hospital: Hospital }>> {
    return this.request('/hospitals/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  // Clinics
  async getClinics(params: PaginationParams & { hospitalId?: string; isActive?: string } = {}): Promise<ApiResponse> {
    return this.request('/clinics/list', {
      method: 'POST',
      body: JSON.stringify(params)
    }, HOSPITAL_API_BASE_URL);
  }

  async createClinic(data: { name: string; hospitalId?: string; email?: string; password?: string }): Promise<ApiResponse<{ clinic: Clinic; user?: User }>> {
    return this.request('/clinics', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async getClinicById(id: string): Promise<ApiResponse<{ clinic: Clinic }>> {
    return this.request(`/clinics/${id}`, {
      method: 'GET'
    }, HOSPITAL_API_BASE_URL);
  }

  async updateClinic(data: { id: string; name?: string; isActive?: boolean }): Promise<ApiResponse<{ clinic: Clinic }>> {
    return this.request('/clinics/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async deleteClinic(id: string): Promise<ApiResponse> {
    return this.request('/clinics/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  async toggleClinicStatus(id: string): Promise<ApiResponse<{ clinic: Clinic }>> {
    return this.request('/clinics/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  // Doctors
  async getDoctors(params: PaginationParams & { clinicId?: string; hospitalId?: string; isActive?: string } = {}): Promise<ApiResponse> {
    return this.request('/doctors/list', {
      method: 'POST',
      body: JSON.stringify(params)
    }, HOSPITAL_API_BASE_URL);
  }

  async createDoctor(data: { name: string; email: string; password: string; clinicId?: string; hospitalId?: string }): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async getDoctorById(id: string): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request(`/doctors/${id}`, {
      method: 'GET'
    }, HOSPITAL_API_BASE_URL);
  }

  async updateDoctor(data: { id: string; isActive?: boolean }): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request('/doctors/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async deleteDoctor(id: string): Promise<ApiResponse> {
    return this.request('/doctors/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  async toggleDoctorStatus(id: string): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request('/doctors/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  // Patients
  async getPatients(params: PaginationParams & { doctorId?: string; clinicId?: string; hospitalId?: string } = {}): Promise<ApiResponse> {
    return this.request('/patients/list', {
      method: 'POST',
      body: JSON.stringify(params)
    }, HOSPITAL_API_BASE_URL);
  }

  async createPatient(data: { name: string; mobile: string; address?: string }): Promise<ApiResponse<{ patient: Patient }>> {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async getPatientById(id: string): Promise<ApiResponse<{ patient: Patient }>> {
    return this.request(`/patients/${id}`, {
      method: 'GET'
    }, HOSPITAL_API_BASE_URL);
  }

  async updatePatient(data: { id: string; name?: string; mobile?: string; address?: string }): Promise<ApiResponse<{ patient: Patient }>> {
    return this.request('/patients/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }, HOSPITAL_API_BASE_URL);
  }

  async deletePatient(id: string): Promise<ApiResponse> {
    return this.request('/patients/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    }, HOSPITAL_API_BASE_URL);
  }

  // Export
  async exportDoctors(type: 'pdf' | 'excel' = 'excel'): Promise<void> {
    const token = localStorage.getItem('authToken');
    const url = `${HOSPITAL_API_BASE_URL}/export/doctors?type=${type}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `doctors.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  async exportPatients(type: 'pdf' | 'excel' = 'excel'): Promise<void> {
    const token = localStorage.getItem('authToken');
    const url = `${HOSPITAL_API_BASE_URL}/export/patients?type=${type}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `patients.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const apiService = new ApiService();
export default apiService;
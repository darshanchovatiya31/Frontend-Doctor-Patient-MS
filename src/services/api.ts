// Get API URL from environment variable
// Make sure to set VITE_API_URL in your .env file
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3300/api/admin';

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
  totalAdmins: number;
  activeAdmins: number;
  recentAdmins: Admin[];
}

// API Service Class
class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Get base URL (without /api/admin) for image URLs
  getBaseUrl(): string {
    return API_BASE_URL.replace('/api/admin', '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
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

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; admin: Admin }>> {
  const response = await this.request('/login', {
    body: JSON.stringify({ email, password }),
  }) as ApiResponse<{ token: string; admin: Admin }>; // ✅ assert type

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
    }) as ApiResponse<{ token: string; admin: Admin }>;

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
    const response = await this.request('/logout');
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return response;
  }

// Profile
async getProfile(id?: string): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request('/profile', {
      method: 'POST',
      body: JSON.stringify(id ? { id } : {})
    });
  }

  async updateProfile(profileData: { name?: string; email?: string; id?: string }): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request('/profile/update', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{}>> {
    return this.request('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
  }

  // Admins
  async getAdmins(params: PaginationParams & { role?: string; status?: string } = {}): Promise<ApiResponse> {
    return this.request('/admins', {
      body: JSON.stringify(params),
    });
  }

  async createAdmin(adminData: Partial<Admin> & { password: string }): Promise<ApiResponse<{ admin: Admin }>> {
    const response = await this.request<{ admin: Admin } | 0>('/admins/create', {
      body: JSON.stringify(adminData),
    });
    
    // Check if backend returned an error message with data: 0 (status 200 but error condition)
    if (response.data === 0 || response.data === null || (!response.data && response.message)) {
      throw new Error(response.message || 'Failed to create admin');
    }
    
    return response as ApiResponse<{ admin: Admin }>;
  }

  async updateAdmin(adminData: Partial<Admin> & { id: string }): Promise<ApiResponse<{ admin: Admin }>> {
    const response = await this.request<{ admin: Admin } | 0>('/admins/update', {
      body: JSON.stringify(adminData),
    });
    
    // Check if backend returned an error message with data: 0 (status 200 but error condition)
    if (response.data === 0 || response.data === null || (!response.data && response.message)) {
      throw new Error(response.message || 'Failed to update admin');
    }
    
    return response as ApiResponse<{ admin: Admin }>;
  }

  async deleteAdmin(id: string): Promise<ApiResponse> {
    return this.request('/admins/delete', {
      body: JSON.stringify({ id }),
    });
  }

  async toggleAdminStatus(id: string, isActive: boolean): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request('/admins/update', {
      body: JSON.stringify({ id, isActive }),
    });
  }

  async getAdminStats(): Promise<ApiResponse> {
    return this.request('/admins/stats');
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats');
  }
}

export const apiService = new ApiService();
export default apiService;
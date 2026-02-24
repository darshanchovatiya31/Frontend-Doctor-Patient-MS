import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, Calendar, User } from "lucide-react";
import swal from '../utils/swalHelper';
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Form from "../components/form/Form";
import api from "../services/api"; // Adjust path to your API class instance
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

interface UserProfile {
  email: string;
  name: string; // Added name
  role: string;
  joinDate: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfiles() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: "",
    name: "",
    role: "",
    joinDate: ""
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: ""
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState({
    profile: "",
    password: "",
    general: ""
  });

  const [isLoading, setIsLoading] = useState({
    profile: false,
    password: false
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if user is from hospital management system (HOSPITAL, CLINIC, DOCTOR, PERSONAL_DOCTOR, SUPER_ADMIN)
        const isHospitalUser = user && ['HOSPITAL', 'CLINIC', 'DOCTOR', 'PERSONAL_DOCTOR', 'SUPER_ADMIN'].includes(user.role);
        
        let response;
        if (isHospitalUser) {
          response = await apiService.getHospitalProfile();
        } else {
          response = await api.getProfile();
        }
        
        if (response.status === 200) {
          // Hospital API returns { user }, Admin API returns { admin }
          const userData = isHospitalUser 
            ? (response.data as { user: any }).user 
            : (response.data as { admin: any }).admin;
          setUserProfile({
            email: userData.email || '',
            name: userData.name,
            role: userData.role,
            joinDate: userData.createdAt
          });
          setProfileForm({
            name: userData.name,
            email: userData.email || ''
          });
        } else {
          setErrors(prev => ({ ...prev, general: response.message || "Failed to load profile" }));
          swal.error('Error', response.message || 'Failed to load profile');
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, general: "Failed to load profile. Please try again." }));
        swal.error('Error', 'Failed to load profile. Please try again.');
      }
    };

    fetchProfile();
  }, [user]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Handle profile update (name and email)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, profile: true }));
    setErrors(prev => ({ ...prev, profile: "" }));

    // Validation
    if (!profileForm.name || !profileForm.email) {
      setErrors(prev => ({ ...prev, profile: "Name and email are required" }));
      setIsLoading(prev => ({ ...prev, profile: false }));
      swal.error('Error', 'Name and email are required');
      return;
    }

    if (!validateEmail(profileForm.email)) {
      setErrors(prev => ({ ...prev, profile: "Please enter a valid email address" }));
      setIsLoading(prev => ({ ...prev, profile: false }));
      swal.error('Error', 'Please enter a valid email address');
      return;
    }

    if (profileForm.email === userProfile.email && profileForm.name === userProfile.name) {
      setErrors(prev => ({ ...prev, profile: "No changes detected" }));
      setIsLoading(prev => ({ ...prev, profile: false }));
      swal.info('Info', 'No changes detected');
      return;
    }

    try {
      // Check if user is from hospital management system
      const isHospitalUser = user && ['HOSPITAL', 'CLINIC', 'DOCTOR', 'PERSONAL_DOCTOR', 'SUPER_ADMIN'].includes(user.role);
      
      let response;
      if (isHospitalUser) {
        response = await apiService.updateHospitalProfile({
          name: profileForm.name,
          email: profileForm.email
        });
      } else {
        response = await api.updateProfile({
          name: profileForm.name,
          email: profileForm.email
        });
      }
      
      if (response.status === 200) {
        // Hospital API returns { user }, Admin API returns { admin }
        const updatedUser = isHospitalUser 
          ? (response.data as { user: any }).user 
          : (response.data as { admin: any }).admin;
        
        setUserProfile(prev => ({
          ...prev,
          name: updatedUser.name,
          email: updatedUser.email || ''
        }));
        
        // Update localStorage with new user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            userData.name = updatedUser.name;
            userData.email = updatedUser.email || '';
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Trigger a page reload or update context if needed
            // For now, we'll just update localStorage and the user will see changes on next navigation
            // Or we can dispatch a custom event to update the header
            window.dispatchEvent(new Event('userUpdated'));
          } catch (e) {
            console.error('Error updating localStorage:', e);
          }
        }
        
        swal.success('Success', 'Profile updated successfully!');
        
        // Dispatch event to update AuthContext
        window.dispatchEvent(new Event('userUpdated'));
      } else {
        setErrors(prev => ({ ...prev, profile: response.message || "Failed to update profile" }));
        swal.error('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, profile: "Failed to update profile. Please try again." }));
      swal.error('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: "" }));

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      const errorMsg = "All fields are required";
      setErrors(prev => ({ ...prev, password: errorMsg }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', errorMsg);
      return;
    }

    // Validate password - minimum 6 characters (same as creation)
    if (passwordForm.newPassword.length < 6) {
      const errorMsg = "Password must be at least 6 characters";
      setErrors(prev => ({ ...prev, password: errorMsg }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', errorMsg);
      return;
    }

    // Check if new password and confirm password match - MUST be checked before API call
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const errorMsg = "New password and confirm password do not match. Please make sure both passwords are the same.";
      setErrors(prev => ({ ...prev, password: errorMsg }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', errorMsg);
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      const errorMsg = "New password must be different from current password";
      setErrors(prev => ({ ...prev, password: errorMsg }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', errorMsg);
      return;
    }

    try {
      // Check if user is from hospital management system
      const isHospitalUser = user && ['HOSPITAL', 'CLINIC', 'DOCTOR', 'PERSONAL_DOCTOR', 'SUPER_ADMIN'].includes(user.role);
      
      let response;
      if (isHospitalUser) {
        response = await apiService.changeHospitalPassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });
      } else {
        response = await api.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });
      }
      
      if (response.status === 200) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setErrors(prev => ({ ...prev, password: "" }));
        swal.success('Success', 'Password changed successfully!');
      } else {
        // Handle specific error messages from backend
        let errorMsg = response.message || "Failed to change password";
        
        // Check for specific error messages
        if (response.message && (
          response.message.toLowerCase().includes('incorrect') || 
          response.message.toLowerCase().includes('current password') ||
          response.message.toLowerCase().includes('wrong password')
        )) {
          errorMsg = "Current password is incorrect. Please enter the correct current password.";
        } else if (response.message && response.message.toLowerCase().includes('match')) {
          errorMsg = "New password and confirm password do not match. Please make sure both passwords are the same.";
        }
        
        setErrors(prev => ({ ...prev, password: errorMsg }));
        swal.error('Error', errorMsg);
      }
    } catch (error: any) {
      let errorMsg = "Failed to change password. Please try again.";
      
      // Check error message for specific cases
      if (error.message) {
        if (error.message.toLowerCase().includes('incorrect') || 
            error.message.toLowerCase().includes('current password') ||
            error.message.toLowerCase().includes('wrong password')) {
          errorMsg = "Current password is incorrect. Please enter the correct current password.";
        } else if (error.message.toLowerCase().includes('match')) {
          errorMsg = "New password and confirm password do not match. Please make sure both passwords are the same.";
        } else {
          errorMsg = error.message || errorMsg;
        }
      }
      
      setErrors(prev => ({ ...prev, password: errorMsg }));
      swal.error('Error', errorMsg);
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  };

  // Get user initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white font-semibold text-xl">
            {getInitials(userProfile.name || '')}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userProfile.name || 'Admin Profile'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-brand-600/10 text-brand-600 dark:bg-brand-600/20 dark:text-brand-400">
                {userProfile.role}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Member since {userProfile.joinDate ? new Date(userProfile.joinDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update Profile Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 dark:bg-brand-600/20">
              <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Update Profile
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your personal information
              </p>
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <Form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4 text-gray-500" />
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  error={!!errors.profile}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  error={!!errors.profile}
                  className="mt-1"
                />
              </div>

              {/* Current Email Display */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  Current Email
                </Label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                  {userProfile.email}
                </p>
              </div>
            </div>
            
            {errors.profile && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.profile}</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isLoading.profile}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                  ${isLoading.profile 
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400" 
                    : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md"
                  }`}
              >
                {isLoading.profile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>

        {/* Change Password Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 dark:bg-brand-600/20">
              <Lock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your account password
              </p>
            </div>
          </div>

          <Form onSubmit={handlePasswordChange}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    error={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPasswords.current ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4 text-gray-500" />
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    error={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements - matches creation (minimum 6 characters) */}
              {passwordForm.newPassword && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Password Requirements:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className={`flex items-center gap-2 text-sm ${passwordForm.newPassword.length >= 6 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordForm.newPassword.length >= 6 ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      At least 6 characters
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {errors.password && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isLoading.password}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                  ${isLoading.password
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                    : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md"
                  }`}
              >
                {isLoading.password ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
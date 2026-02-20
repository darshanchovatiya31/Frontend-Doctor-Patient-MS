import { useState, useEffect } from "react";
import { Eye, EyeOff, UserCircle, Mail, Lock, Calendar, User } from "lucide-react";
import swal from '../utils/swalHelper';
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Form from "../components/form/Form";
import api from "../services/api"; // Adjust path to your API class instance

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
        const response = await api.getProfile();
        if (response.status === 200) {
          const admin = response.data.admin;
          setUserProfile({
            email: admin.email,
            name: admin.name,
            role: admin.role,
            joinDate: admin.createdAt
          });
          setProfileForm({
            name: admin.name,
            email: admin.email
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
  }, []);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
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
      const response = await api.updateProfile({
        name: profileForm.name,
        email: profileForm.email
      });
      if (response.status === 200) {
        setUserProfile(prev => ({
          ...prev,
          name: response.data.admin.name,
          email: response.data.admin.email
        }));
        // setSuccess(prev => ({ ...prev, profile: true }));
        swal.success('Success', 'Profile updated successfully!');
        setTimeout(() => {
          // setSuccess(prev => ({ ...prev, profile: false }));
        }, 3000);
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
      setErrors(prev => ({ ...prev, password: "All fields are required" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', 'All fields are required');
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      setErrors(prev => ({ ...prev, password: "Password does not meet requirements" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', 'Password does not meet requirements');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors(prev => ({ ...prev, password: "New passwords do not match" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setErrors(prev => ({ ...prev, password: "New password must be different from current password" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      swal.error('Error', 'New password must be different from current password');
      return;
    }

    try {
      const response = await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (response.status === 200) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        // setSuccess(prev => ({ ...prev, password: true }));
        swal.success('Success', 'Password changed successfully!');
        setTimeout(() => {
          // setSuccess(prev => ({ ...prev, password: false }));
        }, 3000);
      } else {
        setErrors(prev => ({ ...prev, password: response.message || "Failed to change password" }));
        swal.error('Error', response.message || 'Failed to change password');
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, password: "Failed to change password. Please try again." }));
      swal.error('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20">
            <UserCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {userProfile.name || 'Admin Profile'}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {userProfile.role}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
              <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
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

              {/* Password Requirements */}
              {passwordForm.newPassword && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Password Requirements:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className={`flex items-center gap-2 text-sm ${passwordForm.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordForm.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/\d/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/\d/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      One number
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      One special character
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
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
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
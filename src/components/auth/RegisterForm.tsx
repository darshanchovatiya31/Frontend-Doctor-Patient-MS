import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useAuth } from "../../context/AuthContext";
import swal from '../../utils/swalHelper';

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});

    // Validate fields
    const newErrors: typeof errors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      swal.success('Success', 'Registration successful! Redirecting to dashboard...');
      
      // Navigate to dashboard after successful registration
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Set appropriate error messages
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('already exists')) {
        setErrors({ email: errorMessage, general: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
      
      swal.error('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = formData.password ? validatePassword(formData.password) : null;

  return (
    <div className="relative z-10 flex flex-col items-center">
      <Link to="/" className="">
        <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-brand-600 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold text-white">P-MS</span>
        </div>
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-bold text-gray-800 dark:text-white text-center">
        Create Admin Account
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        Register for Patients-MS Admin Dashboard
      </p>
      <form className="w-full space-y-6" onSubmit={handleSubmit}>
        {/* General Error Message */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        {/* Name Field */}
        <div>
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            type="text" 
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="email" 
            placeholder="admin@patientsms.com" 
            type="email" 
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-12 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 ${
                errors.password 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700' 
                  : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700'
              } dark:text-white/90 dark:focus:border-brand-800 dark:bg-gray-900 dark:placeholder:text-white/30`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
          
          {/* Password Requirements */}
          {formData.password && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password Requirements:
              </p>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 text-xs ${passwordValidation?.requirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation?.requirements.minLength ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordValidation?.requirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation?.requirements.hasUpperCase ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordValidation?.requirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation?.requirements.hasLowerCase ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  One lowercase letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordValidation?.requirements.hasNumbers ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation?.requirements.hasNumbers ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  One number
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordValidation?.requirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation?.requirements.hasSpecialChar ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  One special character
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-12 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 ${
                errors.confirmPassword 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700' 
                  : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700'
              } dark:text-white/90 dark:focus:border-brand-800 dark:bg-gray-900 dark:placeholder:text-white/30`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white mb-4 py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}


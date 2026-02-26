import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useAuth } from "../../context/AuthContext";
import swal from '../../utils/swalHelper';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setError("");
    setEmailError("");
    setPasswordError("");

    // Validate fields
    if (!email || !password) {
      if (!email) {
        setEmailError('Email is required');
      }
      if (!password) {
        setPasswordError('Password is required');
      }
      setError('Please fill in all fields');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setError('Invalid email format');
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(email, password);
      
      // Get user role from localStorage to determine redirect
      const storedUser = localStorage.getItem('user');
      let redirectPath = '/';
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const userRole = userData.role;
          
          // Redirect all roles to hospital dashboard
          if (['SUPER_ADMIN', 'HOSPITAL', 'DOCTOR', 'PERSONAL_DOCTOR'].includes(userRole)) {
            redirectPath = '/hospital/dashboard';
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      swal.success('Success', 'Login successful!');
      
      navigate(redirectPath);
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid email or password';
      
      // Set appropriate error messages
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('invalid credentials')) {
        setEmailError('Invalid email or password');
        setPasswordError('Invalid email or password');
      } else if (errorMessage.toLowerCase().includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setError(errorMessage);
      }
      
      // Show error alert
      swal.error('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center">
      <Link to="/" className="">
        <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center overflow-hidden">
          <img 
            src="/icon/logo.png" 
            alt="Patients-MS Logo" 
            className="h-full w-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('/icon/logo')) {
                target.src = '/icons/icon-192x192.png';
              } else if (target.src.includes('/icons/icon-192x192')) {
                target.src = '/favicon.png';
              }
            }}
          />
        </div>
      </Link>
      <h1 className="mb-2  mt-2 text-2xl font-bold text-gray-800 dark:text-white text-center">
        Welcome to Patients-MS
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        Securely access your dashboard
      </p>
      <form className="w-full space-y-6" onSubmit={handleSubmit}>
        {/* General Error Message */}
        {error && !emailError && !passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="email" 
            placeholder="admin@patientsms.com" 
            type="email" 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              setError("");
            }}
            error={!!emailError}
            // required
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
                setError("");
              }}
              className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-12 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 ${
                passwordError 
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
          {passwordError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}
        </div>
        <button
          className="w-full bg-brand-600 hover:bg-brand-700 text-white mb-6 py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
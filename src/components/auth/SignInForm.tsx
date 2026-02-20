import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
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
      
      swal.success('Success', 'Login successful!');
      
      navigate('/');
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
        <img
          width={200}
          height={200}
          src="/images/logo/prime-logo.png"
          alt="Prime Health Logo"
          className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full object-contain"
        />
      </Link>
      <h1 className="mb-2  mt-2 text-2xl font-bold text-gray-800 dark:text-white text-center">
        Welcome to Prime Health Admin
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        Securely access your admin dashboard
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
            placeholder="admin@primehealth.com" 
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
                <EyeIcon className="h-5 w-5 fill-current" />
              ) : (
                <EyeCloseIcon className="h-5 w-5 fill-current" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}
        </div>
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white mb-4 py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors"
            >
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/useAuthStore';
import { 
  GraduationCap, 
  Lock, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Info, 
  LogIn, 
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginSubmit = async (emailOrPhoneVal, passwordVal) => {
    if (!emailOrPhoneVal || !passwordVal) {
      toast.error('Please enter your credentials');
      return;
    }

    // Auto-detect email vs. phone
    const payload = {};
    if (emailOrPhoneVal.includes('@')) {
      payload.email = emailOrPhoneVal.trim();
    } else {
      payload.phone = emailOrPhoneVal.trim();
    }
    payload.password = passwordVal;

    try {
      const user = await login(payload);
      toast.success('Login successful!');
      if (user.role === 'SuperAdmin') navigate('/super-admin');
      else if (user.role === 'SchoolAdmin') navigate('/school-admin');
      else if (user.role === 'Teacher') navigate('/teacher');
      else if (user.role === 'Student') navigate('/student/homework');
      else if (user.role === 'Parent') navigate('/parent');
      else if (user.role === 'Staff') navigate('/staff');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLoginSubmit(emailOrPhone, password);
  };

  const handleDemoLogin = async (demoEmailOrPhone, demoPassword) => {
    setEmailOrPhone(demoEmailOrPhone);
    setPassword(demoPassword);
    await handleLoginSubmit(demoEmailOrPhone, demoPassword);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex flex-col justify-between">
      {/* Background Glow Blobs */}
      <div className="absolute top-0 left-0 rounded-full w-96 h-96 bg-blue-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 rounded-full w-96 h-96 bg-indigo-500/20 blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <a href="#" className="flex items-center gap-3">
            <img src="/s1-logo.png" alt="S1 Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/30" />
            <span className="text-2xl font-black tracking-wider text-white">S1 School</span>
          </a>
        </div>
      </header>

      {/* Main Section */}
      <section className="relative z-10 px-4 py-10 flex-grow flex items-center">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          
          {/* Left Column - Branding/Illustration */}
          <div className="relative flex flex-col justify-center p-8 border-b lg:p-14 lg:border-b-0 lg:border-r border-white/10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 text-center">
              {/* Pulsing Lock Circle */}
              <div className="inline-flex items-center justify-center mb-8 rounded-full shadow-2xl w-28 h-28 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse">
                <img 
                  src="https://institute.bdboibazer.com/images/login-lock.png" 
                  className="object-contain w-16 h-16" 
                  alt="Lock Icon" 
                />
              </div>

              {/* Center Background Illustration */}
              <img 
                src="https://institute.bdboibazer.com/images/login-bg.png" 
                className="w-full max-w-md mx-auto mb-8 drop-shadow-2xl" 
                alt="Login Illustration" 
              />

              <h2 className="mb-6 text-3xl font-black leading-tight text-white lg:text-4xl">
                Welcome Back
              </h2>

              <p className="mb-8 text-lg leading-relaxed text-slate-300">
                Securely access your institute dashboard and manage your academic activities easily.
              </p>

              {/* Login Instructions */}
              <div className="p-6 text-left border bg-white/5 border-white/10 rounded-3xl backdrop-blur-xl">
                <h3 className="flex items-center gap-2 mb-5 text-xl font-bold text-white">
                  <Info className="text-blue-400 w-5 h-5" />
                  Login Instructions
                </h3>

                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center text-sm font-bold text-white bg-blue-500 rounded-full w-7 h-7 shrink-0">
                      ✓
                    </span>
                    <span>
                      Login with your Email / Phone and Password.
                    </span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center text-sm font-bold text-white bg-indigo-500 rounded-full w-7 h-7 shrink-0">
                      ✓
                    </span>
                    <span>
                      Your personal dashboard will appear after login.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="flex items-center p-6 lg:p-14">
            <div className="w-full max-w-lg mx-auto">
              
              {/* Header Icon & Title */}
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 mb-6 border rounded-full shadow-2xl bg-white/10 border-white/20">
                  <img 
                    src="https://institute.bdboibazer.com/images/password-key.png" 
                    className="w-12 h-12" 
                    alt="Key Icon" 
                  />
                </div>

                <h1 className="mb-4 text-4xl font-black text-white lg:text-5xl">
                  Sign In
                </h1>

                <p className="text-lg text-slate-300">
                  Enter your credentials to continue
                </p>
              </div>

              {/* Login Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email / Phone Input */}
                <div>
                  <label className="block mb-3 text-sm font-semibold text-slate-200">
                    Email / Phone
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400">
                      <User className="w-5 h-5 text-lg" />
                    </span>
                    <input 
                      type="text" 
                      name="emailOrPhone" 
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      required 
                      autoFocus
                      placeholder="Enter Email or Phone"
                      className="w-full h-16 pr-5 text-white transition duration-300 border outline-none rounded-2xl border-white/10 bg-white/10 pl-14 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-200">
                      Password
                    </label>
                    <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400">
                      <Lock className="w-5 h-5 text-lg" />
                    </span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter Password"
                      className="w-full h-16 pl-14 pr-14 text-white transition duration-300 border outline-none rounded-2xl border-white/10 bg-white/10 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="remember"
                      className="w-5 h-5 text-blue-500 rounded border-white/20 bg-white/10 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-slate-300">
                      Remember Me
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-bold shadow-2xl transition duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-5 h-5" />
                  {isLoading ? 'Signing In...' : 'Login Now'}
                </button>

                {/* Demo Logins */}
                <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                  <button 
                    type="button" 
                    onClick={() => handleDemoLogin('admin@system.com', 'Admin@123')}
                    className="flex items-center justify-start px-4 font-semibold text-white transition duration-300 border h-14 rounded-2xl border-white/10 bg-white/10 hover:bg-indigo-500/20 cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 mr-3 text-indigo-400" />
                    Admin
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleDemoLogin('schooladmin@system.com', 'Admin@123')}
                    className="flex items-center justify-start px-4 font-semibold text-white transition duration-300 border h-14 rounded-2xl border-white/10 bg-white/10 hover:bg-green-500/20 cursor-pointer"
                  >
                    <ShieldAlert className="w-5 h-5 mr-3 text-green-400" />
                    School Admin
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleDemoLogin('teacher@system.com', 'Admin@123')}
                    className="flex items-center justify-start px-4 font-semibold text-white transition duration-300 border h-14 rounded-2xl border-white/10 bg-white/10 hover:bg-purple-500/20 cursor-pointer"
                  >
                    <GraduationCap className="w-5 h-5 mr-3 text-purple-400" />
                    Teacher
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleDemoLogin('staff@system.com', 'Admin@123')}
                    className="flex items-center justify-start px-4 font-semibold text-white transition duration-300 border h-14 rounded-2xl border-white/10 bg-white/10 hover:bg-yellow-500/20 cursor-pointer"
                  >
                    <UserCheck className="w-5 h-5 mr-3 text-yellow-400" />
                    Staff
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleDemoLogin('1234567890', 'Admin@123')}
                    className="flex items-center justify-start px-4 font-semibold text-white transition duration-300 border h-14 rounded-2xl border-white/10 bg-white/10 hover:bg-orange-500/20 md:col-span-2 md:justify-center cursor-pointer"
                  >
                    <Users className="w-5 h-5 mr-3 text-orange-400" />
                    Parent
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="px-6 py-6 mx-auto text-center max-w-7xl">
          <p className="text-sm text-slate-400 md:text-base">
            © {new Date().getFullYear()} <span className="font-semibold text-blue-400">S1 School</span> — All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bus, Phone, Lock, LogIn, ShieldAlert } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const DriverLogin = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!mobileNumber || !password) {
      toast.error('Please enter mobile number and password');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5005/api/transport/driver/login', {
        mobile_number: mobileNumber,
        password
      });

      // Save user state for driver
      setAuth(data, data.token);
      localStorage.setItem('driverToken', data.token);
      localStorage.setItem('driverData', JSON.stringify(data));

      toast.success(`Welcome back, Driver ${data.name}!`);
      navigate('/driver/portal');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Driver login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto text-blue-400">
            <Bus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Driver Portal</h1>
          <p className="text-xs font-semibold text-slate-400">School Bus Real-Time Tracking & Route Operations</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Driver Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Driver Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/60 text-center">
          <p className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            Only authorized drivers assigned by School Admin can log in.
          </p>
        </div>

      </div>
    </div>
  );
};

export default DriverLogin;

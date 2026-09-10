import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save, 
  Lock, 
  UserCheck, 
  Clock, 
  BadgeCheck 
} from 'lucide-react';

const AccountProfile = () => {
  const { user, login } = useAuthStore();

  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileDetails, setProfileDetails] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [savingContact, setSavingContact] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/auth/me', config);
        setProfileDetails(data);
        setEmail(data.email || '');
        setPhone(data.phone || '');
      } catch (error) {
        toast.error('Failed to load profile details');
      } finally {
        setFetching(false);
      }
    };

    if (user?.token) {
      fetchFullProfile();
    }
  }, [user]);

  // Handle Contact Update
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put('/api/auth/profile', { email, phone }, config);
      
      // Update store and localStorage
      const updatedUser = { ...user, email: data.email, phone: data.phone, token: data.token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });

      toast.success('Contact profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update contact info');
    } finally {
      setSavingContact(false);
    }
  };

  // Handle Security / Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingSecurity(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put('/api/auth/profile', {
        currentPassword,
        newPassword
      }, config);

      // Update store and localStorage
      const updatedUser = { ...user, token: data.token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingSecurity(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-blue-600 text-white border-blue-400';
      case 'SchoolAdmin': return 'bg-indigo-600 text-white border-indigo-400';
      case 'Teacher': return 'bg-emerald-600 text-white border-emerald-400';
      case 'Parent': return 'bg-amber-600 text-white border-amber-400';
      default: return 'bg-slate-700 text-white border-slate-500';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'SuperAdmin': return 'System Administrator';
      case 'SchoolAdmin': return 'School Administrator';
      case 'Teacher': return 'Academic Teacher';
      case 'Parent': return 'Parent / Guardian';
      default: return role || 'User Account';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Account & Profile</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Account Settings</span>
          <span>-</span>
          <span className="text-blue-600">Personal & Security Profile</span>
        </div>
      </div>

      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-blue-500/25 border-4 border-white ring-2 ring-slate-100 shrink-0">
            {(user?.email?.[0] || user?.role?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h3 className="text-xl font-black text-slate-850">
                {user?.email ? user.email.split('@')[0] : 'User Profile'}
              </h3>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getRoleBadgeColor(user?.role)}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {user?.role}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <BadgeCheck className="w-4 h-4 text-blue-600" />
              {getRoleDisplayName(user?.role)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600">
          <div>
            <span className="text-[9px] font-black text-slate-400 block uppercase">Account Status</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5" /> Active Verified
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-[9px] font-black text-slate-400 block uppercase">User ID</span>
            <span className="text-slate-800 font-extrabold mt-0.5 block font-mono text-[11px]">
              {user?._id ? user._id.substring(18).toUpperCase() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal & Contact Info Form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Personal & Contact Info</h3>
              <p className="text-[11px] font-semibold text-slate-400">Update your email address and mobile contact number</p>
            </div>
          </div>

          <form onSubmit={handleUpdateContact} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                placeholder="name@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Phone
              </label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Account Role Level</label>
              <input
                type="text"
                disabled
                value={user?.role || ''}
                className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingContact}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingContact ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Change Password Form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Security & Password</h3>
              <p className="text-[11px] font-semibold text-slate-400">Update your access password to secure your account</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Current Password *
                </span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> New Password *
                </span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Confirm New Password *
                </span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingSecurity}
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {savingSecurity ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountProfile;

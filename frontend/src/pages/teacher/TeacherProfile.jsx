import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  User, 
  Mail, 
  Phone, 
  Award, 
  Briefcase, 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  Save, 
  CheckCircle2, 
  Building2,
  Calendar,
  Camera
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherProfile = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState(null);

  // Editable Profile Form State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/profile', config);
      setTeacher(data);
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setQualification(data.qualification || '');
      setExperience(data.experience || '');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load profile details');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put('/api/teacher/profile', {
        phone,
        email,
        qualification,
        experience
      }, config);
      setTeacher(data.teacher || data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put('/api/teacher/change-password', {
        currentPassword,
        newPassword
      }, config);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Profile Hero */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 shadow-lg">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-3xl font-black text-indigo-600 overflow-hidden">
                {teacher?.photo ? (
                  <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{teacher?.name?.charAt(0) || 'T'}</span>
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-indigo-600 text-white shadow-md cursor-pointer hover:bg-indigo-700 transition-colors">
              <Camera className="w-4 h-4" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800">{teacher?.name}</h1>
              {teacher?.classIncharge && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Class Incharge ({teacher.classIncharge.class} - {teacher.classIncharge.section})
                </span>
              )}
            </div>
            <p className="text-xs font-extrabold text-indigo-600 tracking-wide uppercase">Employee ID: {teacher?.employee_id || teacher?.empId || 'EMP-TEACHER'}</p>
            <p className="text-xs font-semibold text-slate-400 flex items-center justify-center sm:justify-start gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {teacher?.school_id?.name || 'School Management System'}
            </p>
          </div>

          <div className="flex sm:flex-col gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <User className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Lock className="w-4 h-4" /> Security
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Personal & Professional Details
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={teacher?.name || ''}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value={teacher?.employee_id || teacher?.empId || ''}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Educational Qualification</label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. M.Sc. Mathematics, B.Ed."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Teaching Experience</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5 Years"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Assigned Classes & Subjects Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Assigned Subjects
              </h2>
              {teacher?.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                <div className="space-y-2">
                  {teacher.assignedSubjects.map((sub, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-800 text-xs">{sub.name}</span>
                        <span className="text-[10px] font-bold text-indigo-600 ml-2">({sub.code})</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white text-indigo-700 font-bold text-[10px] border border-indigo-100">
                        {sub.class} - {sub.section}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold">No assigned subjects found.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Class Incharge Badge
              </h2>
              {teacher?.classIncharge ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Incharge of Class {teacher.classIncharge.class} - {teacher.classIncharge.section}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    You have administrative access to manage student records and parents for this class.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold">You are currently assigned as Subject Teacher.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Security Tab */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" /> Change Password
          </h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">Ensure your password is at least 6 characters and unique.</p>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;

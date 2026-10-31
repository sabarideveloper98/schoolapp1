import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  MapPin,
  FileText,
  School,
  Bus,
  HeartPulse,
  Phone,
  Mail,
  Calendar,
  Edit,
  Printer,
  AlertCircle,
  RefreshCw,
  BadgeCheck,
  ShieldAlert,
  Hash,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchStudent = async () => {
    if (!id) {
      setError('Student ID is missing from URL.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token =
        user?.token ||
        user?.accessToken ||
        (typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('user') || '{}')?.token || localStorage.getItem('token')
          : '') ||
        '';

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`/api/schooladmin/students/${id}`, config);
      if (res.data) {
        setStudent(res.data);
      } else {
        setError('No student record found.');
      }
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to load student details. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Safe resolvers for nested and alternate fields
  const studentName = student?.student_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Student Details';
  const admissionNum = student?.admission_number || student?._id?.substring(0, 12).toUpperCase() || '-';
  const rollNo = student?.roll_no || '-';
  const className = student?.class_id?.class || student?.class || '-';
  const sectionName = student?.class_id?.section || student?.section || '-';
  const classSecDisplay = `${className} ${sectionName && sectionName !== '-' ? `(${sectionName})` : ''}`.trim();
  const academicYear = student?.academic_year || '2025-2026';
  const studentStatus = student?.student_status || 'Active';
  const isActive = studentStatus.toLowerCase() === 'active';
  const dobVal = student?.date_of_birth || student?.dob;
  const guardianPhone = student?.guardian_phone || student?.parent_phone || '-';
  const guardianEmail = student?.guardian_email || student?.parent_email || '-';
  const guardianName = student?.guardian_name || student?.parent_name || '-';
  const fullAddress = [
    student?.address_line || student?.address,
    student?.city,
    student?.district,
    student?.state,
    student?.pincode ? `PIN: ${student.pincode}` : null
  ].filter(Boolean).join(', ') || '-';

  // ---------------------------------------------------------------------------
  // 1. Loading State
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>

        {/* Header Profile skeleton */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-200"></div>
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="h-7 w-64 bg-slate-200 rounded-lg mx-auto sm:mx-0"></div>
            <div className="h-4 w-48 bg-slate-200 rounded-lg mx-auto sm:mx-0"></div>
            <div className="h-4 w-72 bg-slate-200 rounded-lg mx-auto sm:mx-0"></div>
          </div>
        </div>

        {/* Detail cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded"></div>
              <div className="h-4 bg-slate-100 rounded"></div>
              <div className="h-4 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded"></div>
              <div className="h-4 bg-slate-100 rounded"></div>
              <div className="h-4 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-6 gap-2 text-slate-400 font-bold text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Fetching student details...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Error State
  // ---------------------------------------------------------------------------
  if (error || !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <button
            onClick={() => navigate('/school-admin/students')}
            className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Students
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Unable to Load Student Details</h2>
          <p className="text-sm font-medium text-slate-500">
            {error || 'The requested student record could not be found or you do not have permission to view it.'}
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={fetchStudent}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/school-admin/students')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Return to Student List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Render Student Details
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <span
              onClick={() => navigate('/school-admin/dashboard')}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              Home
            </span>
            <span>/</span>
            <span
              onClick={() => navigate('/school-admin/students')}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              Students
            </span>
            <span>/</span>
            <span className="text-slate-700 font-extrabold">{studentName}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Student Profile</span>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {studentStatus}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/school-admin/students')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to List
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Print Profile"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={() => navigate(`/school-admin/students/edit/${student._id}`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Student
          </button>
        </div>
      </div>

      {/* Hero Profile Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Student Photo */}
          <div className="relative group">
            {student.photo ? (
              <img
                src={student.photo}
                alt={studentName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-md ring-2 ring-slate-150"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center font-black text-3xl shadow-md ring-2 ring-slate-150">
                <span>{studentName.charAt(0) || 'S'}</span>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-80 mt-1">No Photo</span>
              </div>
            )}
            <span
              className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}
              title={studentStatus}
            >
              {isActive ? <BadgeCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            </span>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  {studentName}
                </h2>
                {student.gender && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                    {student.gender}
                  </span>
                )}
                {student.blood_group && student.blood_group !== 'N/A' && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                    {student.blood_group}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Student ID: <span className="font-mono text-slate-700 font-bold">{student._id}</span>
              </p>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Admission No.
                </span>
                <span className="text-sm font-black text-blue-600 font-mono">
                  {admissionNum}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Roll No.
                </span>
                <span className="text-sm font-black text-slate-800">
                  {rollNo}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Class & Sec
                </span>
                <span className="text-sm font-black text-slate-800">
                  {classSecDisplay}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Academic Year
                </span>
                <span className="text-sm font-black text-slate-800">
                  {academicYear}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Details', icon: Sparkles },
          { id: 'basic', label: 'Basic Info', icon: User },
          { id: 'academic', label: 'Academic', icon: GraduationCap },
          { id: 'guardian', label: 'Parents / Guardian', icon: Users },
          { id: 'address', label: 'Contact & Address', icon: MapPin },
          { id: 'additional', label: 'Additional & Identifiers', icon: FileText },
          { id: 'transport', label: 'Transport & Medical', icon: Bus }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActiveTab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =================================================================== */}
        {/* 1. Basic Student Information */}
        {/* =================================================================== */}
        {(activeTab === 'all' || activeTab === 'basic') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Basic Information</h3>
                <p className="text-[11px] font-semibold text-slate-400">Personal identity and demographics</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                <span className="font-extrabold text-slate-800 block break-words">{studentName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">First Name</span>
                <span className="font-extrabold text-slate-800 block break-words">{student.first_name || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Last Name</span>
                <span className="font-extrabold text-slate-800 block break-words">{student.last_name || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date of Birth</span>
                <span className="font-extrabold text-slate-800 block">{formatDate(dobVal)}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Age</span>
                <span className="font-extrabold text-slate-800 block">{student.age ? `${student.age} Years` : '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gender</span>
                <span className="font-extrabold text-slate-800 block">{student.gender || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Blood Group</span>
                <span className="font-black text-rose-600 block">{student.blood_group || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nationality</span>
                <span className="font-extrabold text-slate-800 block">{student.nationality || 'Indian'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mother Tongue</span>
                <span className="font-extrabold text-slate-800 block">{student.mother_tongue || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Student Status</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isActive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  ></span>
                  <span className="font-black text-slate-800">{studentStatus}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. Academic & Admission Information */}
        {/* =================================================================== */}
        {(activeTab === 'all' || activeTab === 'academic') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Academic & Admission</h3>
                <p className="text-[11px] font-semibold text-slate-400">Class, roll, registration, and curriculum</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admission Number</span>
                <span className="font-black text-blue-600 font-mono block break-words">{admissionNum}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admission Date</span>
                <span className="font-extrabold text-slate-800 block">{formatDate(student.admission_date)}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Academic Year</span>
                <span className="font-extrabold text-slate-800 block">{academicYear}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Class & Section</span>
                <span className="font-black text-slate-800 block">{classSecDisplay}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Roll Number</span>
                <span className="font-black text-slate-800 block">{rollNo}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admission Type</span>
                <span className="font-extrabold text-slate-800 block">{student.admission_type || 'Regular'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stream / Group</span>
                <span className="font-extrabold text-slate-800 block">{student.stream_group || student.group || 'Science'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medium</span>
                <span className="font-extrabold text-slate-800 block">{student.medium_of_instruction || 'English'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Second Language</span>
                <span className="font-extrabold text-slate-800 block">{student.second_language || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registration No</span>
                <span className="font-extrabold text-slate-800 block break-words">{student.registration_no || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">School House</span>
                <span className="font-extrabold text-slate-800 block">{student.house || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Student Type</span>
                <span className="font-extrabold text-slate-800 block">{student.student_type || 'Day Scholar'}</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. Parent & Guardian Information */}
        {/* =================================================================== */}
        {(activeTab === 'all' || activeTab === 'guardian') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Parent & Guardian Details</h3>
                <p className="text-[11px] font-semibold text-slate-400">Emergency and primary contact persons</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Guardian</span>
                <span className="font-extrabold text-slate-800 text-sm block">{guardianName}</span>
                <span className="text-[10px] font-bold text-blue-600 mt-0.5 inline-block">
                  Relation: {student.guardian_relation || 'Father'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Guardian Phone</span>
                <a
                  href={guardianPhone !== '-' ? `tel:${guardianPhone}` : undefined}
                  className="font-black text-blue-600 text-sm hover:underline block"
                >
                  {guardianPhone}
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Guardian Email</span>
                <a
                  href={guardianEmail !== '-' ? `mailto:${guardianEmail}` : undefined}
                  className="font-extrabold text-slate-700 hover:text-blue-600 hover:underline block break-words"
                >
                  {guardianEmail}
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Number</span>
                <span className="font-black text-emerald-700 block">
                  {student.whatsapp_number || '-'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Father's Name</span>
                <span className="font-extrabold text-slate-800 block">{student.father_name || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mother's Name</span>
                <span className="font-extrabold text-slate-800 block">{student.mother_name || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alternate Phone</span>
                <span className="font-extrabold text-slate-800 block">{student.alternate_phone || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. Contact & Address Information */}
        {/* =================================================================== */}
        {(activeTab === 'all' || activeTab === 'address') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Contact & Address</h3>
                <p className="text-[11px] font-semibold text-slate-400">Residential address and location data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Street Address</span>
                <span className="font-extrabold text-slate-800 block leading-relaxed">{fullAddress}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State</span>
                <span className="font-extrabold text-slate-800 block">{student.state || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">District</span>
                <span className="font-extrabold text-slate-800 block">{student.district || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">City / Town</span>
                <span className="font-extrabold text-slate-800 block">{student.city || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pincode</span>
                <span className="font-black text-slate-800 block">{student.pincode || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. Additional Identifiers & Legal Information */}
        {/* =================================================================== */}
        {(activeTab === 'all' || activeTab === 'additional') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Additional Identifiers</h3>
                <p className="text-[11px] font-semibold text-slate-400">National IDs, registry numbers, and categories</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">APAAR ID</span>
                <span className="font-extrabold text-slate-800 font-mono block break-words">{student.apaar_id || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PEN Number</span>
                <span className="font-extrabold text-slate-800 font-mono block break-words">{student.pen_number || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">EMIS Number</span>
                <span className="font-extrabold text-slate-800 font-mono block break-words">{student.emis_id || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Aadhaar Last 4</span>
                <span className="font-black text-slate-800 font-mono block">
                  {student.aadhaar_last_four ? `XXXX-XXXX-${student.aadhaar_last_four}` : (student.aadhaar_no || '-')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Caste / Category</span>
                <span className="font-extrabold text-slate-800 block">{student.category || student.caste || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Religion</span>
                <span className="font-extrabold text-slate-800 block">{student.religion || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. Transport, Medical & Previous School Information */}
        {/* =================================================================== */}
        {(activeTab === 'all' || activeTab === 'transport') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Transport & Health</h3>
                <p className="text-[11px] font-semibold text-slate-400">Commute, medical alerts, and emergency contact</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Transport Mode</span>
                <span className="font-extrabold text-slate-800 block">{student.transport_mode || 'Self / Parent'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Route / Stop</span>
                <span className="font-extrabold text-slate-800 block">{student.bus_route || student.bus_stop || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact</span>
                <span className="font-extrabold text-slate-800 block">{student.emergency_contact_name || student.emergency_contact_phone || '-'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Notes / Allergies</span>
                <span className="font-medium text-slate-700 block">{student.medical_history || student.allergies || 'No medical conditions reported.'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Previous School</span>
                <span className="font-medium text-slate-700 block">
                  {student.previous_school_name
                    ? `${student.previous_school_name} ${student.previous_class ? `(Class: ${student.previous_class})` : ''} ${student.tc_number ? `• TC: ${student.tc_number}` : ''}`
                    : 'No previous school information recorded.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;

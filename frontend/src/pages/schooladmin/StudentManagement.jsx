import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import BulkStudentImportModal from '../../components/BulkStudentImportModal';
import axios from 'axios';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Image as ImageIcon,
  ChevronDown,
  FileSpreadsheet,
  Eye,
  User,
  GraduationCap,
  MapPin,
  Bus,
  HeartPulse,
  FileText,
  Phone,
  Mail,
  Calendar,
  School,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';

const StudentManagement = () => {
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Editing & Viewing states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [viewModalStudent, setViewModalStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editModalTab, setEditModalTab] = useState('basic');
  const [viewModalTab, setViewModalTab] = useState('basic');

  // Table Filters
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appliedClassFilter, setAppliedClassFilter] = useState('');
  const [appliedSectionFilter, setAppliedSectionFilter] = useState('');

  // Table search & limit
  const [pageSize, setPageSize] = useState(50);
  const [globalSearch, setGlobalSearch] = useState('');

  // Dropdown states
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [editClass, setEditClass] = useState('');
  const [editAvailableSections, setEditAvailableSections] = useState([]);

  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = user?.token || user?.accessToken || (typeof localStorage !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}')?.token || localStorage.getItem('token')) : '') || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [studentRes, classRes] = await Promise.all([
        axios.get('/api/schooladmin/students', config),
        axios.get('/api/schooladmin/classes', config)
      ]);
      const rawStudents = Array.isArray(studentRes.data) ? studentRes.data : (studentRes.data?.students || studentRes.data?.data || []);
      const rawClasses = Array.isArray(classRes.data) ? classRes.data : (classRes.data?.classes || classRes.data?.data || []);
      setStudents(rawStudents);
      setClasses(rawClasses);

      // If initial class ID is present in query parameters, apply it
      if (initialClassId && rawClasses.length > 0) {
        const matchingClass = rawClasses.find(c => c._id === initialClassId);
        if (matchingClass) {
          setClassFilter(matchingClass.class);
          setSectionFilter(matchingClass._id);
          setAppliedClassFilter(matchingClass.class);
          setAppliedSectionFilter(matchingClass._id);
        }
      }

      setLoading(false);
    } catch {
      toast.error('Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode && editingId) {
        await axios.put(`/api/schooladmin/students/${editingId}`, data, config);
        toast.success('Student updated successfully!');
      }
      closeForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleClassChange = (className) => {
    setEditClass(className);
    const sections = classes.filter(c => c.class === className);
    setEditAvailableSections(sections);
    setValue('class', className);
    setValue('class_id', '');
  };

  const handleEdit = (student) => {
    setEditMode(true);
    setEditingId(student._id);
    setIsFormOpen(true);
    setEditModalTab('basic');

    const stdClass = student.class_id?.class || student.class || '';
    setEditClass(stdClass);
    const sections = classes.filter(c => c.class === stdClass);
    setEditAvailableSections(sections);

    // Populate all fields for edit
    setValue('student_name', student.student_name || '');
    setValue('first_name', student.first_name || '');
    setValue('last_name', student.last_name || '');
    setValue('father_name', student.father_name || '');
    setValue('mother_name', student.mother_name || '');
    setValue('age', student.age || '');
    setValue('date_of_birth', student.date_of_birth ? student.date_of_birth.split('T')[0] : (student.dob ? student.dob.split('T')[0] : ''));
    setValue('dob', student.dob ? student.dob.split('T')[0] : '');
    setValue('gender', student.gender || 'Male');
    setValue('blood_group', student.blood_group || 'N/A');
    setValue('nationality', student.nationality || 'Indian');
    setValue('mother_tongue', student.mother_tongue || '');
    setValue('student_status', student.student_status || 'Active');

    setValue('admission_number', student.admission_number || '');
    setValue('admission_date', student.admission_date ? student.admission_date.split('T')[0] : '');
    setValue('academic_year', student.academic_year || '2025-2026');
    setValue('class_id', student.class_id?._id || '');
    setValue('class', stdClass);
    setValue('section', student.class_id?.section || student.section || '');
    setValue('roll_no', student.roll_no || '');
    setValue('admission_type', student.admission_type || 'Regular');
    setValue('stream_group', student.stream_group || student.group || 'Science');
    setValue('group', student.stream_group || student.group || 'Science');
    setValue('medium_of_instruction', student.medium_of_instruction || 'English');
    setValue('second_language', student.second_language || '');
    setValue('registration_no', student.registration_no || '');
    setValue('house', student.house || '');
    setValue('student_type', student.student_type || 'Day Scholar');

    setValue('guardian_name', student.guardian_name || student.parent_name || '');
    setValue('parent_name', student.guardian_name || student.parent_name || '');
    setValue('guardian_relation', student.guardian_relation || 'Father');
    setValue('guardian_phone', student.guardian_phone || student.parent_phone || '');
    setValue('parent_phone', student.guardian_phone || student.parent_phone || '');
    setValue('guardian_email', student.guardian_email || student.parent_email || '');
    setValue('parent_email', student.guardian_email || student.parent_email || '');
    setValue('whatsapp_number', student.whatsapp_number || '');
    setValue('alternate_phone', student.alternate_phone || '');

    setValue('address_line', student.address_line || student.address || '');
    setValue('city', student.city || '');
    setValue('district', student.district || '');
    setValue('state', student.state || '');
    setValue('pincode', student.pincode || '');
    setValue('address', student.address || '');
    setValue('guardian_address', student.guardian_address || student.address || '');

    setValue('apaar_id', student.apaar_id || '');
    setValue('pen_number', student.pen_number || '');
    setValue('emis_id', student.emis_id || '');
    setValue('aadhaar_last4', student.aadhaar_last4 || '');
    setValue('religion', student.religion || 'General');
    setValue('community_category', student.community_category || 'General');
    setValue('caste', student.caste || '');
    setValue('economic_category', student.economic_category || 'General');
    setValue('is_cwsn', Boolean(student.is_cwsn));
    setValue('disability_type', student.disability_type || '');
    setValue('sibling_admission_no', student.sibling_admission_no || '');

    setValue('previous_school_name', student.previous_school_name || '');
    setValue('previous_class_completed', student.previous_class_completed || '');
    setValue('previous_tc_number', student.previous_tc_number || '');

    setValue('transport_required', Boolean(student.transport_required));
    setValue('route_name', student.route_name || '');
    setValue('stop_name', student.stop_name || '');
    setValue('fee_category', student.fee_category || '');

    setValue('emergency_contact_name', student.emergency_contact_name || '');
    setValue('emergency_contact_phone', student.emergency_contact_phone || '');
    setValue('allergies', student.allergies || '');
    setValue('medical_notes', student.medical_notes || '');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/schooladmin/students/${id}`, config);
        toast.success('Student deleted successfully');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete student');
      }
    }
  };

  const toggleStatus = async (student) => {
    const nextStatus = student.student_status === 'Active' ? 'Inactive' : 'Active';
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/schooladmin/students/${student._id}`, { student_status: nextStatus }, config);
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, student_status: nextStatus } : s));
      toast.success(`Student status updated to ${nextStatus}`);
    } catch {
      toast.error('Failed to update student status');
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  };

  // Get unique class standard names
  const uniqueClassNames = [...new Set(classes.map(c => c.class))];

  // Sections for the selected class standard
  const availableSections = classFilter
    ? classes.filter(c => c.class === classFilter)
    : [];

  const handleSearchClick = () => {
    setAppliedClassFilter(classFilter);
    setAppliedSectionFilter(sectionFilter);
  };

  // Filter students array based on filters & global search
  const filteredStudents = students.filter(student => {
    if (appliedClassFilter && student.class_id?.class !== appliedClassFilter && student.class !== appliedClassFilter) return false;
    if (appliedSectionFilter && student.class_id?._id !== appliedSectionFilter) return false;
    if (statusFilter !== 'all') {
      const currentStatus = student.student_status || 'Active';
      if (currentStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      return (
        student.student_name?.toLowerCase().includes(searchLower) ||
        student.roll_no?.toString().toLowerCase().includes(searchLower) ||
        (student.admission_number || '')?.toLowerCase().includes(searchLower) ||
        (student.parent_phone || student.guardian_phone || '')?.includes(searchLower) ||
        (student.apaar_id || '')?.toLowerCase().includes(searchLower) ||
        (student.registration_no || '')?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12 text-slate-500 font-medium text-sm">Loading Student List...</div>;

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student Details & Records</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-blue-600">Students</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk CSV/Excel Import
          </button>
          <button
            onClick={() => navigate('/school-admin/students/create')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        </div>
      </div>

      <BulkStudentImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => fetchData()}
      />

      {/* Filter Section Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* Class select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Class</label>
            <SearchableSelect
              options={uniqueClassNames.map(c => ({
                value: c,
                label: String(c).startsWith('Class') || String(c).includes('K.G') ? c : `Class ${c}`
              }))}
              value={classFilter}
              onChange={(val) => {
                setClassFilter(val);
                setSectionFilter('');
              }}
              placeholder="Select Class"
              searchPlaceholder="Search class..."
            />
          </div>

          {/* Section select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Section</label>
            <SearchableSelect
              options={availableSections.map(s => ({
                value: s._id,
                label: `Section ${s.section}`,
                sublabel: s.class_incharge_id?.name ? `In-charge: ${s.class_incharge_id.name}` : undefined
              }))}
              value={sectionFilter}
              onChange={(val) => setSectionFilter(val)}
              placeholder={classFilter ? 'Select Section' : 'Select Class First'}
              searchPlaceholder="Search section..."
              disabled={!classFilter}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Status</label>
            <SearchableSelect
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
                { value: 'Transferred', label: 'Transferred' },
                { value: 'Graduated', label: 'Graduated' }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Select Status..."
              searchPlaceholder="Search status..."
              buttonClassName="h-12 w-full px-4 border border-slate-200 rounded-xl outline-none bg-white text-slate-800 text-xs font-semibold"
            />
          </div>

          {/* Search trigger button */}
          <div>
            <button
              onClick={handleSearchClick}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Filter Students
            </button>
          </div>
        </div>
      </div>

      {/* Main Student List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 overflow-hidden">

        {/* Entries page size and Search text input */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Show</span>
            <SearchableSelect
              options={[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              value={pageSize}
              onChange={(val) => setPageSize(Number(val))}
              className="w-24"
              buttonClassName="h-10 px-3 border border-slate-200 rounded-lg outline-none bg-white text-slate-700 text-xs font-semibold"
            />
            <span>Entries ({filteredStudents.length} total)</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 w-full sm:w-auto">
            <span>Search</span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full sm:w-64 h-10 px-3 text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs font-semibold"
              placeholder="Search name, roll, adm no, phone..."
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-5 py-4 text-left w-12">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">PHOTO</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">ROLL</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">ADMISSION NO.</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">NAME</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">CLASS & SEC</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">STREAM</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">GUARDIAN CONTACT</th>
                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStudents.slice(0, pageSize).map((student) => {
                const admissionNum = student.admission_number || student._id?.substring(0, 12).toUpperCase();
                const currentStatus = student.student_status || 'Active';
                const isActive = currentStatus === 'Active';
                const parentPhone = student.guardian_phone || student.parent_phone || '-';

                return (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    {/* Checkbox */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </td>

                    {/* Image */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {student.photo ? (
                        <img src={student.photo} alt={student.student_name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex flex-col items-center justify-center p-1">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-[6px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">No Img</span>
                        </div>
                      )}
                    </td>

                    {/* Roll */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                        {student.roll_no || '-'}
                      </span>
                    </td>

                    {/* Admission Number */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-black text-blue-600 tracking-wide">
                      {admissionNum}
                    </td>

                    {/* Name */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800">{student.student_name}</div>
                      {student.gender && (
                        <span className="text-[10px] text-slate-400 font-medium">{student.gender} • {student.blood_group || 'N/A'}</span>
                      )}
                    </td>

                    {/* Class & Section */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                      {student.class_id?.class || student.class || '-'} ({student.class_id?.section || student.section || '-'})
                    </td>

                    {/* Stream / Group */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                      {student.stream_group || student.group || 'Science'}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                      <div>{student.guardian_name || student.parent_name || 'Guardian'}</div>
                      <div className="text-[11px] text-slate-400">{parentPhone}</div>
                    </td>

                    {/* Status Badge with toggle */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(student)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        title="Click to toggle Active / Inactive"
                      >
                        {currentStatus}
                      </button>
                    </td>

                    {/* Action dropdown */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-semibold relative">
                      <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === student._id ? null : student._id)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Actions
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {activeDropdownId === student._id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-150 rounded-xl shadow-xl py-1.5 z-30 divide-y divide-slate-100">
                            <div>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setViewModalStudent(student);
                                  setViewModalTab('basic');
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  navigate(`/school-admin/students/edit/${student._id}`);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit (Full Page)
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleEdit(student);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Quick Edit
                              </button>
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleDelete(student._id);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No students match the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW STUDENT DETAILS MODAL                                                */}
      {/* ========================================================================= */}
      {viewModalStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto space-y-6">

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                {viewModalStudent.photo ? (
                  <img src={viewModalStudent.photo} alt={viewModalStudent.student_name} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-xl">
                    {viewModalStudent.student_name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-800">{viewModalStudent.student_name}</h3>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${(viewModalStudent.student_status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                      {viewModalStudent.student_status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Admission No: <span className="text-blue-600 font-black">{viewModalStudent.admission_number || 'N/A'}</span> • Roll: {viewModalStudent.roll_no || 'N/A'} • Class: {viewModalStudent.class_id?.class || viewModalStudent.class || 'N/A'} - {viewModalStudent.class_id?.section || viewModalStudent.section || 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewModalStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Modal Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
              {[
                { id: 'basic', label: 'Basic Info', icon: User },
                { id: 'academic', label: 'Academic', icon: GraduationCap },
                { id: 'guardian', label: 'Parents', icon: Users },
                { id: 'address', label: 'Address', icon: MapPin },
                { id: 'additional', label: 'Additional', icon: FileText },
                { id: 'previous', label: 'Previous School', icon: School },
                { id: 'transport', label: 'Transport & Fee', icon: Bus },
                { id: 'medical', label: 'Medical & Emergency', icon: HeartPulse }
              ].map(t => {
                const Icon = t.icon;
                const isCurrent = viewModalTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setViewModalTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${isCurrent ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* View Modal Content */}
            <div className="py-2">
              {viewModalTab === 'basic' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Full Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.student_name}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">First / Last Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.first_name || '-'} {viewModalStudent.last_name || ''}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Date of Birth</span><span className="font-extrabold text-slate-800">{viewModalStudent.date_of_birth ? new Date(viewModalStudent.date_of_birth).toLocaleDateString() : (viewModalStudent.dob ? new Date(viewModalStudent.dob).toLocaleDateString() : '-')}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Gender</span><span className="font-extrabold text-slate-800">{viewModalStudent.gender || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Blood Group</span><span className="font-extrabold text-rose-600 font-black">{viewModalStudent.blood_group || 'N/A'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Nationality</span><span className="font-extrabold text-slate-800">{viewModalStudent.nationality || 'Indian'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Mother Tongue</span><span className="font-extrabold text-slate-800">{viewModalStudent.mother_tongue || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Age</span><span className="font-extrabold text-slate-800">{viewModalStudent.age ? `${viewModalStudent.age} Years` : '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Student Status</span><span className="font-extrabold text-emerald-700">{viewModalStudent.student_status || 'Active'}</span></div>
                </div>
              )}

              {viewModalTab === 'academic' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Admission Number</span><span className="font-black text-blue-600">{viewModalStudent.admission_number || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Admission Date</span><span className="font-extrabold text-slate-800">{viewModalStudent.admission_date ? new Date(viewModalStudent.admission_date).toLocaleDateString() : '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Academic Year</span><span className="font-extrabold text-slate-800">{viewModalStudent.academic_year || '2025-2026'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Class & Section</span><span className="font-extrabold text-slate-800">{viewModalStudent.class_id?.class || viewModalStudent.class || '-'} ({viewModalStudent.class_id?.section || viewModalStudent.section || '-'})</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Roll Number</span><span className="font-extrabold text-slate-800">{viewModalStudent.roll_no || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Admission Type</span><span className="font-extrabold text-slate-800">{viewModalStudent.admission_type || 'Regular'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Stream / Group</span><span className="font-extrabold text-slate-800">{viewModalStudent.stream_group || viewModalStudent.group || 'Science'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Medium</span><span className="font-extrabold text-slate-800">{viewModalStudent.medium_of_instruction || 'English'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Second Language</span><span className="font-extrabold text-slate-800">{viewModalStudent.second_language || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Registration No</span><span className="font-extrabold text-slate-800">{viewModalStudent.registration_no || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">School House</span><span className="font-extrabold text-slate-800">{viewModalStudent.house || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Student Type</span><span className="font-extrabold text-slate-800">{viewModalStudent.student_type || 'Day Scholar'}</span></div>
                </div>
              )}

              {viewModalTab === 'guardian' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Primary Guardian</span><span className="font-extrabold text-slate-800">{viewModalStudent.guardian_name || viewModalStudent.parent_name || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Relationship</span><span className="font-extrabold text-slate-800">{viewModalStudent.guardian_relation || 'Father'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Guardian Phone</span><span className="font-extrabold text-blue-600">{viewModalStudent.guardian_phone || viewModalStudent.parent_phone || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Guardian Email</span><span className="font-extrabold text-slate-800">{viewModalStudent.guardian_email || viewModalStudent.parent_email || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Father's Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.father_name || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Mother's Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.mother_name || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">WhatsApp No</span><span className="font-extrabold text-emerald-600">{viewModalStudent.whatsapp_number || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Alternate Phone</span><span className="font-extrabold text-slate-800">{viewModalStudent.alternate_phone || '-'}</span></div>
                </div>
              )}

              {viewModalTab === 'address' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2"><span className="text-slate-400 font-bold block mb-1">Street Address Line</span><span className="font-extrabold text-slate-800">{viewModalStudent.address_line || viewModalStudent.address || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">City</span><span className="font-extrabold text-slate-800">{viewModalStudent.city || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">District</span><span className="font-extrabold text-slate-800">{viewModalStudent.district || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">State</span><span className="font-extrabold text-slate-800">{viewModalStudent.state || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Pincode</span><span className="font-extrabold text-slate-800">{viewModalStudent.pincode || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2"><span className="text-slate-400 font-bold block mb-1">Guardian Permanent Address</span><span className="font-extrabold text-slate-800">{viewModalStudent.guardian_address || '-'}</span></div>
                </div>
              )}

              {viewModalTab === 'additional' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">APAAR ID</span><span className="font-extrabold text-slate-800">{viewModalStudent.apaar_id || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">PEN Number</span><span className="font-extrabold text-slate-800">{viewModalStudent.pen_number || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">EMIS ID</span><span className="font-extrabold text-slate-800">{viewModalStudent.emis_id || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Aadhaar (Last 4)</span><span className="font-black text-slate-800 tracking-widest">{viewModalStudent.aadhaar_last4 ? `XXXX-${viewModalStudent.aadhaar_last4}` : '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Religion</span><span className="font-extrabold text-slate-800">{viewModalStudent.religion || 'General'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Community Category</span><span className="font-extrabold text-slate-800">{viewModalStudent.community_category || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Caste</span><span className="font-extrabold text-slate-800">{viewModalStudent.caste || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Economic Category</span><span className="font-extrabold text-slate-800">{viewModalStudent.economic_category || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">CWSN</span><span className="font-extrabold text-slate-800">{viewModalStudent.is_cwsn ? `Yes (${viewModalStudent.disability_type || 'Specified'})` : 'No'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Sibling Admission No</span><span className="font-extrabold text-slate-800">{viewModalStudent.sibling_admission_no || '-'}</span></div>
                </div>
              )}

              {viewModalTab === 'previous' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2"><span className="text-slate-400 font-bold block mb-1">Previous School Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.previous_school_name || 'None / Not Applicable'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Previous Class Completed</span><span className="font-extrabold text-slate-800">{viewModalStudent.previous_class_completed || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Previous TC Number</span><span className="font-extrabold text-slate-800">{viewModalStudent.previous_tc_number || '-'}</span></div>
                </div>
              )}

              {viewModalTab === 'transport' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Transport Required</span><span className="font-extrabold text-slate-800">{viewModalStudent.transport_required ? 'Yes' : 'No'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Route Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.route_name || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Stop Name</span><span className="font-extrabold text-slate-800">{viewModalStudent.stop_name || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Fee Category</span><span className="font-extrabold text-slate-800">{viewModalStudent.fee_category || 'General Fee'}</span></div>
                </div>
              )}

              {viewModalTab === 'medical' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Emergency Contact Person</span><span className="font-extrabold text-slate-800">{viewModalStudent.emergency_contact_name || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-400 font-bold block mb-1">Emergency Phone</span><span className="font-extrabold text-rose-600 font-bold">{viewModalStudent.emergency_contact_phone || '-'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2"><span className="text-slate-400 font-bold block mb-1">Known Allergies</span><span className="font-extrabold text-slate-800">{viewModalStudent.allergies || 'None reported'}</span></div>
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2"><span className="text-slate-400 font-bold block mb-1">Medical Notes & Guidelines</span><span className="font-extrabold text-slate-800">{viewModalStudent.medical_notes || 'None reported'}</span></div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewModalStudent(null)}
                className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = viewModalStudent;
                  setViewModalStudent(null);
                  navigate(`/school-admin/students/edit/${s._id}`);
                }}
                className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Full Student Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK EDIT MODAL                                                          */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Quick Edit Student</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Update essential student records directly or open full-page editor.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    closeForm();
                    navigate(`/school-admin/students/edit/${editingId}`);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Open Full-Page Editor
                </button>
                <button onClick={closeForm} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Full Student Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Student Name *</label>
                  <input
                    {...register('student_name', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Admission Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Admission Number *</label>
                  <input
                    {...register('admission_number', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Roll No */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Roll No. *</label>
                  <input
                    {...register('roll_no', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Class Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Class *</label>
                  <SearchableSelect
                    options={uniqueClassNames.map(c => ({ value: c, label: c }))}
                    value={editClass}
                    onChange={(val) => handleClassChange(val)}
                    placeholder="Select Class"
                    searchPlaceholder="Search class..."
                    buttonClassName="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                  />
                </div>

                {/* Section Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Section *</label>
                  <SearchableSelect
                    options={editAvailableSections.map(s => ({ value: s._id, label: s.section }))}
                    value={watch('class_id')}
                    onChange={(val) => setValue('class_id', val, { shouldValidate: true })}
                    placeholder="Select Section"
                    searchPlaceholder="Search section..."
                    buttonClassName="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Academic Year *</label>
                  <SearchableSelect
                    options={[
                      { value: '2024-2025', label: '2024-2025' },
                      { value: '2025-2026', label: '2025-2026' },
                      { value: '2026-2027', label: '2026-2027' },
                      { value: '2027-2028', label: '2027-2028' }
                    ]}
                    value={watch('academic_year')}
                    onChange={(val) => setValue('academic_year', val)}
                    placeholder="Select Academic Year"
                    buttonClassName="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Student Status *</label>
                  <SearchableSelect
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' },
                      { value: 'Suspended', label: 'Suspended' },
                      { value: 'Transferred', label: 'Transferred' },
                      { value: 'Graduated', label: 'Graduated' }
                    ]}
                    value={watch('student_status')}
                    onChange={(val) => setValue('student_status', val)}
                    placeholder="Select Status"
                    buttonClassName="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    {...register('date_of_birth')}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Gender *</label>
                  <SearchableSelect
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    value={watch('gender')}
                    onChange={(val) => setValue('gender', val)}
                    placeholder="Select Gender"
                    buttonClassName="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                  />
                </div>

                {/* Guardian Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Name *</label>
                  <input
                    {...register('guardian_name', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Phone *</label>
                  <input
                    {...register('guardian_phone', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Guardian Relationship */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Relationship *</label>
                  <SearchableSelect
                    options={[
                      { value: 'Father', label: 'Father' },
                      { value: 'Mother', label: 'Mother' },
                      { value: 'Brother', label: 'Brother' },
                      { value: 'Sister', label: 'Sister' },
                      { value: 'Uncle', label: 'Uncle' },
                      { value: 'Guardian', label: 'Guardian' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    value={watch('guardian_relation')}
                    onChange={(val) => setValue('guardian_relation', val)}
                    placeholder="Select Relationship"
                    buttonClassName="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                  />
                </div>

                {/* Address Line */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Address Line *</label>
                  <input
                    {...register('address_line')}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                    placeholder="House / Street Address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">City *</label>
                  <input
                    {...register('city')}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">State *</label>
                  <input
                    {...register('state')}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Pincode *</label>
                  <input
                    {...register('pincode')}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 border border-slate-200 text-xs font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-sm"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;


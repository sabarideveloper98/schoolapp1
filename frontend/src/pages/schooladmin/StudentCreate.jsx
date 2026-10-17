import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import BulkStudentImportModal from '../../components/BulkStudentImportModal';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Lock,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  MapPin,
  FileText,
  School,
  Bus,
  HeartPulse,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

const StudentCreate = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [classes, setClasses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [availableSections, setAvailableSections] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState('basic');

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      student_status: 'Active',
      admission_type: 'Regular',
      gender: 'Male',
      blood_group: 'N/A',
      nationality: 'Indian',
      academic_year: '2025-2026',
      stream_group: 'Science',
      group: 'Science',
      medium_of_instruction: 'English',
      student_type: 'Day Scholar',
      guardian_relation: 'Father',
      religion: 'General',
      community_category: 'General',
      economic_category: 'General',
      transport_required: false,
      is_cwsn: false,
      login_password: '123456',
      login_confirm_password: '123456',
      admission_date: new Date().toISOString().split('T')[0]
    }
  });

  const watchPassword = watch('login_password');
  const watchFirstName = watch('first_name');
  const watchLastName = watch('last_name');
  const watchGuardianPhone = watch('guardian_phone');
  const watchGuardianEmail = watch('guardian_email');
  const watchAddressLine = watch('address_line');
  const watchCity = watch('city');
  const watchDistrict = watch('district');
  const watchState = watch('state');
  const watchPincode = watch('pincode');
  const watchTransportRequired = watch('transport_required');
  const watchIsCwsn = watch('is_cwsn');
  const watchSelectedRoute = watch('route_name');

  // Auto-compose student_name from first and last name if student_name is empty or clean
  useEffect(() => {
    if (!isEditMode && watchFirstName) {
      const full = watchLastName ? `${watchFirstName} ${watchLastName}` : watchFirstName;
      setValue('student_name', full);
    }
  }, [watchFirstName, watchLastName, isEditMode, setValue]);

  // Auto-sync login phone and email from guardian contact during create
  useEffect(() => {
    if (!isEditMode) {
      if (watchGuardianPhone) setValue('login_phone', watchGuardianPhone);
      if (watchGuardianEmail) setValue('login_email', watchGuardianEmail);
    }
  }, [watchGuardianPhone, watchGuardianEmail, isEditMode, setValue]);

  // Load auxiliary data (classes, routes, fee categories)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = user?.token || user?.accessToken || (typeof localStorage !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}')?.token || localStorage.getItem('token')) : '') || '';
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [classRes, routeRes, feeRes] = await Promise.allSettled([
          axios.get('/api/schooladmin/classes', config),
          axios.get('/api/transport/routes', config),
          axios.get('/api/schooladmin/fees/categories', config)
        ]);

        let classData = [];
        if (classRes.status === 'fulfilled') {
          const resVal = classRes.value?.data;
          if (Array.isArray(resVal)) {
            classData = resVal;
          } else if (Array.isArray(resVal?.classes)) {
            classData = resVal.classes;
          } else if (Array.isArray(resVal?.data)) {
            classData = resVal.data;
          }
        }

        // If no classes exist yet in the database, provide standard classes so the dropdown is never empty
        if (classData.length === 0) {
          const fallbackStandards = [
            'Pre-KG', 'L.K.G', 'U.K.G',
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
          ];
          classData = fallbackStandards.map(std => ({
            _id: `fallback-${std}-A`,
            class: std,
            section: 'A',
            isFallback: true
          }));
        }

        setClasses(classData);

        if (routeRes.status === 'fulfilled' && Array.isArray(routeRes.value.data)) {
          setRoutes(routeRes.value.data);
        }

        if (feeRes.status === 'fulfilled' && Array.isArray(feeRes.value.data)) {
          setFeeCategories(feeRes.value.data);
        }

        // If in Edit Mode, fetch existing student details
        if (isEditMode) {
          const studentRes = await axios.get(`/api/schooladmin/students/${id}`, config);
          const student = studentRes.data;

          if (student) {
            const classObj = student.class_id;
            const stdClass = classObj?.class || student.class || '';
            const stdSection = classObj?.section || student.section || '';
            const stdSectionId = classObj?._id || '';

            setSelectedClass(stdClass);
            const sections = classData.filter(c => String(c.class) === String(stdClass));
            setAvailableSections(sections.length > 0 ? sections : (classObj ? [classObj] : []));

            const matchedClass = classData.find(c =>
              (stdSectionId && String(c._id) === String(stdSectionId)) ||
              (String(c.class) === String(stdClass) && String(c.section) === String(stdSection))
            );

            const effectiveClassId = matchedClass?._id || stdSectionId;

            reset({
              student_name: student.student_name || '',
              first_name: student.first_name || '',
              last_name: student.last_name || '',
              date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : (student.dob ? student.dob.split('T')[0] : ''),
              gender: student.gender || 'Male',
              blood_group: student.blood_group || 'N/A',
              nationality: student.nationality || 'Indian',
              mother_tongue: student.mother_tongue || '',
              student_status: student.student_status || 'Active',
              age: student.age || '',

              admission_number: student.admission_number || '',
              admission_date: student.admission_date ? student.admission_date.split('T')[0] : (student.createdAt ? student.createdAt.split('T')[0] : ''),
              academic_year: student.academic_year || '2025-2026',
              class_id: stdSectionId,
              class: stdClass,
              section: classObj?.section || student.section || '',
              roll_no: student.roll_no || '',
              admission_type: student.admission_type || 'Regular',
              stream_group: student.stream_group || student.group || 'Science',
              group: student.stream_group || student.group || 'Science',
              medium_of_instruction: student.medium_of_instruction || 'English',
              second_language: student.second_language || '',
              registration_no: student.registration_no || '',
              house: student.house || '',
              student_type: student.student_type || 'Day Scholar',

              father_name: student.father_name || '',
              mother_name: student.mother_name || '',
              guardian_name: student.guardian_name || student.parent_name || '',
              guardian_relation: student.guardian_relation || 'Father',
              guardian_phone: student.guardian_phone || student.parent_phone || '',
              guardian_email: student.guardian_email || student.parent_email || '',
              whatsapp_number: student.whatsapp_number || '',
              alternate_phone: student.alternate_phone || '',

              address_line: student.address_line || student.address || '',
              city: student.city || '',
              district: student.district || '',
              state: student.state || '',
              pincode: student.pincode || '',
              guardian_address: student.guardian_address || student.address || '',

              apaar_id: student.apaar_id || '',
              pen_number: student.pen_number || '',
              emis_id: student.emis_id || '',
              aadhaar_last4: student.aadhaar_last4 || '',
              religion: student.religion || 'General',
              community_category: student.community_category || 'General',
              caste: student.caste || '',
              economic_category: student.economic_category || 'General',
              is_cwsn: Boolean(student.is_cwsn),
              disability_type: student.disability_type || '',
              sibling_admission_no: student.sibling_admission_no || '',

              previous_school_name: student.previous_school_name || '',
              previous_class_completed: student.previous_class_completed || '',
              previous_tc_number: student.previous_tc_number || '',

              transport_required: Boolean(student.transport_required),
              route_name: student.route_name || '',
              stop_name: student.stop_name || '',
              fee_category: student.fee_category || '',

              emergency_contact_name: student.emergency_contact_name || '',
              emergency_contact_phone: student.emergency_contact_phone || '',
              allergies: student.allergies || '',
              medical_notes: student.medical_notes || '',

              login_email: student.parent_user_id?.email || student.parent_email || '',
              login_phone: student.parent_user_id?.phone || student.parent_phone || ''
            });

            if (student.photo) {
              setPhotoPreview(student.photo);
              setPhotoBase64(student.photo);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to load form details');
        setLoading(false);
      }
    };

    const token = user?.token || user?.accessToken || (typeof localStorage !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}')?.token || localStorage.getItem('token')) : '') || '';
    if (token) fetchData();
    else setLoading(false);
  }, [user, id, isEditMode, reset]);

  // Extract unique class names (standards)
  const uniqueClassNames = [...new Set(classes.map(c => c.class).filter(Boolean))];

  // Options for Class selection showing full class details
  const classOptions = classes.map(c => {
    const stdName = String(c.class || '').startsWith('Class') || String(c.class || '').includes('K.G')
      ? c.class
      : `Class ${c.class}`;
    const label = `${stdName} - Section ${c.section}`;
    const teacherName = c.class_incharge_id?.name || c.class_incharge_id?.email;
    const studentCount = typeof c.no_student === 'number' ? `${c.no_student} students enrolled` : null;
    const details = [
      teacherName ? `In-charge: ${teacherName}` : null,
      studentCount
    ].filter(Boolean).join(' • ');

    return {
      value: c._id,
      standard: c.class,
      section: c.section,
      label,
      sublabel: details || undefined
    };
  });

  // Handle selecting a class from the Class Details dropdown
  const handleClassSelect = (classId) => {
    const matched = classes.find(c => String(c._id) === String(classId));
    if (matched) {
      const realId = String(matched._id).startsWith('fallback-') ? '' : matched._id;
      setValue('class_id', realId);
      setValue('class', matched.class);
      setValue('section', matched.section);
      setSelectedClass(matched.class);

      const sections = classes.filter(c => String(c.class) === String(matched.class));
      setAvailableSections(sections.length > 0 ? sections : [matched]);
    } else {
      const matchedByStd = classes.find(c => String(c.class) === String(classId));
      if (matchedByStd) {
        handleClassSelect(matchedByStd._id);
      }
    }
  };

  // Handle changing section
  const handleSectionSelect = (sectionClassId) => {
    const matched = classes.find(c => String(c._id) === String(sectionClassId));
    if (matched) {
      const realId = String(matched._id).startsWith('fallback-') ? '' : matched._id;
      setValue('class_id', realId);
      setValue('section', matched.section);
      setValue('class', matched.class);
    }
  };

  // When route changes, fetch stops for that route if available
  useEffect(() => {
    const fetchStopsForRoute = async () => {
      if (!watchSelectedRoute) {
        setStops([]);
        return;
      }
      const matchedRoute = routes.find(r => r.route_name === watchSelectedRoute || r.name === watchSelectedRoute || r._id === watchSelectedRoute);
      if (matchedRoute?._id) {
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data } = await axios.get(`/api/transport/routes/${matchedRoute._id}/stops`, config);
          if (Array.isArray(data)) setStops(data);
        } catch {
          setStops([]);
        }
      }
    };
    if (user?.token && watchSelectedRoute) fetchStopsForRoute();
  }, [watchSelectedRoute, routes, user]);

  // Convert uploaded photo to Base64 for storage
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        toast.error('Photo size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyAddress = () => {
    const full = [watchAddressLine, watchCity, watchDistrict, watchState, watchPincode].filter(Boolean).join(', ');
    setValue('guardian_address', full || watchAddressLine);
    toast.info('Address copied to Guardian Address');
  };

  const onSubmit = async (data) => {
    if (!isEditMode && data.login_password !== data.login_confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        ...data,
        photo: photoBase64
      };

      if (isEditMode) {
        await axios.put(`/api/schooladmin/students/${id}`, payload, config);
        toast.success('Student updated successfully!');
      } else {
        const res = await axios.post('/api/schooladmin/students', payload, config);
        if (res.data.parentPassword) {
          toast.success(`Student created! Parent Password: ${res.data.parentPassword}`, { autoClose: false });
        } else {
          toast.success('Student created successfully!');
        }
      }
      navigate('/school-admin/students');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const sectionTabs = [
    { id: 'basic', label: '1. Basic Info', icon: User },
    { id: 'academic', label: '2. Academic', icon: GraduationCap },
    { id: 'guardian', label: '3. Parents', icon: Users },
    { id: 'contact', label: '4. Address', icon: MapPin },
    { id: 'additional', label: '5. Additional', icon: FileText },
    { id: 'previous', label: '6. Previous School', icon: School },
    { id: 'transport', label: '7. Transport & Fee', icon: Bus },
    { id: 'medical', label: '8. Medical', icon: HeartPulse },
    { id: 'documents', label: '9. Photo & Login', icon: ImageIcon }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-500 font-semibold text-sm">
        Loading student details form...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {isEditMode ? 'Edit Student Details' : 'New Student Admission'}
          </h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/students')}>Students</span>
            <span>-</span>
            <span className="text-blue-600">{isEditMode ? 'Edit' : 'Create'}</span>
          </div>
        </div>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk CSV/Excel Import
          </button>
        )}
      </div>

      <BulkStudentImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => navigate('/school-admin/students')}
      />

      {/* Quick Section Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSectionTab(tab.id);
                const el = document.getElementById(`section-${tab.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-16">
        {/* ========================================================================= */}
        {/* SECTION 1: Student Basic Information                                      */}
        {/* ========================================================================= */}
        <div id="section-basic" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <User className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">1. Student Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input
                {...register('first_name', { required: 'First Name is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="First Name"
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.first_name.message}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Last Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                {...register('last_name')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Last Name"
              />
            </div>

            {/* Student Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Student Name <span className="text-red-500">*</span></label>
              <input
                {...register('student_name', { required: 'Full Student Name is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Full Student Name"
              />
              {errors.student_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.student_name.message}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
              <input
                type="date"
                {...register('date_of_birth', { required: 'Date of Birth is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
              />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.date_of_birth.message}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Gender <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
                value={watch('gender') || 'Male'}
                onChange={(val) => setValue('gender', val)}
                placeholder="Select Gender"
              />
              <input type="hidden" {...register('gender', { required: 'Gender is required' })} />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Blood Group</label>
              <SearchableSelect
                options={[
                  { value: 'N/A', label: 'N/A' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' }
                ]}
                value={watch('blood_group') || 'N/A'}
                onChange={(val) => setValue('blood_group', val)}
                placeholder="Select Blood Group"
              />
              <input type="hidden" {...register('blood_group')} />
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Nationality</label>
              <input
                {...register('nationality')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Indian"
              />
            </div>

            {/* Mother Tongue */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Mother Tongue</label>
              <input
                {...register('mother_tongue')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Tamil, Hindi, English"
              />
            </div>

            {/* Student Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Student Status <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Suspended', label: 'Suspended' },
                  { value: 'Transferred', label: 'Transferred' },
                  { value: 'Graduated', label: 'Graduated' }
                ]}
                value={watch('student_status') || 'Active'}
                onChange={(val) => setValue('student_status', val)}
                placeholder="Select Status"
              />
              <input type="hidden" {...register('student_status', { required: 'Status is required' })} />
            </div>

            {/* Age (Optional / Computed) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Age <span className="text-slate-400 font-normal">(Years)</span></label>
              <input
                type="number"
                {...register('age')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. 14"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: Admission & Academic Information                              */}
        {/* ========================================================================= */}
        <div id="section-academic" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <GraduationCap className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">2. Admission & Academic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admission Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Admission Number <span className="text-red-500">*</span></label>
              <input
                {...register('admission_number', { required: 'Admission Number is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="e.g. ADM2026-001"
              />
              {errors.admission_number && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.admission_number.message}</p>}
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Admission Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                {...register('admission_date', { required: 'Admission Date is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
              />
              {errors.admission_date && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.admission_date.message}</p>}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Academic Year <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={[
                  { value: '2024-2025', label: '2024-2025' },
                  { value: '2025-2026', label: '2025-2026' },
                  { value: '2026-2027', label: '2026-2027' },
                  { value: '2027-2028', label: '2027-2028' }
                ]}
                value={watch('academic_year') || '2025-2026'}
                onChange={(val) => setValue('academic_year', val)}
                placeholder="Select Academic Year"
              />
              <input type="hidden" {...register('academic_year', { required: 'Academic Year is required' })} />
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Class <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={classOptions}
                value={watch('class_id') || (classes.find(c => String(c.class) === String(watch('class')) && String(c.section) === String(watch('section')))?._id) || ''}
                onChange={(val) => handleClassSelect(val)}
                placeholder="Select Class & Section"
                searchPlaceholder="Search class standard, section, or teacher..."
              />
              <input type="hidden" {...register('class', { required: 'Class is required' })} />
              {errors.class && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.class.message}</p>}
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Section <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={availableSections.map(s => {
                  const teacher = s.class_incharge_id?.name || s.class_incharge_id?.email;
                  return {
                    value: s._id,
                    label: `Section ${s.section}`,
                    sublabel: teacher ? `In-charge: ${teacher}` : undefined
                  };
                })}
                value={watch('class_id') || (classes.find(c => String(c.class) === String(watch('class')) && String(c.section) === String(watch('section')))?._id) || ''}
                onChange={(val) => handleSectionSelect(val)}
                placeholder={selectedClass ? 'Select Section' : 'Select Class First'}
                searchPlaceholder="Search section..."
                disabled={!selectedClass && availableSections.length === 0}
              />
              <input type="hidden" {...register('section', { required: 'Section is required' })} />
              <input type="hidden" {...register('class_id')} />
              {errors.section && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.section.message}</p>}
            </div>

            {/* Roll No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Roll No. <span className="text-red-500">*</span></label>
              <input
                {...register('roll_no', { required: 'Roll No. is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="e.g. 101"
              />
              {errors.roll_no && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.roll_no.message}</p>}
            </div>

            {/* Admission Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Admission Type</label>
              <SearchableSelect
                options={[
                  { value: 'Regular', label: 'Regular' },
                  { value: 'Transfer', label: 'Transfer' },
                  { value: 'Lateral Entry', label: 'Lateral Entry' },
                  { value: 'RTE', label: 'RTE (Right to Education)' },
                  { value: 'Management', label: 'Management' },
                  { value: 'Merit', label: 'Merit' },
                  { value: 'Scholarship', label: 'Scholarship' }
                ]}
                value={watch('admission_type') || 'Regular'}
                onChange={(val) => setValue('admission_type', val)}
                placeholder="Select Admission Type"
              />
              <input type="hidden" {...register('admission_type')} />
            </div>

            {/* Stream / Group */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Stream / Group</label>
              <SearchableSelect
                options={[
                  { value: 'Science', label: 'Science' },
                  { value: 'Commerce', label: 'Commerce' },
                  { value: 'Arts/Humanities', label: 'Arts/Humanities' },
                  { value: 'General', label: 'General' }
                ]}
                value={watch('stream_group') || watch('group') || 'Science'}
                onChange={(val) => {
                  setValue('stream_group', val);
                  setValue('group', val);
                }}
                placeholder="Select Stream/Group"
              />
              <input type="hidden" {...register('stream_group')} />
              <input type="hidden" {...register('group')} />
            </div>

            {/* Medium of Instruction */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Medium of Instruction</label>
              <SearchableSelect
                options={[
                  { value: 'English', label: 'English' },
                  { value: 'Hindi', label: 'Hindi' },
                  { value: 'Tamil', label: 'Tamil' },
                  { value: 'Telugu', label: 'Telugu' },
                  { value: 'Kannada', label: 'Kannada' },
                  { value: 'Malayalam', label: 'Malayalam' },
                  { value: 'Marathi', label: 'Marathi' },
                  { value: 'Gujarati', label: 'Gujarati' },
                  { value: 'Bengali', label: 'Bengali' },
                  { value: 'Other', label: 'Other' }
                ]}
                value={watch('medium_of_instruction') || 'English'}
                onChange={(val) => setValue('medium_of_instruction', val)}
                placeholder="Select Medium"
              />
              <input type="hidden" {...register('medium_of_instruction')} />
            </div>

            {/* Second Language */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Second Language</label>
              <input
                {...register('second_language')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Hindi, Sanskrit, French, Tamil"
              />
            </div>

            {/* Registration No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Registration No. <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                {...register('registration_no')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Registration Number"
              />
            </div>

            {/* House */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">School House</label>
              <SearchableSelect
                options={[
                  { value: 'Red', label: 'Red House' },
                  { value: 'Blue', label: 'Blue House' },
                  { value: 'Green', label: 'Green House' },
                  { value: 'Yellow', label: 'Yellow House' },
                  { value: 'Ruby', label: 'Ruby House' },
                  { value: 'Emerald', label: 'Emerald House' },
                  { value: 'Sapphire', label: 'Sapphire House' },
                  { value: 'Diamond', label: 'Diamond House' }
                ]}
                value={watch('house') || ''}
                onChange={(val) => setValue('house', val)}
                placeholder="Select House"
              />
              <input type="hidden" {...register('house')} />
            </div>

            {/* Student Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Student Type</label>
              <SearchableSelect
                options={[
                  { value: 'Day Scholar', label: 'Day Scholar' },
                  { value: 'Hosteler', label: 'Hosteler' },
                  { value: 'Day Boarder', label: 'Day Boarder' }
                ]}
                value={watch('student_type') || 'Day Scholar'}
                onChange={(val) => setValue('student_type', val)}
                placeholder="Select Student Type"
              />
              <input type="hidden" {...register('student_type')} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: Parent & Guardian Information                                 */}
        {/* ========================================================================= */}
        <div id="section-guardian" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <Users className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">3. Parent & Guardian Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Father Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Father's Name</label>
              <input
                {...register('father_name')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Father's Full Name"
              />
            </div>

            {/* Mother Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Mother's Name</label>
              <input
                {...register('mother_name')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Mother's Full Name"
              />
            </div>

            {/* Primary Guardian Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Primary Guardian Name <span className="text-red-500">*</span></label>
              <input
                {...register('guardian_name', { required: 'Guardian Name is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="Guardian Full Name"
              />
              {errors.guardian_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.guardian_name.message}</p>}
            </div>

            {/* Guardian Relationship */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Relationship <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={[
                  { value: 'Father', label: 'Father' },
                  { value: 'Mother', label: 'Mother' },
                  { value: 'Brother', label: 'Brother' },
                  { value: 'Sister', label: 'Sister' },
                  { value: 'Uncle', label: 'Uncle' },
                  { value: 'Aunt', label: 'Aunt' },
                  { value: 'Guardian', label: 'Guardian' },
                  { value: 'Other', label: 'Other' }
                ]}
                value={watch('guardian_relation') || 'Father'}
                onChange={(val) => setValue('guardian_relation', val)}
                placeholder="Select Relationship"
              />
              <input type="hidden" {...register('guardian_relation', { required: 'Guardian Relationship is required' })} />
            </div>

            {/* Guardian Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Phone Number <span className="text-red-500">*</span></label>
              <input
                {...register('guardian_phone', { required: 'Guardian Phone is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="10-digit Phone Number"
              />
              {errors.guardian_phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.guardian_phone.message}</p>}
            </div>

            {/* Guardian Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Email Address</label>
              <input
                type="email"
                {...register('guardian_email')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="guardian@example.com"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">WhatsApp Number</label>
              <input
                {...register('whatsapp_number')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="WhatsApp Contact Number"
              />
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Alternate Contact Phone</label>
              <input
                {...register('alternate_phone')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Alternate Phone Number"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: Contact & Address Information                                 */}
        {/* ========================================================================= */}
        <div id="section-contact" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-800">4. Contact & Address Information</h3>
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Copy to Guardian Address
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Line */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Street Address / House No. <span className="text-red-500">*</span></label>
              <input
                {...register('address_line', { required: 'Address is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="House / Flat No., Building, Street Name"
              />
              {errors.address_line && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.address_line.message}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">City <span className="text-red-500">*</span></label>
              <input
                {...register('city', { required: 'City is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="City Name"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.city.message}</p>}
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">District</label>
              <input
                {...register('district')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="District Name"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">State <span className="text-red-500">*</span></label>
              <input
                {...register('state', { required: 'State is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="State Name"
              />
              {errors.state && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.state.message}</p>}
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Pincode / Postal Code <span className="text-red-500">*</span></label>
              <input
                {...register('pincode', { required: 'Pincode is required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="6-digit Pincode"
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.pincode.message}</p>}
            </div>

            {/* Guardian Full Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Address <span className="text-slate-400 font-normal">(Optional permanent address)</span></label>
              <textarea
                {...register('guardian_address')}
                rows="2"
                className="block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Guardian permanent communication address"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: Additional Student Information                                */}
        {/* ========================================================================= */}
        <div id="section-additional" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <FileText className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">5. Additional Student Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* APAAR ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">APAAR ID <span className="text-slate-400 font-normal">(12-digit)</span></label>
              <input
                {...register('apaar_id')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="Automated Permanent Academic ID"
              />
            </div>

            {/* PEN Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">PEN Number <span className="text-slate-400 font-normal">(UDISE+)</span></label>
              <input
                {...register('pen_number')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="Permanent Education Number"
              />
            </div>

            {/* EMIS ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">EMIS ID</label>
              <input
                {...register('emis_id')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                placeholder="State EMIS Registration ID"
              />
            </div>

            {/* Aadhaar (Last 4 Digits) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Aadhaar (Last 4 Digits Only)</label>
              <input
                maxLength={4}
                {...register('aadhaar_last4')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold tracking-widest"
                placeholder="XXXX"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Security policy: Store only the last 4 digits.</p>
            </div>

            {/* Religion */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Religion</label>
              <SearchableSelect
                options={[
                  { value: 'Hinduism', label: 'Hinduism' },
                  { value: 'Islam', label: 'Islam' },
                  { value: 'Christianity', label: 'Christianity' },
                  { value: 'Sikhism', label: 'Sikhism' },
                  { value: 'Buddhism', label: 'Buddhism' },
                  { value: 'Jainism', label: 'Jainism' },
                  { value: 'Other', label: 'Other' },
                  { value: 'General', label: 'General / Prefer not to say' }
                ]}
                value={watch('religion') || 'General'}
                onChange={(val) => setValue('religion', val)}
                placeholder="Select Religion"
              />
              <input type="hidden" {...register('religion')} />
            </div>

            {/* Community Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Community Category</label>
              <SearchableSelect
                options={[
                  { value: 'General', label: 'General / OC' },
                  { value: 'OBC', label: 'OBC (Other Backward Class)' },
                  { value: 'BCM', label: 'BCM (Backward Class Muslim)' },
                  { value: 'MBC', label: 'MBC (Most Backward Class)' },
                  { value: 'SC', label: 'SC (Scheduled Caste)' },
                  { value: 'ST', label: 'ST (Scheduled Tribe)' },
                  { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
                  { value: 'Other', label: 'Other' }
                ]}
                value={watch('community_category') || 'General'}
                onChange={(val) => setValue('community_category', val)}
                placeholder="Select Community"
              />
              <input type="hidden" {...register('community_category')} />
            </div>

            {/* Caste */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Caste</label>
              <input
                {...register('caste')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Caste / Sub-caste"
              />
            </div>

            {/* Economic Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Economic Category</label>
              <SearchableSelect
                options={[
                  { value: 'General', label: 'General' },
                  { value: 'BPL', label: 'BPL (Below Poverty Line)' },
                  { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
                  { value: 'APL', label: 'APL (Above Poverty Line)' }
                ]}
                value={watch('economic_category') || 'General'}
                onChange={(val) => setValue('economic_category', val)}
                placeholder="Select Economic Category"
              />
              <input type="hidden" {...register('economic_category')} />
            </div>

            {/* Sibling Admission No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Sibling Admission No.</label>
              <input
                {...register('sibling_admission_no')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Admission No. of Sibling in this school"
              />
            </div>

            {/* CWSN Checkbox & Disability Type */}
            <div className="md:col-span-3 flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_cwsn')}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">Children with Special Needs (CWSN)</span>
              </label>

              {watchIsCwsn && (
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    {...register('disability_type')}
                    className="block w-full h-10 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold"
                    placeholder="Specify Disability Type (e.g. Visual, Hearing, Locomotor)"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: Previous School Information                                   */}
        {/* ========================================================================= */}
        <div id="section-previous" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <School className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">6. Previous School Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Previous School Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Previous School Name</label>
              <input
                {...register('previous_school_name')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Name of Previous School"
              />
            </div>

            {/* Previous Class Completed */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Previous Class Completed</label>
              <input
                {...register('previous_class_completed')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Class 9"
              />
            </div>

            {/* Previous TC Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Previous TC Number</label>
              <input
                {...register('previous_tc_number')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Transfer Certificate (TC) Number"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7: Transport & Fee Information                                    */}
        {/* ========================================================================= */}
        <div id="section-transport" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <Bus className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">7. Transport & Fee Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fee Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Fee Category</label>
              <SearchableSelect
                options={[
                  ...feeCategories.map(f => ({ value: f.name, label: `${f.name} (${f.code})` })),
                  { value: 'General Fee', label: 'General Fee' },
                  { value: 'RTE Quota', label: 'RTE Quota' },
                  { value: 'Staff Child', label: 'Staff Child' },
                  { value: 'Scholarship', label: 'Scholarship' }
                ]}
                value={watch('fee_category') || ''}
                onChange={(val) => setValue('fee_category', val)}
                placeholder="Select Fee Category"
              />
              <input type="hidden" {...register('fee_category')} />
            </div>

            {/* Transport Required Toggle */}
            <div className="md:col-span-2 flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('transport_required')}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">School Bus / Transport Required</span>
                  <p className="text-[10px] text-slate-400 font-medium">Enable to allocate student to a transport route and bus stop.</p>
                </div>
              </label>
            </div>

            {/* Route Name (shown or active if transport is needed) */}
            {watchTransportRequired && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Route Name</label>
                  <SearchableSelect
                    options={routes.map(r => ({ value: r.route_name || r.name, label: r.route_name || r.name }))}
                    value={watch('route_name') || ''}
                    onChange={(val) => {
                      setValue('route_name', val);
                      setValue('stop_name', '');
                    }}
                    placeholder="Select Transport Route"
                  />
                  <input type="hidden" {...register('route_name')} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Pickup / Drop Stop Name</label>
                  <SearchableSelect
                    options={stops.map(s => ({ value: s.stop_name || s.name, label: s.stop_name || s.name }))}
                    value={watch('stop_name') || ''}
                    onChange={(val) => setValue('stop_name', val)}
                    placeholder={watchSelectedRoute ? 'Select Stop' : 'Select Route First'}
                  />
                  <input type="hidden" {...register('stop_name')} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 8: Medical & Emergency Information                               */}
        {/* ========================================================================= */}
        <div id="section-medical" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 text-blue-600">
            <HeartPulse className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-800">8. Medical & Emergency Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emergency Contact Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Emergency Contact Person</label>
              <input
                {...register('emergency_contact_name')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Name of person to contact in emergency"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Emergency Contact Phone</label>
              <input
                {...register('emergency_contact_phone')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Emergency Phone Number"
              />
            </div>

            {/* Allergies */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Known Allergies / Food Restrictions</label>
              <input
                {...register('allergies')}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Peanuts, Penicillin, Dust, Asthmatic"
              />
            </div>

            {/* Medical Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Medical Notes & Precautions</label>
              <textarea
                {...register('medical_notes')}
                rows="3"
                className="block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Any special medical conditions, ongoing treatments, or physical guidelines..."
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 9: Documents, Photo & Parent Login Account                       */}
        {/* ========================================================================= */}
        <div id="section-documents" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo Upload Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-6">
              <ImageIcon className="w-5 h-5" />
              <span className="text-base font-black text-slate-800">9. Student Photo</span>
            </div>

            {photoPreview ? (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md group">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview('');
                    setPhotoBase64('');
                  }}
                  className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
                >
                  Remove Picture
                </button>
              </div>
            ) : (
              <label className="w-44 h-44 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all text-slate-450 hover:text-blue-600">
                <Upload className="w-8 h-8" />
                <span className="text-xs font-bold">Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-[10px] text-slate-400 font-semibold mt-3">Accepts PNG, JPG, or JPEG (Max 2MB)</p>
          </div>

          {/* Parent Login Account Card */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-6">
              <Lock className="w-5 h-5" />
              <span className="text-base font-black text-slate-800">Parent Login Account Credentials</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Login Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Login Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  {...register('login_email', { required: 'Login Email is required' })}
                  className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  placeholder="parent@example.com"
                />
                {errors.login_email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.login_email.message}</p>}
              </div>

              {/* Login Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Login Phone <span className="text-red-500">*</span></label>
                <input
                  {...register('login_phone', { required: 'Login Phone is required' })}
                  className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-semibold"
                  placeholder="Phone Number"
                />
                {errors.login_phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.login_phone.message}</p>}
              </div>

              {!isEditMode && (
                <>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      {...register('login_password', { required: 'Password is required' })}
                      className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                    />
                    {errors.login_password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.login_password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      {...register('login_confirm_password', {
                        required: 'Please confirm password',
                        validate: value => value === watchPassword || 'Passwords do not match'
                      })}
                      className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                    />
                    {errors.login_confirm_password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.login_confirm_password.message}</p>}
                  </div>
                </>
              )}
            </div>
            {isEditMode && (
              <p className="text-[11px] text-slate-400 mt-4 font-semibold">
                Parent login credentials can be managed or reset if necessary.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/school-admin/students')}
            className="px-6 py-3 border border-slate-200 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <button
            type="submit"
            className="px-8 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isEditMode ? 'Update Student Details' : 'Save Student Admission'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentCreate;

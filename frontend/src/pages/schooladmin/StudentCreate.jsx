import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, Users, FileSpreadsheet, Upload, ArrowLeft } from 'lucide-react';

const StudentCreate = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [availableSections, setAvailableSections] = useState([]);
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      group: 'Science',
      gender: 'Male',
      blood_group: 'N/A',
      religion: 'Islam',
      guardian_relation: 'Father',
      login_password: '123456',
      login_confirm_password: '123456'
    }
  });

  const watchPassword = watch('login_password');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/schooladmin/classes', config);
        setClasses(data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch classes');
        setLoading(false);
      }
    };
    if (user?.token) fetchClasses();
  }, [user]);

  // Extract unique class names (standards)
  const uniqueClassNames = [...new Set(classes.map(c => c.class))];

  // Update sections when class standard is selected
  const handleClassChange = (className) => {
    setSelectedClass(className);
    const sections = classes.filter(c => c.class === className);
    setAvailableSections(sections);
    setValue('section', '');
    setValue('class_id', '');
  };

  const handleSectionChange = (classId) => {
    setValue('class_id', classId);
  };

  // Convert uploaded photo to Base64 for database storage
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

  const onSubmit = async (data) => {
    if (data.login_password !== data.login_confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        ...data,
        photo: photoBase64
      };

      const res = await axios.post('/api/schooladmin/students', payload, config);
      if (res.data.parentPassword) {
        toast.success(`Student created! Parent Password: ${res.data.parentPassword}`, { autoClose: false });
      } else {
        toast.success('Student created successfully!');
      }
      navigate('/school-admin/students');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    }
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-medium">Loading form configuration...</div>;

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Student</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/students')}>Students</span>
            <span>-</span>
            <span className="text-blue-600">Create</span>
          </div>
        </div>
        <button 
          type="button"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <FileSpreadsheet className="w-4 h-4" />
          CSV/Xlsx Upload File
        </button>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-12">
        {/* Student Information Form Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
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

            {/* Father Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Father Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input 
                {...register('father_name')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Father Name"
              />
            </div>

            {/* Mother Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Mother Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input 
                {...register('mother_name')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Mother Name"
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Class <span className="text-red-500">*</span></label>
              <select 
                onChange={(e) => handleClassChange(e.target.value)}
                value={selectedClass}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="">Select Class</option>
                {uniqueClassNames.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
              <input type="hidden" {...register('class_id', { required: 'Please select Class and Section' })} />
            </div>

            {/* Group */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Group <span className="text-red-500">*</span></label>
              <select 
                {...register('group')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts/Humanities">Arts/Humanities</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Section <span className="text-red-500">*</span></label>
              <select 
                onChange={(e) => handleSectionChange(e.target.value)}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                disabled={!selectedClass}
              >
                <option value="">{selectedClass ? 'Select Section' : 'Select Class First'}</option>
                {availableSections.map((s) => (
                  <option key={s._id} value={s._id}>{s.section}</option>
                ))}
              </select>
              {errors.class_id && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.class_id.message}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Gender <span className="text-slate-400 font-normal"> (optional)</span></label>
              <select 
                {...register('gender')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Roll No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Roll No. <span className="text-red-500">*</span></label>
              <input 
                {...register('roll_no', { required: 'Roll No. is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Roll No."
              />
              {errors.roll_no && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.roll_no.message}</p>}
            </div>

            {/* Registration No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Registration No. <span className="text-slate-400 font-normal"> (optional)</span></label>
              <input 
                {...register('registration_no')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Register NO"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Blood Group <span className="text-slate-400 font-normal"> (optional)</span></label>
              <select 
                {...register('blood_group')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="N/A">N/A</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Religion */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Religion <span className="text-slate-400 font-normal"> (optional)</span></label>
              <select 
                {...register('religion')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="Islam">Islam</option>
                <option value="Hinduism">Hinduism</option>
                <option value="Christianity">Christianity</option>
                <option value="Buddhism">Buddhism</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Admission Number */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Admission Number <span className="text-slate-400 font-normal"> (optional)</span></label>
              <input 
                {...register('admission_number')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Admission Number"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Address <span className="text-slate-400 font-normal"> (optional)</span></label>
              <textarea 
                {...register('address')} 
                rows="3"
                className="block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Address"
              />
            </div>
          </div>
        </div>

        {/* Guardian Information Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8">
          <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto mb-8">
            <div className="flex items-center gap-2.5 text-blue-600 font-bold mb-1.5">
              <Users className="w-5 h-5" />
              <span className="text-lg font-black text-slate-800">Guardian Information</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Please provide the guardian's details for communication and emergency contact purposes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guardian Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Name <span className="text-red-500">*</span></label>
              <input 
                {...register('guardian_name', { required: 'Guardian Name is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Enter Guardian Full Name"
              />
              {errors.guardian_name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.guardian_name.message}</p>}
            </div>

            {/* Guardian Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Email Address <span className="text-slate-400 font-normal"> (Optional)</span></label>
              <input 
                type="email"
                {...register('guardian_email')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Enter Guardian Email Address"
              />
            </div>

            {/* Guardian Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Phone Number <span className="text-red-500">*</span></label>
              <input 
                {...register('guardian_phone', { required: 'Guardian Phone Number is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Enter Guardian Phone Number"
              />
              {errors.guardian_phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.guardian_phone.message}</p>}
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Relationship <span className="text-red-500">*</span></label>
              <select 
                {...register('guardian_relation', { required: 'Required' })}
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Guardian Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Address <span className="text-slate-400 font-normal"> (Optional)</span></label>
              <textarea 
                {...register('guardian_address')} 
                rows="3"
                className="block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Enter Guardian Address"
              />
            </div>
          </div>
        </div>

        {/* Login Details Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8">
          <div className="flex items-center justify-center gap-2.5 text-blue-600 font-bold mb-8">
            <Lock className="w-5 h-5" />
            <span className="text-lg font-black text-slate-800">Login Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Login Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input 
                type="email"
                {...register('login_email', { required: 'Login Email is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Email"
              />
              {errors.login_email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.login_email.message}</p>}
            </div>

            {/* Login Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
              <input 
                {...register('login_phone', { required: 'Login Phone is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Phone"
              />
              {errors.login_phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.login_phone.message}</p>}
            </div>

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
          </div>
        </div>

        {/* Student Picture (optional) Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8">
          <div className="flex items-center justify-center gap-2.5 text-blue-600 font-bold mb-8">
            <span className="text-lg font-black text-slate-800">Student Picture <span className="text-slate-400 font-normal text-sm">(optional)</span></span>
          </div>

          <div className="flex flex-col items-center justify-center">
            {photoPreview ? (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg group">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(''); setPhotoBase64(''); }}
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-4">
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
            className="px-8 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center"
          >
            Save Student
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentCreate;

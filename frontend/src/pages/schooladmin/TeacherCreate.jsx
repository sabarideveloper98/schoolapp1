import { useState } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, FileSpreadsheet, Upload, ArrowLeft } from 'lucide-react';

const TeacherCreate = () => {
  const [loading, setLoading] = useState(false);
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      login_password: '123456',
      login_confirm_password: '123456'
    }
  });

  const watchPassword = watch('login_password');

  // Convert uploaded photo to Base64
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
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        qualification: data.qualification,
        experience: Number(data.experience),
        domains: data.domains,
        password: data.login_password,
        photo: photoBase64
      };

      await axios.post('http://localhost:5005/api/schooladmin/teachers', payload, config);
      toast.success('Teacher created successfully!');
      navigate('/school-admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Teacher</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/teachers')}>Teachers</span>
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
        {/* Teacher Information Form Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Teacher Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Teacher Name <span className="text-red-500">*</span></label>
              <input 
                {...register('name', { required: 'Teacher Name is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Teacher Full Name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input 
                type="email"
                {...register('email', { required: 'Email Address is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Enter Email Address"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
              <input 
                {...register('phone', { required: 'Phone Number is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Enter Phone Number"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>}
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Qualification <span className="text-red-500">*</span></label>
              <input 
                {...register('qualification', { required: 'Qualification is required' })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. B.Ed, M.Sc"
              />
              {errors.qualification && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.qualification.message}</p>}
            </div>

            {/* Experience (Years) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Experience (Years) <span className="text-red-500">*</span></label>
              <input 
                type="number"
                {...register('experience', { required: 'Experience is required', min: { value: 0, message: 'Must be 0 or more' } })} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. 5"
              />
              {errors.experience && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.experience.message}</p>}
            </div>

            {/* Domains / Subjects */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Subjects taught <span className="text-slate-400 font-normal"> (optional, comma-separated)</span></label>
              <input 
                {...register('domains')} 
                className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Mathematics, Physics"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Address <span className="text-red-500">*</span></label>
              <textarea 
                {...register('address', { required: 'Address is required' })} 
                rows="3"
                className="block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Teacher Address"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.address.message}</p>}
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

        {/* Teacher Picture Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8">
          <div className="flex items-center justify-center gap-2.5 text-blue-600 font-bold mb-8">
            <span className="text-lg font-black text-slate-800">Teacher Picture <span className="text-slate-400 font-normal text-sm">(optional)</span></span>
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
            onClick={() => navigate('/school-admin/teachers')}
            className="px-6 py-3 border border-slate-200 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherCreate;

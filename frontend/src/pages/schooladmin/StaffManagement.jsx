import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, FileText, Upload, CheckCircle2, X, Eye, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import SearchableSelect from '../../components/SearchableSelect';
import BulkStaffImportModal, { downloadStaffSampleCSV } from '../../components/BulkStaffImportModal';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [aadhaarBase64, setAadhaarBase64] = useState('');
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [aadhaarFileType, setAadhaarFileType] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const { user } = useAuthStore();
  const { register, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm();

  const password = watch('password');

  const fetchStaff = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/staff', config);
      setStaff(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch staff');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchStaff();
  }, [user]);

  const handleAadhaarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Unsupported file format. Please upload PDF, JPG, JPEG, or PNG.');
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit. Please select a smaller file.');
      e.target.value = '';
      return;
    }

    setAadhaarFileName(file.name);
    setAadhaarFileType(file.type.toLowerCase());

    const reader = new FileReader();
    reader.onload = () => {
      setAadhaarBase64(reader.result);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const removeAadhaar = () => {
    setAadhaarBase64('');
    setAadhaarFileName('');
    setAadhaarFileType('');
  };

  const onSubmit = async (data) => {
    if (data.password || data.confirmPassword) {
      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    const payload = {
      ...data,
      aadhaar_copy: aadhaarBase64
    };

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`/api/schooladmin/staff/${editingId}`, payload, config);
        toast.success(`Staff updated successfully!`, { autoClose: 3000 });
      } else {
        await axios.post('/api/schooladmin/staff', payload, config);
        toast.success(`Staff created successfully!`, { autoClose: 3000 });
      }
      closeForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} staff`);
    }
  };

  const handleEdit = (staffMember) => {
    setEditMode(true);
    setEditingId(staffMember._id);
    setIsFormOpen(true);
    setValue('name', staffMember.name);
    setValue('role', staffMember.role);
    setValue('email', staffMember.email);
    setValue('phone', staffMember.phone);
    setValue('address', staffMember.address);
    setValue('qualification', staffMember.qualification);
    setValue('experience', staffMember.experience);
    setValue('password', '');
    setValue('confirmPassword', '');

    if (staffMember.aadhaar_copy) {
      setAadhaarBase64(staffMember.aadhaar_copy);
      setAadhaarFileName('Existing Aadhaar Document (KYC)');
      setAadhaarFileType(staffMember.aadhaar_copy.startsWith('data:application/pdf') ? 'application/pdf' : 'image');
    } else {
      setAadhaarBase64('');
      setAadhaarFileName('');
      setAadhaarFileType('');
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    setAadhaarBase64('');
    setAadhaarFileName('');
    setAadhaarFileType('');
    reset();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this staff member?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/schooladmin/staff/${id}`, config);
        toast.success('Staff deleted');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading staff...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/40">
        <h2 className="text-lg font-bold text-slate-800">Staff Management</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadStaffSampleCSV}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            title="Download sample staff CSV template"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Download Sample File
          </button>
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Import Staff
          </button>
          <button
            onClick={() => { reset(); setEditMode(false); setEditingId(null); setAadhaarBase64(''); setAadhaarFileName(''); setAadhaarFileType(''); setIsFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Staff
          </button>
        </div>
      </div>

      <div className="p-6">
        {isFormOpen && (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-inner">
            <h3 className="text-md font-bold mb-5 text-slate-800">{editMode ? 'Edit Staff' : 'Add New Staff (Driver, Peon, etc.)'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                <input 
                  {...register('name', { required: 'Required' })} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role/Designation</label>
                <SearchableSelect 
                  options={[
                    { value: 'Driver', label: 'Driver' },
                    { value: 'Peon', label: 'Peon' },
                    { value: 'Security', label: 'Security' },
                    { value: 'Cleaner', label: 'Cleaner' },
                    { value: 'Clerk', label: 'Clerk' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  value={watch('role')}
                  onChange={(val) => setValue('role', val, { shouldValidate: true })}
                  placeholder="Select Role"
                  searchPlaceholder="Search role..."
                  buttonClassName="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (Optional)</label>
                <input 
                  type="email" 
                  {...register('email')} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. john@school.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                <input 
                  {...register('phone', { required: 'Required' })} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. +1 555-0188"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                <input 
                  {...register('address')} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. 456 Oak Ave"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Qualification</label>
                <input 
                  {...register('qualification', { required: 'Required' })} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. High School Diploma"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Experience (Years)</label>
                <input 
                  type="number" 
                  {...register('experience', { required: 'Required' })} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. 3"
                />
              </div>

              {/* Aadhaar Copy (KYC) Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Aadhaar Copy (KYC) <span className="text-xs text-slate-400 font-normal">(PDF, JPG, JPEG, PNG - Max 5MB)</span>
                </label>
                <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{aadhaarFileName ? 'Change Aadhaar Copy' : 'Upload Aadhaar Copy'}</span>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" 
                      onChange={handleAadhaarChange} 
                      className="hidden" 
                    />
                  </label>

                  {aadhaarFileName && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-700">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="truncate max-w-[200px]">{aadhaarFileName}</span>
                      {aadhaarBase64 && (
                        <button
                          type="button"
                          onClick={() => setViewingDoc({ name: aadhaarFileName, url: aadhaarBase64, isPdf: aadhaarFileType === 'application/pdf' || aadhaarBase64.startsWith('data:application/pdf') })}
                          className="text-blue-600 hover:text-blue-800 ml-1 p-0.5"
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={removeAadhaar} 
                        className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                        title="Remove document"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password {editMode && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password', { required: editMode ? false : 'Required' })}
                    className="block w-full h-12 px-4 pr-10 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('confirmPassword', {
                      required: editMode ? false : 'Required',
                      validate: value => {
                        if (editMode && !password && !value) return true;
                        return value === password || "Passwords do not match";
                      }
                    })}
                    className="block w-full h-12 px-4 pr-10 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                type="button" 
                onClick={closeForm} 
                className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
              >
                {editMode ? 'Update Staff' : 'Save Staff'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aadhaar (KYC)</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{s.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500"><span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold">{s.role}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="font-semibold text-slate-700">{s.phone}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {s.aadhaar_copy ? (
                      <button
                        type="button"
                        onClick={() => setViewingDoc({ name: `${s.name} - Aadhaar Document`, url: s.aadhaar_copy, isPdf: s.aadhaar_copy.startsWith('data:application/pdf') })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="View Aadhaar KYC document"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified (KYC)</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Pending KYC</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                    <button 
                      onClick={() => handleEdit(s)} 
                      className="text-blue-600 hover:text-blue-500 hover:scale-115 transition-all inline-block cursor-pointer"
                      title="Edit Staff"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleDelete(s._id)} 
                      className="text-red-600 hover:text-red-500 hover:scale-115 transition-all inline-block ml-4 cursor-pointer"
                      title="Delete Staff"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-semibold">No staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Document Secure Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">{viewingDoc.name}</h3>
              </div>
              <button 
                onClick={() => setViewingDoc(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              {viewingDoc.isPdf ? (
                <iframe 
                  src={viewingDoc.url} 
                  title="Aadhaar Document PDF Preview" 
                  className="w-full h-[500px] rounded-xl border border-slate-200"
                />
              ) : (
                <img 
                  src={viewingDoc.url} 
                  alt="Aadhaar Document Preview" 
                  className="max-h-[500px] max-w-full rounded-xl object-contain border border-slate-100 shadow-sm"
                />
              )}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setViewingDoc(null)} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Staff Import Modal */}
      <BulkStaffImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          fetchStaff();
        }}
      />
    </div>
  );
};

export default StaffManagement;

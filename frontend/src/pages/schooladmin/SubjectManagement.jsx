import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchSubjects = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/schooladmin/subjects', config);
      setSubjects(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch subjects');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchSubjects();
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`http://localhost:5005/api/schooladmin/subjects/${editingId}`, data, config);
        toast.success('Subject updated!');
      } else {
        await axios.post('http://localhost:5005/api/schooladmin/subjects', data, config);
        toast.success('Subject created!');
      }
      closeForm();
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} subject`);
    }
  };

  const handleEdit = (subject) => {
    setEditMode(true);
    setEditingId(subject._id);
    setIsFormOpen(true);
    setValue('name', subject.name);
    setValue('code', subject.code);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this subject?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5005/api/schooladmin/subjects/${id}`, config);
        toast.success('Subject deleted');
        fetchSubjects();
      } catch (error) {
        toast.error('Failed to delete subject');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading subjects...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
        <h2 className="text-lg font-bold text-slate-800">Subject Management</h2>
        <button 
          onClick={() => { reset(); setEditMode(false); setEditingId(null); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Subject
        </button>
      </div>

      <div className="p-6">
        {isFormOpen && (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-inner">
            <h3 className="text-md font-bold mb-5 text-slate-800">{editMode ? 'Edit Subject' : 'Add New Subject'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Name</label>
                <input 
                  {...register('name', { required: 'Required' })} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. Mathematics" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Code</label>
                <input 
                  {...register('code', { required: 'Required' })} 
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  placeholder="e.g. MATH101" 
                />
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
                {editMode ? 'Update Subject' : 'Save Subject'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{sub.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{sub.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                    <button 
                      onClick={() => handleEdit(sub)} 
                      className="text-blue-600 hover:text-blue-500 cursor-pointer hover:scale-110 transition-transform inline-block"
                      title="Edit Subject"
                    >
                      <Edit className="w-5 h-5 inline" />
                    </button>
                    <button 
                      onClick={() => handleDelete(sub._id)} 
                      className="text-red-600 hover:text-red-500 ml-4 cursor-pointer hover:scale-110 transition-transform inline-block"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400 font-semibold">No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;

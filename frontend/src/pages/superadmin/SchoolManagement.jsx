import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import SchoolTable from '../../components/SchoolTable';
import SchoolForm from '../../components/SchoolForm';

const SchoolManagement = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const { user } = useAuthStore();

  const fetchSchools = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/superadmin/schools', config);
      setSchools(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch schools data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchSchools();
    }
  }, [user]);

  const handleCreateOrUpdateSchool = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingSchool) {
        await axios.put(`/api/superadmin/schools/${editingSchool._id}`, data, config);
        toast.success('School updated successfully');
      } else {
        const res = await axios.post('/api/superadmin/schools', data, config);
        toast.success(`School created! Admin password: ${res.data.adminPassword}`, { autoClose: false });
      }
      setIsFormOpen(false);
      setEditingSchool(null);
      fetchSchools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/superadmin/schools/${id}`, config);
        toast.success('School deleted');
        fetchSchools();
      } catch (error) {
        toast.error('Failed to delete school');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading schools...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
        <h2 className="text-lg font-bold text-slate-800">Manage Schools</h2>
        <button
          onClick={() => { setEditingSchool(null); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add School
        </button>
      </div>

      <div className="p-6">
        {isFormOpen ? (
          <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-inner">
            <h3 className="text-md font-bold mb-4 text-slate-800">{editingSchool ? 'Edit School' : 'Add New School'}</h3>
            <SchoolForm
              onSubmit={handleCreateOrUpdateSchool}
              defaultValues={editingSchool}
              onCancel={() => { setIsFormOpen(false); setEditingSchool(null); }}
            />
          </div>
        ) : null}

        {schools.length > 0 ? (
          <SchoolTable
            schools={schools}
            onEdit={(school) => { setEditingSchool(school); setIsFormOpen(true); }}
            onDelete={handleDeleteSchool}
          />
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No schools found.</p>
            <p className="text-sm text-slate-400 mt-1">Click the "Add School" button to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolManagement;

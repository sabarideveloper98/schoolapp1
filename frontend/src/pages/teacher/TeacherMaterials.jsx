import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  BookOpen, 
  Upload, 
  Trash2, 
  FileText, 
  Link as LinkIcon, 
  Video, 
  Image as ImageIcon,
  Plus,
  ExternalLink,
  Search
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherMaterials = () => {
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [materialType, setMaterialType] = useState('Document'); // Document | Video | Link | Image
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [matRes, clsRes] = await Promise.all([
        axios.get('/api/teacher/materials', config),
        axios.get('/api/teacher/classes', config)
      ]);
      setMaterials(matRes.data);
      setClasses(clsRes.data);
      if (clsRes.data.length > 0) setSelectedClass(clsRes.data[0]._id);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load study materials');
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !selectedClass) return toast.error('Please fill required fields');
    setUploading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teacher/materials', {
        title,
        description,
        class_id: selectedClass,
        type: materialType,
        file_url: fileUrl
      }, config);

      setMaterials([data, ...materials]);
      toast.success('Study material uploaded successfully');
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/teacher/materials/${id}`, config);
      setMaterials(materials.filter(m => m._id !== id));
      toast.success('Material deleted successfully');
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'Video': return <Video className="w-5 h-5 text-rose-500" />;
      case 'Link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
      case 'Image': return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-indigo-500" />;
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
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Study Materials & Notes
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Upload and manage PDFs, slides, assignments, and video resources.</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Upload Material
        </button>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {materials.map((item) => (
          <div key={item._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  {getIconForType(item.type)}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                  Class {item.class_id?.class || 'Assigned'} - {item.class_id?.section || ''}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-800 text-base leading-snug">{item.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 line-clamp-2">{item.description || 'No description provided.'}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {item.file_url && (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </a>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {materials.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No study materials uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Upload Material" above to add your first resource.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" /> Upload Study Material
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Math Formula Sheet"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Target Class</label>
                  <SearchableSelect
                    options={classes.map(c => ({
                      value: c._id,
                      label: `Class ${c.class} - ${c.section}`
                    }))}
                    value={selectedClass}
                    onChange={(val) => setSelectedClass(val)}
                    placeholder="Select class..."
                    searchPlaceholder="Search class..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Resource Type</label>
                  <SearchableSelect
                    options={[
                      { value: 'Document', label: 'Document (PDF/Doc)' },
                      { value: 'Video', label: 'Video Tutorial' },
                      { value: 'Link', label: 'External Link' },
                      { value: 'Image', label: 'Diagram / Image' }
                    ]}
                    value={materialType}
                    onChange={(val) => setMaterialType(val)}
                    placeholder="Select type..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Resource File URL / Link</label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://youtube.com/..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description / Instructions</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this material covers..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;

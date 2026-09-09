import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BookOpen, Plus, FileText, CheckCircle2, Clock, Download, X, Award, Eye
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const TeacherHomework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedHomework, setSelectedHomework] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject_name: 'Mathematics',
    description: '',
    instructions: '',
    category: 'Homework',
    assignment_type: 'Class',
    assigned_classes: [],
    assigned_section: '',
    assigned_students: [],
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    attachment_url: '',
    video_link: '',
    max_marks: 100
  });

  const [reviewForm, setReviewForm] = useState({
    marks_obtained: '',
    remarks: '',
    status: 'Approved'
  });

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [listRes, classesRes, studentsRes] = await Promise.all([
        axios.get('http://localhost:5005/api/homework/list', config),
        axios.get('http://localhost:5005/api/schooladmin/classes', config),
        axios.get('http://localhost:5005/api/schooladmin/students', config)
      ]);
      setHomeworkList(listRes.data || []);
      setClassesList(classesRes.data || []);
      setStudentsList(studentsRes.data || []);
    } catch (error) {
      toast.error('Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5005/api/homework/create', form, config);
      toast.success('Homework assigned successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign homework');
    }
  };

  const handleFetchDetails = async (hwId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5005/api/homework/details/${hwId}`, config);
      setSelectedHomework(res.data);
    } catch (error) {
      toast.error('Failed to fetch submission details');
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5005/api/homework/evaluate', {
        submission_id: selectedSubmission._id,
        ...reviewForm
      }, config);
      toast.success('Evaluation saved successfully');
      setSelectedSubmission(null);
      if (selectedHomework) handleFetchDetails(selectedHomework.homework._id);
      fetchData();
    } catch (error) {
      toast.error('Failed to save evaluation');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Teacher Homework Portal...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Teacher Homework & Evaluations</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Assign homework to your classes & grade student submissions.</p>
        </div>

        <button
          onClick={() => {
            setForm({
              title: '',
              subject_name: 'Mathematics',
              description: '',
              instructions: '',
              category: 'Homework',
              assignment_type: 'Class',
              assigned_classes: classesList[0] ? [classesList[0]._id] : [],
              assigned_section: '',
              assigned_students: [],
              due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
              attachment_url: '',
              video_link: '',
              max_marks: 100
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Homework
        </button>
      </div>

      {/* Homework List & Evaluation Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Assigned Homework List */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Assigned Homework ({homeworkList.length})</h3>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {homeworkList.map(hw => (
              <div
                key={hw._id}
                onClick={() => handleFetchDetails(hw._id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedHomework?.homework?._id === hw._id
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {hw.category}
                  </span>
                  <span className="text-[11px] font-bold text-rose-600">Due: {new Date(hw.due_date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-black text-slate-800 text-sm mt-2 line-clamp-1">{hw.title}</h4>
                <p className="text-xs font-bold text-blue-600">{hw.subject_name}</p>
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                  <span>Submissions: <strong className="text-slate-700">{hw.stats?.totalSubmitted || 0}/{hw.stats?.totalAssigned || 0}</strong></span>
                  <span className="text-blue-600 font-bold">View Submissions →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Submissions & Grading Drawer */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          {!selectedHomework ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-sm">Select a homework from the list to grade student submissions.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {selectedHomework.homework?.subject_name}
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-1">{selectedHomework.homework?.title}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">{selectedHomework.homework?.description}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-4 rounded-l-xl">Student Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submission Notes</th>
                      <th className="py-3 px-4">Grade</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {selectedHomework.assignments?.map(assign => {
                      const sub = selectedHomework.submissions?.find(s => s.student_id?._id === assign.student_id?._id || s.student_id === assign.student_id?._id);
                      const rev = selectedHomework.reviews?.find(r => r.student_id?._id === assign.student_id?._id || r.student_id === assign.student_id?._id);

                      return (
                        <tr key={assign._id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-black text-slate-800">{assign.student_id?.student_name}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              assign.status === 'Reviewed' ? 'bg-purple-100 text-purple-800' :
                              assign.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {assign.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs line-clamp-1">{sub?.submission_notes || '-'}</td>
                          <td className="py-3.5 px-4 font-black text-purple-600">{rev ? `${rev.marks_obtained}/${selectedHomework.homework?.max_marks}` : '-'}</td>
                          <td className="py-3.5 px-4 text-right">
                            {sub ? (
                              <button
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setReviewForm({
                                    marks_obtained: rev?.marks_obtained || '',
                                    remarks: rev?.remarks || '',
                                    status: rev?.status || 'Approved'
                                  });
                                }}
                                className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg text-xs"
                              >
                                {rev ? 'Re-Grade' : 'Grade'}
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs font-semibold">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Assign Homework</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Homework Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Select Class *</label>
                <select
                  value={form.assigned_classes[0] || ''}
                  onChange={(e) => setForm({ ...form, assigned_classes: [e.target.value] })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.class || c.class_name || 'Class'} ({c.section || 'A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Description *</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Subject *</label>
                  <input
                    type="text"
                    value={form.subject_name}
                    onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Upload Homework File (PDF/DOCX/JPG/PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setForm({ ...form, attachment_url: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Grade Student Homework</h3>
              <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Marks Obtained (Max: {selectedHomework?.homework?.max_marks}) *</label>
                <input
                  type="number"
                  value={reviewForm.marks_obtained}
                  onChange={(e) => setReviewForm({ ...reviewForm, marks_obtained: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Status *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="Approved">Approved</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Teacher Remarks</label>
                <textarea
                  rows="3"
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedSubmission(null)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-xl font-bold">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHomework;

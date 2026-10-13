import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BookOpen, Plus, FileText, CheckCircle2, Clock, Download, X, Award, Eye,
  CheckCircle, AlertCircle, FileCheck, Calendar, Users, ExternalLink
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const TeacherHomework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedHomework, setSelectedHomework] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const isTeacher = user?.role === 'Teacher';
      const classesUrl = isTeacher ? '/api/teacher/classes' : '/api/schooladmin/classes';
      const studentsUrl = isTeacher ? '/api/teacher/students' : '/api/schooladmin/students';

      const [listRes, classesRes, studentsRes] = await Promise.all([
        axios.get('/api/homework/list', config),
        axios.get(classesUrl, config),
        axios.get(studentsUrl, config)
      ]);

      const fetchedHw = Array.isArray(listRes.data) ? listRes.data : [];
      const fetchedClasses = Array.isArray(classesRes.data) ? classesRes.data : [];
      const fetchedStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];

      setHomeworkList(fetchedHw);
      setClassesList(fetchedClasses);
      setStudentsList(fetchedStudents);

      if (fetchedHw.length > 0 && !selectedHomework) {
        handleFetchDetails(fetchedHw[0]._id);
      }
    } catch (error) {
      console.error('Failed to load homework data:', error);
      toast.error('Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  const handleFetchDetails = async (hwId) => {
    try {
      setDetailsLoading(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const res = await axios.get(`/api/homework/details/${hwId}`, config);
      setSelectedHomework(res.data);
    } catch (error) {
      console.error('Failed to fetch homework details:', error);
      toast.error('Failed to fetch submission details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    if (!form.assigned_classes || form.assigned_classes.length === 0 || !form.assigned_classes[0]) {
      toast.error('Please select a target class');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await axios.post('/api/homework/create', form, config);
      toast.success('Homework assigned successfully');
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to assign homework:', error);
      toast.error(error.response?.data?.message || 'Failed to assign homework');
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await axios.post('/api/homework/evaluate', {
        submission_id: selectedSubmission._id,
        ...reviewForm
      }, config);
      toast.success('Evaluation saved successfully');
      setSelectedSubmission(null);
      if (selectedHomework?.homework?._id) {
        handleFetchDetails(selectedHomework.homework._id);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to save evaluation:', error);
      toast.error('Failed to save evaluation');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] bg-white rounded-2xl border border-slate-100 p-8 shadow-xs">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-base font-bold text-slate-700">Loading Homework Portal...</div>
        <div className="text-xs text-slate-400 mt-1">Fetching assignments and student submissions</div>
      </div>
    );
  }

  // Aggregate stats across homework list
  const totalAssignedCount = homeworkList.reduce((acc, h) => acc + (h.stats?.totalAssigned || 0), 0);
  const totalSubmittedCount = homeworkList.reduce((acc, h) => acc + (h.stats?.totalSubmitted || 0), 0);
  const totalReviewedCount = homeworkList.reduce((acc, h) => acc + (h.stats?.totalReviewed || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Homework & Assignments
          </div>
          <h2 className="text-2xl font-black tracking-tight">Teacher Homework & Evaluations</h2>
          <p className="text-xs text-blue-100 mt-1">
            Assign homework to your classes & grade student submissions in real-time
          </p>
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
          className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Homework
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Homework</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{homeworkList.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Assigned to students</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{totalSubmittedCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">From {totalAssignedCount} assigned</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Graded / Reviewed</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalReviewedCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Evaluated submissions</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{Math.max(0, totalSubmittedCount - totalReviewedCount)}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Awaiting teacher grading</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Homework List & Evaluation Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Homework List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Assigned Homework ({homeworkList.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">Click to grade</span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {homeworkList.map((hw) => {
              const isSelected = selectedHomework?.homework?._id === hw._id;
              const due = new Date(hw.due_date);
              const isOverdue = due < new Date();

              return (
                <div
                  key={hw._id}
                  onClick={() => handleFetchDetails(hw._id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {hw.category || 'Homework'}
                    </span>
                    <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                      Due: {due.toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-sm mt-2 line-clamp-1">{hw.title}</h4>
                  <p className="text-xs font-bold text-blue-600 mt-0.5">{hw.subject_name}</p>

                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                    <span>Submissions: <strong className="text-slate-800">{hw.stats?.totalSubmitted || 0}/{hw.stats?.totalAssigned || 0}</strong></span>
                    <span className="text-blue-600 font-bold hover:underline">View →</span>
                  </div>
                </div>
              );
            })}

            {homeworkList.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-600">No homework created yet</div>
                <p className="text-[11px] text-slate-400 mt-1">Click "Create Homework" above to assign coursework.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submissions & Grading Drawer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          {detailsLoading ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-bold text-xs">Loading submission details...</p>
            </div>
          ) : !selectedHomework ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">Select a homework to view and grade student submissions</p>
              <p className="text-xs text-slate-400">Review student work, grade responses, and record feedback.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Homework Details Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    {selectedHomework.homework?.subject_name}
                  </span>
                  <div className="text-xs font-bold text-slate-400">
                    Max Marks: <span className="text-slate-800 font-black">{selectedHomework.homework?.max_marks || 100}</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-2">{selectedHomework.homework?.title}</h3>
                <p className="text-xs font-medium text-slate-600 mt-1">{selectedHomework.homework?.description}</p>

                {selectedHomework.homework?.attachment_url && (
                  <div className="mt-3">
                    <a
                      href={selectedHomework.homework.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Homework Attachment
                    </a>
                  </div>
                )}
              </div>

              {/* Submissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submission Notes</th>
                      <th className="py-3 px-4">Grade</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {selectedHomework.assignments?.map((assign) => {
                      const studentId = assign.student_id?._id || assign.student_id;
                      const sub = selectedHomework.submissions?.find(
                        (s) => (s.student_id?._id || s.student_id) === studentId
                      );
                      const rev = selectedHomework.reviews?.find(
                        (r) => (r.student_id?._id || r.student_id) === studentId
                      );

                      return (
                        <tr key={assign._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {assign.student_id?.student_name || 'Student'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                assign.status === 'Reviewed'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : assign.status === 'Submitted'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {assign.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                            {sub?.submission_notes || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-black text-purple-700">
                            {rev ? `${rev.marks_obtained}/${selectedHomework.homework?.max_marks || 100}` : '—'}
                          </td>
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
                                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                              >
                                {rev ? 'Re-Grade' : 'Grade'}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">Not submitted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {(!selectedHomework.assignments || selectedHomework.assignments.length === 0) && (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-slate-400 font-semibold">
                          No students assigned to this homework yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE HOMEWORK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Assign Homework</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Homework Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Practice Exercises"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Class *</label>
                <SearchableSelect
                  options={classesList.map((c) => ({
                    value: c._id,
                    label: `${c.class || c.class_name || 'Class'} (${c.section || 'A'})`
                  }))}
                  value={form.assigned_classes[0] || ''}
                  onChange={(val) => setForm({ ...form, assigned_classes: [val] })}
                  placeholder="Choose Class..."
                  searchPlaceholder="Search class..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description *</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the homework tasks and requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                  <input
                    type="text"
                    value={form.subject_name}
                    onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Homework">Homework</option>
                    <option value="Class Work">Class Work</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Project Work">Project Work</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={form.max_marks}
                    onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Attach File (PDF/DOCX/JPG/PNG)</label>
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  Assign Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Grade Student Homework</h3>
              <button 
                onClick={() => setSelectedSubmission(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Marks Obtained (Max: {selectedHomework?.homework?.max_marks || 100}) *
                </label>
                <input
                  type="number"
                  max={selectedHomework?.homework?.max_marks || 100}
                  min={0}
                  value={reviewForm.marks_obtained}
                  onChange={(e) => setReviewForm({ ...reviewForm, marks_obtained: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Approved">Approved</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teacher Remarks</label>
                <textarea
                  rows="3"
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  placeholder="Feedback for the student..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setSelectedSubmission(null)} 
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHomework;
